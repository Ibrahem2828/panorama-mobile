import { MB } from './limits';

/** Total size of the encrypted chat media cache. Thumbnails are tiny, so this holds hundreds of pictures. */
export const CACHE_MAX_BYTES = 120 * MB;
/** Anything bigger than this is streamed or shown once and never stored (e.g. a 25 MB lecture recording). */
export const CACHE_MAX_ENTRY_BYTES = 30 * MB;
/** Entries not opened for this long are dropped on the next cleanup. */
export const CACHE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export type CacheVariant = 'thumb' | 'full';

export type CacheEntry = {
  key: string;
  messageId: number;
  variant: CacheVariant;
  /** Plaintext size in bytes. */
  size: number;
  etag: string | null;
  mime: string;
  lastAccess: number;
};

export type CacheIndex = { version: 1; entries: CacheEntry[] };

export const emptyIndex: CacheIndex = { version: 1, entries: [] };

export function cacheKey(
  userId: string | number,
  messageId: number,
  variant: CacheVariant,
): string {
  return `${userId}:${messageId}:${variant}`;
}

export function canStore(size: number): boolean {
  return size > 0 && size <= CACHE_MAX_ENTRY_BYTES;
}

type Sized = { key: string; size: number; lastAccess: number };

export function totalBytes(entries: readonly Sized[]): number {
  return entries.reduce((sum, entry) => sum + entry.size, 0);
}

/**
 * Least-recently-used eviction. Returns the keys to delete so the cache fits `maxBytes`, oldest first, never touching `protect`
 * (the entry being written or shown right now). Entries older than `maxAgeMs` always go.
 */
export function planEviction(
  entries: readonly Sized[],
  options: { now: number; maxBytes?: number; maxAgeMs?: number; protect?: readonly string[] },
): string[] {
  const maxBytes = options.maxBytes ?? CACHE_MAX_BYTES;
  const maxAgeMs = options.maxAgeMs ?? CACHE_MAX_AGE_MS;
  const protect = new Set(options.protect ?? []);
  const evict: string[] = [];
  const keep: Sized[] = [];

  for (const entry of entries) {
    if (!protect.has(entry.key) && options.now - entry.lastAccess > maxAgeMs) {
      evict.push(entry.key);
    } else {
      keep.push(entry);
    }
  }

  let total = totalBytes(keep);
  const oldestFirst = [...keep].sort((left, right) => left.lastAccess - right.lastAccess);

  for (const entry of oldestFirst) {
    if (total <= maxBytes) {
      break;
    }

    if (protect.has(entry.key)) {
      continue;
    }

    evict.push(entry.key);
    total -= entry.size;
  }

  return evict;
}

/** Inserts or replaces an entry (pure). */
export function upsertEntry(index: CacheIndex, entry: CacheEntry): CacheIndex {
  return {
    version: 1,
    entries: [...index.entries.filter((candidate) => candidate.key !== entry.key), entry],
  };
}

export function removeEntries(index: CacheIndex, keys: readonly string[]): CacheIndex {
  const drop = new Set(keys);

  return { version: 1, entries: index.entries.filter((entry) => !drop.has(entry.key)) };
}

export function touchEntry(index: CacheIndex, key: string, now: number): CacheIndex {
  return {
    version: 1,
    entries: index.entries.map((entry) =>
      entry.key === key ? { ...entry, lastAccess: now } : entry,
    ),
  };
}

/** True when a cached copy still matches what the server says it holds (no download needed). */
export function isFresh(entry: CacheEntry, ticketEtag: string | null): boolean {
  return Boolean(entry.etag && ticketEtag && entry.etag === ticketEtag);
}
