import {
  filterByLocalQuery,
  localSearchTokens,
  matchesLocalQuery,
  normalizeLocalSearchText,
  recordsOf,
  shouldSearchLocally,
  uniqueById,
} from '../localSearch';

describe('normalizeLocalSearchText', () => {
  it('folds diacritics, tatweel, alef, ya, ta marbuta and hamza carriers', () => {
    expect(normalizeLocalSearchText('الإِدَارَة')).toBe('الاداره');
    expect(normalizeLocalSearchText('سؤال')).toBe(normalizeLocalSearchText('سوال'));
    expect(normalizeLocalSearchText('رئيس')).toBe(normalizeLocalSearchText('رييس'));
    expect(normalizeLocalSearchText('مـــادة')).toBe('ماده');
    expect(normalizeLocalSearchText('على')).toBe(normalizeLocalSearchText('علي'));
  });

  it('maps Arabic-Indic digits and lowercases Latin text', () => {
    expect(normalizeLocalSearchText('الفصل ٣')).toBe('الفصل 3');
    expect(normalizeLocalSearchText('Anatomy ۱۲')).toBe('anatomy 12');
  });

  it('collapses whitespace and handles empty input', () => {
    expect(normalizeLocalSearchText('  a ‏  b ')).toBe('a b');
    expect(normalizeLocalSearchText(null)).toBe('');
    expect(normalizeLocalSearchText(undefined)).toBe('');
  });
});

describe('matchesLocalQuery', () => {
  it('needs every word of the query, in any order', () => {
    expect(matchesLocalQuery('رياضيات: تحليل 1', 'تحليل رياضيات')).toBe(true);
    expect(matchesLocalQuery('رياضيات: تحليل 1', 'تحليل فيزياء')).toBe(false);
  });

  it('is tolerant to diacritics and hamza', () => {
    expect(matchesLocalQuery('أحياء مجهرية', 'احياء')).toBe(true);
    expect(matchesLocalQuery('الإدارة الصحية', 'اداره')).toBe(true);
  });

  it('matches across several fields and never matches an empty query', () => {
    expect(matchesLocalQuery(['ملف 1', 'علم التشريح'], 'تشريح')).toBe(true);
    expect(matchesLocalQuery('anything', '   ')).toBe(false);
    expect(localSearchTokens('')).toEqual([]);
  });
});

describe('filterByLocalQuery', () => {
  const items = [
    { id: 1, title: 'مراجعة التشريح' },
    { id: 2, title: 'تشريح الجهاز العصبي' },
    { id: 3, title: 'كيمياء' },
    { id: 4, title: 'ملخص في التشريح' },
  ];

  it('keeps matches only, best first, stable inside one rank', () => {
    const found = filterByLocalQuery(items, 'تشريح', (item) => item.title);

    expect(found.map((item) => item.id)).toEqual([2, 1, 4]);
  });

  it('returns nothing for a query without words', () => {
    expect(filterByLocalQuery(items, ' ', (item) => item.title)).toEqual([]);
  });
});

describe('list helpers', () => {
  it('drops duplicate ids', () => {
    expect(uniqueById([{ id: 1 }, { id: '1' }, { id: 2 }])).toEqual([{ id: 1 }, { id: 2 }]);
  });

  it('reads the records of either answer shape', () => {
    expect(recordsOf({ results: [{ id: 1 }, 5, null, [1]] })).toEqual([{ id: 1 }]);
    expect(recordsOf([{ id: 2 }])).toEqual([{ id: 2 }]);
    expect(recordsOf({ nothing: true })).toEqual([]);
  });
});

describe('shouldSearchLocally', () => {
  it('searches locally when offline or when the server cannot be reached', () => {
    expect(shouldSearchLocally({ isOnline: false })).toBe(true);
    expect(shouldSearchLocally({ isOnline: true, errorCode: 'NETWORK_ERROR' })).toBe(true);
    expect(shouldSearchLocally({ isOnline: true, errorCode: 'TIMEOUT' })).toBe(true);
    expect(shouldSearchLocally({ isOnline: true, status: 503 })).toBe(true);
  });

  it('keeps real errors as errors', () => {
    expect(shouldSearchLocally({ isOnline: true, errorCode: 'UNAUTHORIZED', status: 401 })).toBe(
      false,
    );
    expect(shouldSearchLocally({ isOnline: true, status: 400 })).toBe(false);
  });
});
