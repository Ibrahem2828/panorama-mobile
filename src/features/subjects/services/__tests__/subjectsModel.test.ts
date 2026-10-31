import {
  buildSemesterSections,
  collectYears,
  filterSubjects,
  formatLevelChip,
  formatSemesterName,
  formatYearName,
  getSubjectBadges,
  normalizeCatalogDetail,
  normalizeCatalogSubject,
} from '../subjectsModel';
import type { CatalogSubject, SubjectFilters } from '../../types';

const words = {
  academicYear: (name: string) => `السنة ${name}`,
  semester: (name: string) => `الفصل ${name}`,
};

function row(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    name: 'خوارزميات 1',
    code: 'CS201',
    academic_year: { id: 2, name: 'الثانية', order: 2 },
    semester: { id: 10, name: 'الأول', order: 1 },
    major: null,
    faculty: { id: 5, name: 'المعلوماتية' },
    in_current_term: false,
    is_enrolled: false,
    has_description: true,
    ...overrides,
  };
}

function subject(overrides: Record<string, unknown> = {}): CatalogSubject {
  const parsed = normalizeCatalogSubject(row(overrides));
  if (!parsed) throw new Error('fixture must parse');
  return parsed;
}

const none: SubjectFilters = { term: 'all', academicYearId: null, search: '' };

describe('normalizeCatalogSubject', () => {
  it('maps the contract row', () => {
    expect(
      normalizeCatalogSubject(
        row({ major: { id: 3, name: 'ذكاء' }, is_enrolled: true, in_current_term: true }),
      ),
    ).toEqual({
      id: 1,
      name: 'خوارزميات 1',
      code: 'CS201',
      academicYear: { id: 2, name: 'الثانية', order: 2 },
      semester: { id: 10, name: 'الأول', order: 1 },
      major: { id: 3, name: 'ذكاء' },
      faculty: { id: 5, name: 'المعلوماتية' },
      inCurrentTerm: true,
      isEnrolled: true,
      hasDescription: true,
    });
  });

  it('keeps a subject whose year, semester, major or code is missing', () => {
    expect(
      normalizeCatalogSubject(row({ academic_year: null, semester: null, code: null })),
    ).toMatchObject({ academicYear: null, semester: null, code: null, major: null });
  });

  it('treats flags that are not literally true as false and drops unusable rows', () => {
    expect(normalizeCatalogSubject(row({ is_enrolled: 'yes', in_current_term: 1 }))).toMatchObject({
      isEnrolled: false,
      inCurrentTerm: false,
    });
    expect(normalizeCatalogSubject(row({ id: 'x' }))).toBeNull();
    expect(normalizeCatalogSubject(row({ name: '  ' }))).toBeNull();
    expect(normalizeCatalogSubject(null)).toBeNull();
    expect(normalizeCatalogSubject('garbage')).toBeNull();
  });
});

describe('normalizeCatalogDetail', () => {
  it('carries the full description', () => {
    expect(normalizeCatalogDetail(row({ description: '  مقدمة في الخوارزميات  ' }))).toMatchObject({
      description: 'مقدمة في الخوارزميات',
      hasDescription: true,
    });
  });

  it('maps an empty or missing description to null so the screen shows its empty text', () => {
    for (const description of ['', '   ', null, undefined]) {
      const detail = normalizeCatalogDetail(row({ description, has_description: false }));

      expect(detail?.description).toBeNull();
      expect(detail?.hasDescription).toBe(false);
    }
  });

  it('is null for a malformed payload', () => {
    expect(normalizeCatalogDetail({})).toBeNull();
  });
});

describe('level labels', () => {
  it('adds the year and semester words only when the name does not carry them already', () => {
    expect(formatYearName('الثالثة', words)).toBe('السنة الثالثة');
    expect(formatYearName('السنة الثالثة', words)).toBe('السنة الثالثة');
    expect(formatSemesterName('الأول', words)).toBe('الفصل الأول');
    expect(formatSemesterName('الفصل الأول', words)).toBe('الفصل الأول');
  });

  it('builds the card chip «السنة · الفصل»', () => {
    expect(
      formatLevelChip(subject({ academic_year: { id: 3, name: 'الثالثة', order: 3 } }), words),
    ).toBe('السنة الثالثة · الفصل الأول');
    expect(formatLevelChip(subject({ academic_year: null }), words)).toBe('الفصل الأول');
    expect(formatLevelChip(subject({ academic_year: null, semester: null }), words)).toBeNull();
  });
});

