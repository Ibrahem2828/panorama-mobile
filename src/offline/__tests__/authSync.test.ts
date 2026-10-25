import { bindOfflineToAuth } from '../authSync';
import { getCacheScope, setCacheScope } from '../cacheScope';
import { createInMemoryCacheStorage, setCacheStorageAdapter } from '../cacheStorage';
import { formatAgo } from '../formatAgo';
import { readCache, writeCache } from '../responseCache';
import { loadSessionSnapshot, saveSessionSnapshot } from '../sessionSnapshot';

type User = { id: number } | null;

function fakeStore(initial: User) {
  let state = { user: initial };
  const listeners = new Set<(next: typeof state) => void>();

  return {
    getState: () => state,
    subscribe: (listener: (next: typeof state) => void) => {
      listeners.add(listener);

      return () => listeners.delete(listener);
    },
    set(user: User) {
      state = { user };
      listeners.forEach((listener) => listener(state));
    },
  };
}

const flush = () => new Promise((resolve) => setImmediate(resolve));

beforeEach(() => {
  setCacheStorageAdapter(createInMemoryCacheStorage());
  setCacheScope(null);
});

afterAll(() => setCacheStorageAdapter(null));

describe('offline cache follows the signed-in user', () => {
  it('scopes the cache to the user and clears it on sign-out', async () => {
    const store = fakeStore(null);

    bindOfflineToAuth(store);
    expect(getCacheScope()).toBeNull();

    store.set({ id: 7 });
    expect(getCacheScope()).toBe('7');

    await writeCache('7', '/api/v1/groups/my/', { a: 1 });
    await saveSessionSnapshot({ id: 7 });

    store.set(null);
    await flush();
    await flush();

    expect(getCacheScope()).toBeNull();
    await expect(readCache('7', '/api/v1/groups/my/')).resolves.toBeNull();
    await expect(loadSessionSnapshot()).resolves.toBeNull();
  });

  it('wipes the previous account when another one signs in', async () => {
    const store = fakeStore({ id: 1 });

    bindOfflineToAuth(store);
    await writeCache('1', '/api/v1/files/', { owner: 1 });

    store.set({ id: 2 });
    await flush();
    await flush();

    expect(getCacheScope()).toBe('2');
    await expect(readCache('1', '/api/v1/files/')).resolves.toBeNull();
  });

  it('keeps the saved profile when the start itself had no user yet (offline start, nothing to clear)', async () => {
    const store = fakeStore(null);

    bindOfflineToAuth(store);
    await saveSessionSnapshot({ id: 7 });

    store.set(null);
    await flush();

    await expect(loadSessionSnapshot()).resolves.not.toBeNull();
  });
});

describe('formatAgo', () => {
  const strings = {
    justNow: 'now',
    minutesAgo: (count: number) => `${count}m`,
    hoursAgo: (count: number) => `${count}h`,
    daysAgo: (count: number) => `${count}d`,
  };

  it('describes the age of saved data', () => {
    const now = 10 * 24 * 3_600_000;

    expect(formatAgo(now - 20_000, now, strings)).toBe('now');
    expect(formatAgo(now - 5 * 60_000, now, strings)).toBe('5m');
    expect(formatAgo(now - 3 * 3_600_000, now, strings)).toBe('3h');
    expect(formatAgo(now - 2 * 24 * 3_600_000, now, strings)).toBe('2d');
    expect(formatAgo(now + 5000, now, strings)).toBe('now');
  });
});
