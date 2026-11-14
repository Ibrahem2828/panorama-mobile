/**
 * Encrypted private file store (platform independent core; native bindings live in encryptedStore.ts).
 *
 * Design
 *  - One random 256-bit MASTER key per install, kept in expo-secure-store (Android Keystore-backed). It never touches a file.
 *  - Every stored file gets its own random 256-bit FILE key. The file key is sealed (AES-256-GCM) under the master key.
 *  - File content is split in 1 MiB chunks, each sealed with AES-256-GCM (random 96-bit nonce per chunk). The additional data of
 *    a chunk binds it to the file name, its position, the chunk count and the plain size, so chunks cannot be swapped, reordered,
 *    dropped or moved to another file without the authentication tag failing. Chunking keeps memory bounded for large files.
 *  - The index (ids, sizes, last access, caller metadata) is one more AES-GCM sealed file. File names on disk are random.
 *  - Everything lives in app-private storage (never external/shared storage), and nothing in here can export a file: the API only
 *    returns bytes or a short-lived decrypted temp file inside the app cache that the caller must release.
 *
 * Honest limits (see docs): protects data at rest and in backups (also disabled in the manifest) against someone reading the
 * storage without the app's Keystore; does NOT protect against a rooted/compromised device, a debugger, or the moment of use (the
 * decrypted bytes exist in memory and, for viewers that need a file path, in a temp file until `release()`).
 */

import { planEviction } from '../features/chat/media/logic/cacheIndex';

export const CHUNK_SIZE = 1024 * 1024;
const MAGIC = [0x50, 0x53, 0x45, 0x31]; // "PSE1"
const KEY_BYTES = 32;

export type StoreMeta = Record<string, string | number | boolean | null>;

export type StoreDeps = {
  random(length: number): Uint8Array;
  /** AES-256-GCM. Returns `nonce(12) | ciphertext | tag(16)`. */
  seal(key: Uint8Array, plain: Uint8Array, aad: Uint8Array): Promise<Uint8Array>;
  /** Throws when the tag does not verify. */
  open(key: Uint8Array, sealed: Uint8Array, aad: Uint8Array): Promise<Uint8Array>;
  keyStore: {
    get(): Promise<string | null>;
    set(valueBase64: string): Promise<void>;
    remove(): Promise<void>;
  };
  fs: {
    ensureDir(dir: string): Promise<void>;
    readFile(path: string): Promise<Uint8Array>;
    writeFile(path: string, bytes: Uint8Array): Promise<void>;
    openWriter(
      path: string,
    ): Promise<{ write(bytes: Uint8Array): Promise<void>; close(): Promise<void> }>;
    openReader(path: string): Promise<{
      size: number;
      read(length: number): Promise<Uint8Array>;
      close(): Promise<void>;
    }>;
    exists(path: string): Promise<boolean>;
    remove(path: string): Promise<void>;
    removeDir(dir: string): Promise<void>;
    list(dir: string): Promise<string[]>;
  };
  now(): number;
};

export type StoreOptions = {
  /** Private directory that holds the encrypted files. */
  dir: string;
  /** Private cache directory for decrypted temp files handed to viewers. */
  tempDir: string;
  maxBytes: number;
  maxEntryBytes: number;
  /** Entries not opened for this long are dropped. */
  maxAgeMs: number;
};

type IndexEntry = {
  id: string;
  /** Random file name. */
  name: string;
  /** `key` mirrors `id` so the shared LRU planner can be used. */
  key: string;
  size: number;
  lastAccess: number;
  meta: StoreMeta;
};

type Index = { version: 1; entries: IndexEntry[] };

export type OpenedFile = {
  /** file:// URI of the decrypted temp copy. Valid until `release()`. */
  uri: string;
  size: number;
  meta: StoreMeta;
  /** Deletes the temp copy. Always call it (viewer closed, screen left). Safe to call twice. */
  release(): Promise<void>;
};