describe('badges', () => {
  it('shows «enrolled» only for an enrolled subject and «current term» only for the current term', () => {
    expect(getSubjectBadges(subject())).toEqual([]);
    expect(getSubjectBadges(subject({ is_enrolled: true }))).toEqual(['enrolled']);
    expect(getSubjectBadges(subject({ in_current_term: true }))).toEqual(['currentTerm']);
    expect(getSubjectBadges(subject({ is_enrolled: true, in_current_term: true }))).toEqual([
      'enrolled',
      'currentTerm',
    ]);
  });
});

describe('filterSubjects', () => {
  const list = [
    subject({ id: 1, name: 'خوارزميات 1', in_current_term: true }),
    subject({
      id: 2,
      name: 'قواعد معطيات',
      code: 'DB301',
      academic_year: { id: 3, name: 'الثالثة', order: 3 },
      semester: { id: 11, name: 'الثاني', order: 2 },
    }),
    subject({
      id: 3,
      name: 'Operating Systems',
      code: 'OS310',
      academic_year: { id: 3, name: 'الثالثة', order: 3 },
      in_current_term: true,
    }),
  ];

  it('keeps everything with no filter and keeps the server order', () => {
    expect(filterSubjects(list, none).map((s) => s.id)).toEqual([1, 2, 3]);
  });

  it('filters by current / other term', () => {
    expect(filterSubjects(list, { ...none, term: 'current' }).map((s) => s.id)).toEqual([1, 3]);
    expect(filterSubjects(list, { ...none, term: 'other' }).map((s) => s.id)).toEqual([2]);
  });

  it('filters by year (ids may be numbers or strings)', () => {
    expect(filterSubjects(list, { ...none, academicYearId: 3 }).map((s) => s.id)).toEqual([2, 3]);
    expect(filterSubjects(list, { ...none, academicYearId: '2' }).map((s) => s.id)).toEqual([1]);
  });

  it('searches the name and the code, ignoring case', () => {
    expect(filterSubjects(list, { ...none, search: 'db30' }).map((s) => s.id)).toEqual([2]);
    expect(filterSubjects(list, { ...none, search: ' operating ' }).map((s) => s.id)).toEqual([3]);
    expect(filterSubjects(list, { ...none, search: 'خوارز' }).map((s) => s.id)).toEqual([1]);
    expect(filterSubjects(list, { ...none, search: 'nothing' })).toEqual([]);
  });

  it('combines all filters', () => {
    expect(
      filterSubjects(list, { term: 'current', academicYearId: 3, search: 'os' }).map((s) => s.id),
    ).toEqual([3]);
  });
});

describe('collectYears', () => {
  it('lists each year once, in study order', () => {
    const years = collectYears([
      subject({ id: 1, academic_year: { id: 3, name: 'الثالثة', order: 3 } }),
      subject({ id: 2 }),
      subject({ id: 3, academic_year: { id: 3, name: 'الثالثة', order: 3 } }),
      subject({ id: 4, academic_year: null }),
    ]);

    expect(years.map((y) => y.id)).toEqual([2, 3]);
  });
});

describe('buildSemesterSections', () => {
  const first = { id: 10, name: 'الأول', order: 1 };
  const second = { id: 11, name: 'الثاني', order: 2 };
  const list = [
    subject({ id: 1, semester: first }),
    subject({ id: 2, semester: second, in_current_term: true }),
    subject({ id: 3, semester: first }),
    subject({ id: 4, semester: null }),
    subject({ id: 5, semester: second, in_current_term: true }),
  ];

  it('puts the current semester first, then the others by order, and subjects without one last', () => {
    const sections = buildSemesterSections(list, 11);

    expect(sections.map((s) => s.key)).toEqual(['11', '10', 'none']);
    expect(sections.map((s) => s.isCurrent)).toEqual([true, false, false]);
    expect(sections[0]?.data.map((s) => s.id)).toEqual([2, 5]);
    // The server's order inside a section is kept.
    expect(sections[1]?.data.map((s) => s.id)).toEqual([1, 3]);
  });

  it('infers the current section from current-term subjects when the term is unknown', () => {
    const sections = buildSemesterSections(list, null);

    expect(sections.map((s) => s.key)).toEqual(['11', '10', 'none']);
    expect(sections[0]?.isCurrent).toBe(true);
  });

  it('falls back to semester order when nothing marks a current term', () => {
    const sections = buildSemesterSections(
      [subject({ id: 1, semester: second }), subject({ id: 2, semester: first })],
      null,
    );

    expect(sections.map((s) => s.key)).toEqual(['10', '11']);
    expect(sections.some((s) => s.isCurrent)).toBe(false);
  });

  it('is empty for no subjects', () => {
    expect(buildSemesterSections([], 10)).toEqual([]);
  });
});
