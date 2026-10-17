import {
  filterAcademicOptions,
  getAutoSelectOption,
  normalizeSearchText,
} from '../optionSelection';

const one = [{ id: 1, name: 'الجامعة السورية الخاصة' }];
const many = [
  { id: 1, name: 'كلية الطب البشري', code: 'MED' },
  { id: 2, name: 'كلية الصيدلة', code: 'PHA' },
  { id: 3, name: 'كلية إدارة الأعمال' },
];

describe('getAutoSelectOption', () => {
  it('selects the only option when nothing is chosen', () => {
    expect(getAutoSelectOption(one, null)).toEqual(one[0]);
  });

  it('does nothing while loading, when already selected, or with several options', () => {
    expect(getAutoSelectOption(one, null, true)).toBeNull();
    expect(getAutoSelectOption(one, 1)).toBeNull();
    expect(getAutoSelectOption(many, null)).toBeNull();
    expect(getAutoSelectOption([], null)).toBeNull();
  });
});

describe('filterAcademicOptions', () => {
  it('returns everything for an empty query', () => {
    expect(filterAcademicOptions(many, '  ')).toHaveLength(3);
  });

  it('matches Arabic regardless of alef and ta marbuta forms', () => {
    expect(filterAcademicOptions(many, 'اداره').map((o) => o.id)).toEqual([3]);
    expect(filterAcademicOptions(many, 'صيدله').map((o) => o.id)).toEqual([2]);
  });

  it('matches codes case-insensitively', () => {
    expect(filterAcademicOptions(many, 'med').map((o) => o.id)).toEqual([1]);
  });

  it('normalizes text', () => {
    expect(normalizeSearchText('إدارة')).toBe('اداره');
  });
});
