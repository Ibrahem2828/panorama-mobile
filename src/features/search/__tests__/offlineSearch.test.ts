import { setCacheScope } from '../../../offline/cacheScope';
import { createInMemoryCacheStorage, setCacheStorageAdapter } from '../../../offline/cacheStorage';
import { clearAllCaches, writeCache } from '../../../offline/responseCache';
import type { OfflineEntry } from '../../lectures/offline/licenseLogic';
import { searchCachedLists, searchDownloadedEntries } from '../services/offlineSearch';

function entry(partial: Partial<OfflineEntry> & Pick<OfflineEntry, 'lectureId' | 'title'>) {
  return {
    subjectName: null,
    status: 'complete',
    ...partial,
  } as OfflineEntry;
}

describe('searchDownloadedEntries', () => {
  const inventory = {
    'f:1': entry({ kind: 'file', lectureId: 1, title: 'ملخص التشريح', subjectName: 'علم التشريح' }),
    '2': entry({ lectureId: 2, title: 'محاضرة الكيمياء' }),
    'f:3': entry({ kind: 'file', lectureId: 3, title: 'تشريح ناقص', status: 'partial' }),
  };

  it('matches the title of saved files and lectures, ignoring unfinished downloads', () => {
    expect(searchDownloadedEntries(inventory, 'تشريح')).toEqual([
      { kind: 'file', id: 1, title: 'ملخص التشريح', subjectName: 'علم التشريح' },
    ]);
    expect(searchDownloadedEntries(inventory, 'كيمياء')).toEqual([
      { kind: 'lecture', id: 2, title: 'محاضرة الكيمياء', subjectName: null },
    ]);
  });

  it('is tolerant to hamza and diacritics and finds nothing for an unrelated query', () => {
    expect(searchDownloadedEntries(inventory, 'التَشريح')).toHaveLength(1);
    expect(searchDownloadedEntries(inventory, 'فيزياء')).toEqual([]);
  });

  it('returns nothing when the filter excludes files', () => {
    expect(searchDownloadedEntries(inventory, 'تشريح', ['subject'])).toEqual([]);
  });
});

describe('searchCachedLists', () => {
  beforeEach(async () => {
    setCacheStorageAdapter(createInMemoryCacheStorage());
    await clearAllCaches();
    setCacheScope('5');
  });

  afterAll(() => {
    setCacheScope(null);
    setCacheStorageAdapter(null);
  });

  it('answers from the lists already loaded, in the shape of the server answer', async () => {
    await writeCache('5', '/api/v1/subjects/', {
      results: [
        { id: 1, name: 'علم التشريح', code: 'ANA101' },
        { id: 2, name: 'الكيمياء الحيوية', code: 'BIO201' },
      ],
    });
    await writeCache('5', '/api/v1/files/?page=1', {
      results: [{ id: 10, title: 'ملخص التشريح', file_type: 'pdf' }],
    });
    await writeCache('5', '/api/v1/announcements/', {
      results: [{ id: 3, title: 'موعد امتحان التشريح', description: '' }],
    });

    const result = await searchCachedLists('التشريح');

    expect(result.subjects.map((item) => item.id)).toEqual([1]);
    expect(result.files.map((item) => item.id)).toEqual([10]);
    expect(result.announcements.map((item) => item.id)).toEqual([3]);
    expect(result.total).toBe(3);
  });

  it('respects the kind filter and never fails when nothing is saved', async () => {
    await writeCache('5', '/api/v1/subjects/', { results: [{ id: 1, name: 'علم التشريح' }] });

    expect((await searchCachedLists('تشريح', ['file'])).total).toBe(0);
    expect((await searchCachedLists('فيزياء')).total).toBe(0);
  });
});
