import type { EncryptedStore } from '../../../../security/encryptedStoreCore';
import { CACHE_MAX_AGE_MS, CACHE_MAX_BYTES, CACHE_MAX_ENTRY_BYTES } from '../logic/cacheIndex';

const OWNER_ID = '__owner__';
const thumbMemory = new Map<string, string>();
const THUMB_MEMORY_LIMIT = 80;

/**
 * The chat media cache: one instance of the app's encrypted private file store (src/security). The native modules are loaded on
 * first use, so importing this file (the sign-out hook does) costs nothing and never touches native code in tests.
 */
let real: Promise<EncryptedStore> | null = null;

function realStore(): Promise<EncryptedStore> {
  if (!real) {
    real = import('../../../../security/encryptedStore').then(({ createEncryptedStore }) =>
      createEncryptedStore('chat-media', {
        maxBytes: CACHE_MAX_BYTES,
        maxEntryBytes: CACHE_MAX_ENTRY_BYTES,
        maxAgeMs: CACHE_MAX_AGE_MS,
      }),
    );
  }

  return real;
}

const lazyStore: EncryptedStore = {
  put: async (id, bytes, meta) => (await realStore()).put(id, bytes, meta),
  has: async (id) => (await realStore()).has(id),
  getMeta: async (id) => (await realStore()).getMeta(id),
  setMeta: async (id, meta) => (await realStore()).setMeta(id, meta),
  readBytes: async (id) => (await realStore()).readBytes(id),
  open: async (id) => (await realStore()).open(id),
  evict: async (id) => (await realStore()).evict(id),
  evictPrefix: async (prefix) => (await realStore()).evictPrefix(prefix),
  totalBytes: async () => (await realStore()).totalBytes(),
  trim: async () => (await realStore()).trim(),
  sweepTemp: async () => (await realStore()).sweepTemp(),
  wipe: async () => (await realStore()).wipe(),
};

export function getChatMediaStore(): EncryptedStore {
  return lazyStore;
}

/** Decoded thumbnails kept in memory only (data URIs); bounded, never written anywhere. */
export function rememberThumb(key: string, dataUri: string): void {
  if (thumbMemory.size >= THUMB_MEMORY_LIMIT) {
    const oldest = thumbMemory.keys().next().value;

    if (oldest !== undefined) {
      thumbMemory.delete(oldest);
    }
  }

  thumbMemory.set(key, dataUri);
}

export function recallThumb(key: string): string | undefined {
  return thumbMemory.get(key);
}

/**
 * Called when a user is signed in at app start / after sign-in: tidies decrypted temp files a crash left behind, applies the
 * size and age limits, and wipes the cache if it belongs to a different account than the one now signed in (for example a
 * session that ended while the app was closed, so the logout wipe never ran).
 */
export async function initChatMediaCache(userId: string | number): Promise<void> {
  try {
    const current = getChatMediaStore();
    const owner = await current.getMeta(OWNER_ID);

    if (owner && owner.userId !== String(userId)) {
      await clearChatMediaCache();
    }

    if (!(await current.has(OWNER_ID))) {
      await current.put(OWNER_ID, new Uint8Array([1]), { userId: String(userId) });
    }

    await current.sweepTemp();
    void import('./pdfRenderer').then((module) => module.sweepPdfPages());
    await current.trim();
  } catch {
    // The cache is an optimisation; failing to tidy it must never block the app.
  }
}

const clearListeners = new Set<() => void>();

/** Lets other chat media modules (the ticket cache) drop their memory when the cache is wiped. */
export function onChatMediaCleared(listener: () => void): void {
  clearListeners.add(listener);
}

/** Logout, session expiry, account switch and "device replaced": every cached byte and the key are destroyed. */
export async function clearChatMediaCache(): Promise<void> {
  thumbMemory.clear();
  clearListeners.forEach((listener) => listener());

  try {
    await getChatMediaStore().wipe();
  } catch {
    // Nothing else can be done; the key is also gone with the next install/clear-data.
  }
}
