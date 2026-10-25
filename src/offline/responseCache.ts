import { getCacheStorage } from './cacheStorage';

/** Bump to invalidate every stored entry after a change in the cached shapes. */
export const CACHE_VERSION = 1;
const PREFIX = `pano.cache.v${CACHE_VERSION}:`;
/** Entries older than this are never served (and are dropped when met). */
export const CACHE_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;
/** One response above this size is not worth keeping and is skipped. */
export const CACHE_MAX_ENTRY_BYTES = 300 * 1024;
/** Per user: total size and entry count bounds; the least recently used entries go first. */
export const CACHE_MAX_TOTAL_BYTES = 4 * 1024 * 1024;
export const CACHE_MAX_ENTRIES = 150;

type IndexRow = { k: string; s: number; t: number; a: number };
type Stored = { v: number; k: string; t: number; d: unknown };

export type CacheHit<T> = { data: T; savedAt: number };

function indexKey(userId: string): string {
  return `${PREFIX}${userId}:__index`;
}

/** FNV-1a: short, stable storage keys; the full key is stored in the entry and verified on read. */
function hash(value: string): string {
  let h = 0x811c9dc5;

  for (let index = 0; index < value.length; index += 1) {
    h ^= value.charCodeAt(index);
    h = Math.imul(h, 0x01000193) >>> 0;
  }

  return `${h.toString(16)}${value.length.toString(16)}`;
}

function entryKey(userId: string, key: string): string {
  return `${PREFIX}${userId}:${hash(key)}`;
}

async function readIndex(userId: string): Promise<IndexRow[]> {
  try {
    const raw = await getCacheStorage().getItem(indexKey(userId));
    const parsed: unknown = raw ? JSON.parse(raw) : [];

    return Array.isArray(parsed) ? (parsed as IndexRow[]) : [];
  } catch {
    return [];
  }
}

async function writeIndex(userId: string, rows: IndexRow[]): Promise<void> {
  await getCacheStorage().setItem(indexKey(userId), JSON.stringify(rows));
}

// Writes for one user are serialised so two concurrent responses cannot overwrite each other's index.
const queues = new Map<string, Promise<unknown>>();

function serial<T>(userId: string, task: () => Promise<T>): Promise<T> {
  const previous = queues.get(userId) ?? Promise.resolve();
  const next = previous.then(task, task);

  queues.set(
    userId,
    next.catch(() => undefined),
  );

  return next;
}

export async function readCache<T>(
  userId: string,
  key: string,
  now: number = Date.now(),
): Promise<CacheHit<T> | null> {
  try {
    const storage = getCacheStorage();
    const storageKey = entryKey(userId, key);
    const raw = await storage.getItem(storageKey);

    if (!raw) {
      return null;
    }

    const entry = JSON.parse(raw) as Stored;

    if (entry.v !== CACHE_VERSION || entry.k !== key) {
      return null;
    }

    if (now - entry.t > CACHE_MAX_AGE_MS) {
      void serial(userId, async () => {
        await storage.removeItem(storageKey);
        await writeIndex(
          userId,
          (await readIndex(userId)).filter((row) => row.k !== storageKey),
        );
      }).catch(() => undefined);

      return null;
    }

    void serial(userId, async () => {
      const rows = await readIndex(userId);
      const row = rows.find((candidate) => candidate.k === storageKey);

      if (row) {
        row.a = now;
        await writeIndex(userId, rows);
      }
    }).catch(() => undefined);

    return { data: entry.d as T, savedAt: entry.t };
  } catch {
    return null;
  }
}

export function writeCache(
  userId: string,
  key: string,
  data: unknown,
  now: number = Date.now(),
): Promise<boolean> {
  return serial(userId, async () => {
    try {
      const storage = getCacheStorage();
      const serialized = JSON.stringify({
        v: CACHE_VERSION,
        k: key,
        t: now,
        d: data,
      } satisfies Stored);
      const size = serialized.length;

      if (size > CACHE_MAX_ENTRY_BYTES) {
        return false;
      }

      const storageKey = entryKey(userId, key);
      let rows = (await readIndex(userId)).filter((row) => row.k !== storageKey);

      rows.push({ k: storageKey, s: size, t: now, a: now });
      // Drop expired rows, then the least recently used until both bounds hold (the new entry is never the victim).
      const expired = rows.filter((row) => row.k !== storageKey && now - row.t > CACHE_MAX_AGE_MS);
      let total = rows.reduce((sum, row) => sum + row.s, 0);
      const doomed = new Set(expired.map((row) => row.k));

      rows = rows.filter((row) => !doomed.has(row.k));
      total = rows.reduce((sum, row) => sum + row.s, 0);

      const byUse = rows
        .filter((row) => row.k !== storageKey)
        .sort((left, right) => left.a - right.a);

      while ((total > CACHE_MAX_TOTAL_BYTES || rows.length > CACHE_MAX_ENTRIES) && byUse.length) {
        const victim = byUse.shift()!;

        doomed.add(victim.k);
        rows = rows.filter((row) => row.k !== victim.k);
        total -= victim.s;
      }

      await storage.setItem(storageKey, serialized);
      await writeIndex(userId, rows);

      if (doomed.size > 0) {
        await storage.multiRemove(Array.from(doomed));
      }

      return true;
    } catch {
      return false;
    }
  });
}

/** Removes everything cached for one user. */
export function clearUserCache(userId: string): Promise<void> {
  return serial(userId, async () => {
    try {
      const storage = getCacheStorage();
      const keys = (await storage.getAllKeys()).filter((key) =>
        key.startsWith(`${PREFIX}${userId}:`),
      );

      if (keys.length > 0) {
        await storage.multiRemove(keys);
      }
    } catch {
      // Nothing useful to do: the entries expire by age anyway.
    }
  });
}

/** Removes the cache of every user (logout, session expiry, account switch). */
export async function clearAllCaches(): Promise<void> {
  try {
    const storage = getCacheStorage();
    const keys = (await storage.getAllKeys()).filter((key) => key.startsWith('pano.cache.'));

    if (keys.length > 0) {
      await storage.multiRemove(keys);
    }
  } catch {
    // Same as above.
  }
}
