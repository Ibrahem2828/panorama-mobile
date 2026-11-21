import { bindOfflineToAuth } from '../authSync';
import { isPinnedPath } from '../cachePolicy';
import { readCachedRecords, searchCachedRecords } from '../cachedRecords';
import { setCacheScope } from '../cacheScope';
import { createInMemoryCacheStorage, setCacheStorageAdapter } from '../cacheStorage';
import {
  CACHE_MAX_AGE_MS,
  CACHE_MAX_ENTRIES,
  clearAllCaches,
  readCache,
  readCachedByPath,
  writeCache,
} from '../responseCache';

const PROFILE = '/api/v1/students/me/profile/';
const VERIFICATION = '/api/v1/verification/me/';
const DAY = 24 * 60 * 60 * 1000;

type FakeState = { user: { id: number } | null };

function fakeAuth(initial: FakeState) {
  const listeners = new Set<(state: FakeState) => void>();
  let state = initial;

  bindOfflineToAuth({
    getState: () => state,
    subscribe: (listener) => {
      listeners.add(listener);

      return () => listeners.delete(listener);
    },
  });

  return async (next: FakeState) => {
    state = next;
    listeners.forEach((listener) => listener(state));
    await new Promise((resolve) => setImmediate(resolve));
  };
}

beforeEach(async () => {
  setCacheStorageAdapter(createInMemoryCacheStorage());
  setCacheScope(null);
  await clearAllCaches();
});

afterAll(() => setCacheStorageAdapter(null));

describe('offline startup snapshot', () => {
  it('knows which saved answers are the startup snapshot', () => {
    expect(isPinnedPath(PROFILE)).toBe(true);
    expect(isPinnedPath(VERIFICATION)).toBe(true);
    expect(isPinnedPath('/api/v1/auth/me/')).toBe(true);
    expect(isPinnedPath('/api/v1/universities/3/faculties/?pageSize=500')).toBe(true);
    expect(isPinnedPath('/api/v1/policies/status/')).toBe(true);
    expect(isPinnedPath('/api/v1/files/')).toBe(false);
    expect(isPinnedPath('/api/v1/auth/token/refresh/')).toBe(false);
  });

  it('serves an expired profile snapshot instead of blocking the student, and keeps it', async () => {
    await writeCache('1', PROFILE, { id: 9, full_name: 'طالب' }, 0);
    const later = CACHE_MAX_AGE_MS * 3;

    const first = await readCache<{ id: number }>('1', PROFILE, later);
    const second = await readCache<{ id: number }>('1', PROFILE, later + DAY);

    expect(first?.data.id).toBe(9);
    expect(first?.savedAt).toBe(0);
    expect(second?.data.id).toBe(9);
  });

  it('still lets ordinary entries expire', async () => {
    await writeCache('1', '/api/v1/files/', { a: 1 }, 0);

    await expect(readCache('1', '/api/v1/files/', CACHE_MAX_AGE_MS + 1)).resolves.toBeNull();
  });

  it('is not purged when a later write cleans expired rows, nor evicted to make room', async () => {
    await writeCache('1', PROFILE, { id: 9 }, 0);
    await writeCache('1', VERIFICATION, { status: 'approved' }, 0);
    await writeCache('1', '/api/v1/files/', { old: true }, 0);
    const later = CACHE_MAX_AGE_MS * 2;

    for (let index = 0; index < CACHE_MAX_ENTRIES + 20; index += 1) {
      await writeCache('1', `/api/v1/notifications/?page=${index}`, { index }, later);
    }

    expect((await readCache<{ id: number }>('1', PROFILE, later))?.data.id).toBe(9);
    expect((await readCache<{ status: string }>('1', VERIFICATION, later))?.data.status).toBe(
      'approved',
    );
    await expect(readCache('1', '/api/v1/files/', later)).resolves.toBeNull();
  });

  it('is replaced by the next live answer', async () => {
    await writeCache('1', PROFILE, { id: 9, faculty: 'old' }, 0);
    await writeCache('1', PROFILE, { id: 9, faculty: 'new' }, CACHE_MAX_AGE_MS * 4);

    const hit = await readCache<{ faculty: string }>('1', PROFILE, CACHE_MAX_AGE_MS * 4);

    expect(hit?.data.faculty).toBe('new');
  });

  it('is wiped on sign-out together with everything else', async () => {
    const change = fakeAuth({ user: { id: 1 } });

    await writeCache('1', PROFILE, { id: 9 }, 0);
    await change({ user: null });

    await expect(readCache('1', PROFILE, 10)).resolves.toBeNull();
  });

  it('is wiped when another account signs in on the phone', async () => {
    const change = fakeAuth({ user: { id: 1 } });

    await writeCache('1', PROFILE, { id: 9 }, 0);
    await change({ user: { id: 2 } });

    await expect(readCache('1', PROFILE, 10)).resolves.toBeNull();
  });
});

describe('saved lists by path', () => {
  it('finds every saved query of a path, skipping expired ordinary entries', async () => {
    await writeCache('1', '/api/v1/files/?page=1', { results: [{ id: 1, title: 'a' }] }, 100);
    await writeCache('1', '/api/v1/files/?page=2', { results: [{ id: 2, title: 'b' }] }, 200);
    await writeCache('1', '/api/v1/files/?page=3', { results: [{ id: 3, title: 'c' }] }, 0);
    await writeCache('2', '/api/v1/files/?page=1', { results: [{ id: 9, title: 'd' }] }, 100);

    const found = await readCachedByPath<{ results: { id: number }[] }>(
      '1',
      '/api/v1/files/',
      CACHE_MAX_AGE_MS + 50,
    );

    expect(found.map((entry) => entry.data.results[0]?.id)).toEqual([2, 1]);
  });

  it('searches the saved records of the signed-in user only', async () => {
    setCacheScope('1');
    await writeCache('1', '/api/v1/files/?page=1', {
      results: [
        { id: 1, title: 'ملخص التشريح' },
        { id: 2, title: 'كيمياء' },
      ],
    });
    await writeCache('1', '/api/v1/groups/4/files/', {
      results: [{ id: 1, title: 'ملخص التشريح' }],
    });
    await writeCache('2', '/api/v1/files/', { results: [{ id: 7, title: 'تشريح آخر' }] });

    const pattern = /^\/api\/v1\/(?:files|groups\/\d+\/files)\/$/u;

    expect(await readCachedRecords(pattern)).toHaveLength(2);
    expect((await searchCachedRecords(pattern, 'تشريح', ['title'])).map((r) => r.id)).toEqual([1]);
    expect(await searchCachedRecords(pattern, 'فيزياء', ['title'])).toEqual([]);
  });

  it('returns nothing without a signed-in scope', async () => {
    setCacheScope(null);

    expect(await readCachedRecords('/api/v1/files/')).toEqual([]);
  });
});
