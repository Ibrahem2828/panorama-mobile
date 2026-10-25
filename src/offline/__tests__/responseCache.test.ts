import { createInMemoryCacheStorage, setCacheStorageAdapter } from '../cacheStorage';
import {
  CACHE_MAX_AGE_MS,
  CACHE_MAX_ENTRIES,
  CACHE_MAX_ENTRY_BYTES,
  CACHE_MAX_TOTAL_BYTES,
  CACHE_VERSION,
  clearAllCaches,
  clearUserCache,
  readCache,
  writeCache,
} from '../responseCache';

const storage = createInMemoryCacheStorage();

beforeEach(async () => {
  setCacheStorageAdapter(storage);
  await clearAllCaches();
});

afterAll(() => setCacheStorageAdapter(null));

describe('response cache', () => {
  it('returns what was written, with its save time', async () => {
    await writeCache('1', '/api/v1/groups/my/', { results: [1, 2] }, 1000);

    await expect(readCache('1', '/api/v1/groups/my/', 2000)).resolves.toEqual({
      data: { results: [1, 2] },
      savedAt: 1000,
    });
    await expect(readCache('1', '/api/v1/groups/other/', 2000)).resolves.toBeNull();
  });

  it('never serves an entry older than the maximum age and drops it', async () => {
    await writeCache('1', '/api/v1/files/', { a: 1 }, 0);

    await expect(readCache('1', '/api/v1/files/', CACHE_MAX_AGE_MS + 1)).resolves.toBeNull();
    await expect(readCache('1', '/api/v1/files/', 10)).resolves.toBeNull();
  });

  it('ignores entries written by another cache version', async () => {
    await writeCache('1', '/api/v1/files/', { a: 1 }, 5);

    const keys = await storage.getAllKeys();
    const entryKey = keys.find((key) => !key.endsWith('__index'))!;
    const stored = JSON.parse((await storage.getItem(entryKey))!) as Record<string, unknown>;

    await storage.setItem(entryKey, JSON.stringify({ ...stored, v: CACHE_VERSION + 1 }));

    await expect(readCache('1', '/api/v1/files/', 10)).resolves.toBeNull();
  });

  it('keeps users apart', async () => {
    await writeCache('1', '/api/v1/notifications/', { owner: 'one' });
    await writeCache('2', '/api/v1/notifications/', { owner: 'two' });

    expect((await readCache<{ owner: string }>('1', '/api/v1/notifications/'))?.data.owner).toBe(
      'one',
    );
    expect((await readCache<{ owner: string }>('2', '/api/v1/notifications/'))?.data.owner).toBe(
      'two',
    );

    await clearUserCache('1');

    await expect(readCache('1', '/api/v1/notifications/')).resolves.toBeNull();
    await expect(readCache('2', '/api/v1/notifications/')).resolves.not.toBeNull();
  });

  it('skips a single response that is too large', async () => {
    const big = 'x'.repeat(CACHE_MAX_ENTRY_BYTES + 10);

    await expect(writeCache('1', '/api/v1/files/', { big })).resolves.toBe(false);
    await expect(readCache('1', '/api/v1/files/')).resolves.toBeNull();
  });

  it('evicts the least recently used entries when the total size bound is exceeded', async () => {
    const chunk = 'y'.repeat(Math.floor(CACHE_MAX_ENTRY_BYTES * 0.9));
    const writes = Math.ceil(CACHE_MAX_TOTAL_BYTES / chunk.length) + 3;

    for (let index = 0; index < writes; index += 1) {
      await writeCache('1', `/api/v1/files/${index}/`, { chunk }, 100 + index);
    }

    // The oldest are gone, the newest survive.
    await expect(readCache('1', '/api/v1/files/0/', 1000)).resolves.toBeNull();
    await expect(readCache('1', `/api/v1/files/${writes - 1}/`, 1000)).resolves.not.toBeNull();

    const keys = (await storage.getAllKeys()).filter((key) => !key.endsWith('__index'));
    const sizes = await Promise.all(keys.map(async (key) => (await storage.getItem(key))!.length));

    expect(sizes.reduce((sum, size) => sum + size, 0)).toBeLessThanOrEqual(CACHE_MAX_TOTAL_BYTES);
  });

  it('bounds the number of entries per user, dropping the least recently used', async () => {
    for (let index = 0; index < CACHE_MAX_ENTRIES + 5; index += 1) {
      await writeCache('1', `/api/v1/lectures/${index}/`, { index }, 100 + index);
    }

    const keys = (await storage.getAllKeys()).filter((key) => !key.endsWith('__index'));

    expect(keys.length).toBe(CACHE_MAX_ENTRIES);
    await expect(readCache('1', '/api/v1/lectures/0/', 1000)).resolves.toBeNull();
    await expect(
      readCache('1', `/api/v1/lectures/${CACHE_MAX_ENTRIES + 4}/`, 1000),
    ).resolves.not.toBeNull();
  });

  it('wipes every user on clearAllCaches (sign-out)', async () => {
    await writeCache('1', '/api/v1/files/', { a: 1 });
    await writeCache('2', '/api/v1/files/', { a: 2 });

    await clearAllCaches();

    expect(await storage.getAllKeys()).toEqual([]);
  });
});