export type EncryptedStore = {
  put(id: string, bytes: Uint8Array, meta?: StoreMeta): Promise<boolean>;
  has(id: string): Promise<boolean>;
  getMeta(id: string): Promise<StoreMeta | null>;
  setMeta(id: string, meta: StoreMeta): Promise<void>;
  readBytes(id: string): Promise<Uint8Array | null>;
  open(id: string): Promise<OpenedFile | null>;
  evict(id: string): Promise<void>;
  /** Removes every entry whose id starts with `prefix` (e.g. everything of one conversation). */
  evictPrefix(prefix: string): Promise<void>;
  totalBytes(): Promise<number>;
  /** Applies the size and age limits now. */
  trim(): Promise<void>;
  /** Deletes any decrypted temp files left by a crash or a missed release. */
  sweepTemp(): Promise<void>;
  /** Deletes all files, the index and the master key (logout, account switch, device replaced). */
  wipe(): Promise<void>;
};

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export function toBase64(bytes: Uint8Array): string {
  const table = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let out = '';

  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i] ?? 0;
    const b = bytes[i + 1] ?? 0;
    const c = bytes[i + 2] ?? 0;
    const triple = (a << 16) | (b << 8) | c;

    out += table[(triple >> 18) & 63];
    out += table[(triple >> 12) & 63];
    out += i + 1 < bytes.length ? table[(triple >> 6) & 63] : '=';
    out += i + 2 < bytes.length ? table[triple & 63] : '=';
  }

  return out;
}

export function fromBase64(text: string): Uint8Array {
  const table = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const clean = text.replace(/[^A-Za-z0-9+/]/g, '');
  const out: number[] = [];
  let buffer = 0;
  let bits = 0;

  for (const char of clean) {
    buffer = (buffer << 6) | table.indexOf(char);
    bits += 6;

    if (bits >= 8) {
      bits -= 8;
      out.push((buffer >> bits) & 255);
    }
  }

  return Uint8Array.from(out);
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function u32(value: number): Uint8Array {
  const out = new Uint8Array(4);

  new DataView(out.buffer).setUint32(0, value);

  return out;
}

function readU32(bytes: Uint8Array, offset = 0): number {
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(offset);
}

function concat(parts: readonly Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;

  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }

  return out;
}

function chunkAad(name: string, index: number, count: number, size: number): Uint8Array {
  return encoder.encode(`pse1|chunk|${name}|${index}|${count}|${size}`);
}

