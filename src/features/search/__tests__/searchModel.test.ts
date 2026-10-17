import {
  buildTypesParam,
  canShowMore,
  clampLimit,
  normalizeSearchResponse,
  searchQueryState,
} from '../services/searchModel';

describe('searchQueryState', () => {
  it('trims and enforces the 2..50 window', () => {
    expect(searchQueryState('  ab ')).toMatchObject({ query: 'ab', valid: true });
    expect(searchQueryState('a')).toMatchObject({ valid: false, tooShort: true });
    expect(searchQueryState('')).toMatchObject({ valid: false, tooShort: false });
    expect(searchQueryState('x'.repeat(51))).toMatchObject({ valid: false, tooLong: true });
  });
});

describe('clampLimit', () => {
  it('keeps the limit inside 1..20', () => {
    expect(clampLimit(0)).toBe(1);
    expect(clampLimit(99)).toBe(20);
    expect(clampLimit(7.9)).toBe(7);
    expect(clampLimit(Number.NaN)).toBe(5);
  });
});

describe('buildTypesParam', () => {
  it('always names the offered types so lectures are never requested', () => {
    expect(buildTypesParam([])).toBe('subjects,groups,files,announcements');
    expect(buildTypesParam(['file', 'subject'])).toBe('subjects,files');
  });
});

describe('normalizeSearchResponse', () => {
  const payload = {
    subjects: [
      { id: 1, name: 'تشريح', code: 'ANA101', academic_year: 'الأولى', semester: 'الأول' },
    ],
    groups: [{ id: '2', name: 'دفعة', description: 'وصف' }],
    files: [
      { id: 3, title: 'ملخص', subject_name: 'تشريح', file_type: 'pdf', group_id: null },
      { id: 4, title: 'ملف مجموعة', file_type: 'png', group_id: 9 },
      { id: 'bad', title: 'x' },
      'garbage',
    ],
    announcements: [{ id: 5, title: 'إعلان', description: 'نص' }],
    lectures: [{ id: 6, title: 'محاضرة' }],
    counts: { subjects: 1, groups: 1, files: 12, announcements: 1, lectures: 3 },
  };

  it('maps every offered kind and ignores lectures and malformed rows', () => {
    const result = normalizeSearchResponse(payload);

    expect(result.subjects[0]).toMatchObject({
      id: 1,
      title: 'تشريح',
      subtitle: 'ANA101 · الأولى · الأول',
    });
    expect(result.groups[0]?.id).toBe('2');
    expect(result.files.map((file) => file.id)).toEqual([3, 4]);
    expect(result.files[0]).toMatchObject({ subtitle: 'تشريح · PDF', inGroup: false });
    expect(result.files[1]?.inGroup).toBe(true);
    expect(result.announcements).toHaveLength(1);
    expect(result.counts.file).toBe(12);
    expect(result.total).toBe(15);
  });

  it('falls back to the returned count when the declared one is smaller or missing', () => {
    const result = normalizeSearchResponse({ files: [{ id: 1 }, { id: 2 }], counts: { files: 1 } });

    expect(result.counts.file).toBe(2);
  });

  it('survives an unexpected payload', () => {
    expect(normalizeSearchResponse(null).total).toBe(0);
    expect(normalizeSearchResponse('x').files).toEqual([]);
  });

  it('offers "show more" only while hits are hidden and the cap is not reached', () => {
    const result = normalizeSearchResponse(payload);

    expect(canShowMore(result, 'file', 5)).toBe(true);
    expect(canShowMore(result, 'file', 20)).toBe(false);
    expect(canShowMore(result, 'subject', 5)).toBe(false);
  });
});