export function createEncryptedStoreCore(deps: StoreDeps, options: StoreOptions): EncryptedStore {
  const indexPath = `${options.dir}/index.pse`;
  let masterKey: Uint8Array | null = null;
  let indexCache: Index | null = null;
  let queue: Promise<unknown> = Promise.resolve();

  /** All mutations run one after another so the index file is never written concurrently. */
  function serial<T>(task: () => Promise<T>): Promise<T> {
    const next = queue.then(task, task);

    queue = next.catch(() => undefined);

    return next;
  }

  async function getMaster(create: boolean): Promise<Uint8Array | null> {
    if (masterKey) {
      return masterKey;
    }

    const stored = await deps.keyStore.get();

    if (stored) {
      const decoded = fromBase64(stored);

      if (decoded.length === KEY_BYTES) {
        masterKey = decoded;
        return masterKey;
      }
    }

    if (!create) {
      return null;
    }

    masterKey = deps.random(KEY_BYTES);
    await deps.keyStore.set(toBase64(masterKey));

    return masterKey;
  }

  async function loadIndex(): Promise<Index> {
    if (indexCache) {
      return indexCache;
    }

    const empty: Index = { version: 1, entries: [] };
    const master = await getMaster(false);

    if (!master || !(await deps.fs.exists(indexPath))) {
      indexCache = empty;
      return indexCache;
    }

    try {
      const sealed = await deps.fs.readFile(indexPath);
      const plain = await deps.open(master, sealed, encoder.encode('pse1|index'));
      const parsed = JSON.parse(decoder.decode(plain)) as Index;

      indexCache = parsed.version === 1 && Array.isArray(parsed.entries) ? parsed : empty;
    } catch {
      // Lost or tampered index: the files cannot be attributed any more, so start clean (files are removed as orphans).
      indexCache = empty;
    }

    return indexCache;
  }

  async function saveIndex(index: Index): Promise<void> {
    const master = await getMaster(true);

    if (!master) {
      return;
    }

    await deps.fs.ensureDir(options.dir);
    indexCache = index;
    await deps.fs.writeFile(
      indexPath,
      await deps.seal(master, encoder.encode(JSON.stringify(index)), encoder.encode('pse1|index')),
    );
  }

  async function writeEncrypted(
    name: string,
    master: Uint8Array,
    bytes: Uint8Array,
  ): Promise<void> {
    const fileKey = deps.random(KEY_BYTES);
    const wrapped = await deps.seal(master, fileKey, encoder.encode(`pse1|key|${name}`));
    const count = Math.max(1, Math.ceil(bytes.length / CHUNK_SIZE));
    const writer = await deps.fs.openWriter(`${options.dir}/${name}`);

    try {
      await writer.write(
        concat([
          Uint8Array.from(MAGIC),
          u32(wrapped.length),
          wrapped,
          u32(count),
          u32(bytes.length),
        ]),
      );

      for (let index = 0; index < count; index += 1) {
        const sealed = await deps.seal(
          fileKey,
          bytes.subarray(index * CHUNK_SIZE, (index + 1) * CHUNK_SIZE),
          chunkAad(name, index, count, bytes.length),
        );

        await writer.write(concat([u32(sealed.length), sealed]));
      }
    } finally {
      await writer.close();
    }
  }

  /** Decrypts a stored file chunk by chunk, handing each plain chunk to `sink` (memory or a temp file). */
  async function readEncrypted(
    name: string,
    master: Uint8Array,
    sink: (chunk: Uint8Array) => Promise<void>,
  ): Promise<number> {
    const reader = await deps.fs.openReader(`${options.dir}/${name}`);

    try {
      const head = await reader.read(8);

      if (head.length < 8 || MAGIC.some((value, i) => head[i] !== value)) {
        throw new Error('Not an encrypted store file');
      }

      const wrapped = await reader.read(readU32(head, 4));
      const fileKey = await deps.open(master, wrapped, encoder.encode(`pse1|key|${name}`));
      const counts = await reader.read(8);
      const count = readU32(counts, 0);
      const size = readU32(counts, 4);
      let produced = 0;

      for (let index = 0; index < count; index += 1) {
        const length = readU32(await reader.read(4));
        const sealed = await reader.read(length);

        if (sealed.length !== length) {
          throw new Error('Truncated encrypted file');
        }

        const plain = await deps.open(fileKey, sealed, chunkAad(name, index, count, size));

        produced += plain.length;
        await sink(plain);
      }

      if (produced !== size) {
        throw new Error('Encrypted file size mismatch');
      }

      return size;
    } finally {
      await reader.close();
    }
  }

  async function dropFile(name: string): Promise<void> {
    await deps.fs.remove(`${options.dir}/${name}`).catch(() => undefined);
  }

  async function applyLimits(index: Index, protect: readonly string[]): Promise<Index> {
    const evict = planEviction(index.entries, {
      now: deps.now(),
      maxBytes: options.maxBytes,
      maxAgeMs: options.maxAgeMs,
      protect,
    });

    if (evict.length === 0) {
      return index;
    }

    const gone = new Set(evict);

    await Promise.all(
      index.entries.filter((entry) => gone.has(entry.key)).map((entry) => dropFile(entry.name)),
    );

    return { version: 1, entries: index.entries.filter((entry) => !gone.has(entry.key)) };
  }

  /** Corrupt or unreadable entry: forget it so the caller simply downloads it again. */
  async function forget(id: string): Promise<void> {
    await serial(async () => {
      const index = await loadIndex();
      const entry = index.entries.find((candidate) => candidate.id === id);

      if (entry) {
        await dropFile(entry.name);
        await saveIndex({
          version: 1,
          entries: index.entries.filter((candidate) => candidate.id !== id),
        });
      }
    });
  }

  async function touch(id: string): Promise<void> {
    await serial(async () => {
      const index = await loadIndex();

      if (index.entries.some((entry) => entry.id === id)) {
        await saveIndex({
          version: 1,
          entries: index.entries.map((entry) =>
            entry.id === id ? { ...entry, lastAccess: deps.now() } : entry,
          ),
        });
      }
    });
  }

  async function find(id: string): Promise<IndexEntry | null> {
    return serial(async () => (await loadIndex()).entries.find((entry) => entry.id === id) ?? null);
  }

  return {
    async put(id, bytes, meta = {}) {
      if (bytes.length === 0 || bytes.length > options.maxEntryBytes) {
        return false;
      }

      return serial(async () => {
        const master = await getMaster(true);

        if (!master) {
          return false;
        }

        await deps.fs.ensureDir(options.dir);

        const name = `${toHex(deps.random(16))}.pse`;

        try {
          await writeEncrypted(name, master, bytes);
        } catch {
          await dropFile(name);
          return false;
        }

        const index = await loadIndex();
        const previous = index.entries.find((entry) => entry.id === id);
        const entry: IndexEntry = {
          id,
          key: id,
          name,
          size: bytes.length,
          lastAccess: deps.now(),
          meta,
        };

        if (previous) {
          await dropFile(previous.name);
        }

        const next = await applyLimits(
          {
            version: 1,
            entries: [...index.entries.filter((candidate) => candidate.id !== id), entry],
          },
          [id],
        );

        await saveIndex(next);

        return true;
      });
    },

    async has(id) {
      return (await find(id)) !== null;
    },

    async getMeta(id) {
      return (await find(id))?.meta ?? null;
    },

    async setMeta(id, meta) {
      await serial(async () => {
        const index = await loadIndex();

        if (index.entries.some((entry) => entry.id === id)) {
          await saveIndex({
            version: 1,
            entries: index.entries.map((entry) => (entry.id === id ? { ...entry, meta } : entry)),
          });
        }
      });
    },

    async readBytes(id) {
      const entry = await find(id);
      const master = await getMaster(false);

      if (!entry || !master) {
        return null;
      }

      const chunks: Uint8Array[] = [];

      try {
        await readEncrypted(entry.name, master, async (chunk) => {
          chunks.push(chunk);
        });
      } catch {
        await forget(id);
        return null;
      }

      void touch(id);

      return concat(chunks);
    },

    async open(id) {
      const entry = await find(id);
      const master = await getMaster(false);

      if (!entry || !master) {
        return null;
      }

      await deps.fs.ensureDir(options.tempDir);

      const path = `${options.tempDir}/${toHex(deps.random(12))}.bin`;
      const writer = await deps.fs.openWriter(path);

      try {
        await readEncrypted(entry.name, master, (chunk) => writer.write(chunk));
        await writer.close();
      } catch {
        await writer.close().catch(() => undefined);
        await deps.fs.remove(path).catch(() => undefined);
        await forget(id);
        return null;
      }

      void touch(id);

      let released = false;

      return {
        uri: path.startsWith('file://') ? path : `file://${path}`,
        size: entry.size,
        meta: entry.meta,
        async release() {
          if (!released) {
            released = true;
            await deps.fs.remove(path).catch(() => undefined);
          }
        },
      };
    },

    async evict(id) {
      await forget(id);
    },

    async evictPrefix(prefix) {
      await serial(async () => {
        const index = await loadIndex();
        const doomed = index.entries.filter((entry) => entry.id.startsWith(prefix));

        await Promise.all(doomed.map((entry) => dropFile(entry.name)));
        await saveIndex({
          version: 1,
          entries: index.entries.filter((entry) => !entry.id.startsWith(prefix)),
        });
      });
    },

    async totalBytes() {
      return serial(async () =>
        (await loadIndex()).entries.reduce((sum, entry) => sum + entry.size, 0),
      );
    },

    async trim() {
      await serial(async () => {
        const index = await loadIndex();
        const known = new Set(index.entries.map((entry) => entry.name));
        const files = await deps.fs.list(options.dir).catch(() => [] as string[]);

        // Files the index does not know (crash between write and index save, or a lost index) are unreadable garbage.
        await Promise.all(
          files
            .filter((name) => name.endsWith('.pse') && name !== 'index.pse' && !known.has(name))
            .map((name) => dropFile(name)),
        );

        const next = await applyLimits(index, []);

        if (next !== index) {
          await saveIndex(next);
        }
      });
    },

    async sweepTemp() {
      await deps.fs.removeDir(options.tempDir).catch(() => undefined);
    },

    async wipe() {
      await serial(async () => {
        indexCache = { version: 1, entries: [] };
        masterKey = null;
        await deps.fs.removeDir(options.dir).catch(() => undefined);
        await deps.fs.removeDir(options.tempDir).catch(() => undefined);
        await deps.keyStore.remove().catch(() => undefined);
      });
    },
  };
}
