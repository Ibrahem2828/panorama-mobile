import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

import {
  CHUNK_SIZE,
  createEncryptedStoreCore,
  fromBase64,
  toBase64,
  type EncryptedStore,
  type StoreDeps,
} from '../encryptedStoreCore';

type Disk = Map<string, Uint8Array>;

function makeDeps(disk: Disk, keyBox: { value: string | null }, clock: { t: number }): StoreDeps {
  const concat = (a: Uint8Array, b: Uint8Array) => {
    const out = new Uint8Array(a.length + b.length);

    out.set(a);
    out.set(b, a.length);

    return out;
  };

  return {
    random: (n) => new Uint8Array(randomBytes(n)),
    async seal(key, plain, aad) {
      const iv = randomBytes(12);
      const cipher = createCipheriv('aes-256-gcm', key, iv);

      cipher.setAAD(aad);

      const ct = Buffer.concat([cipher.update(plain), cipher.final()]);

      return new Uint8Array(Buffer.concat([iv, ct, cipher.getAuthTag()]));
    },
    async open(key, sealed, aad) {
      const buffer = Buffer.from(sealed);
      const decipher = createDecipheriv('aes-256-gcm', key, buffer.subarray(0, 12));

      decipher.setAAD(aad);
      decipher.setAuthTag(buffer.subarray(buffer.length - 16));

      return new Uint8Array(
        Buffer.concat([decipher.update(buffer.subarray(12, buffer.length - 16)), decipher.final()]),
      );
    },
    keyStore: {
      get: async () => keyBox.value,
      set: async (value) => {
        keyBox.value = value;
      },
      remove: async () => {
        keyBox.value = null;
      },
    },
    fs: {
      ensureDir: async () => undefined,
      readFile: async (path) => {
        const data = disk.get(path);

        if (!data) throw new Error('ENOENT');

        return data;
      },
      writeFile: async (path, bytes) => {
        disk.set(path, bytes);
      },
      openWriter: async (path) => {
        disk.set(path, new Uint8Array(0));

        return {
          write: async (bytes) => {
            disk.set(path, concat(disk.get(path) ?? new Uint8Array(0), bytes));
          },
          close: async () => undefined,
        };
      },
      openReader: async (path) => {
        const data = disk.get(path);

        if (!data) throw new Error('ENOENT');

        let offset = 0;

        return {
          size: data.length,
          read: async (length) => {
            const slice = data.subarray(offset, offset + length);

            offset += length;

            return slice;
          },
          close: async () => undefined,
        };
      },
      exists: async (path) => disk.has(path),
      remove: async (path) => {
        disk.delete(path);
      },
      removeDir: async (dir) => {
        for (const key of [...disk.keys()]) {
          if (key.startsWith(`${dir}/`)) disk.delete(key);
        }
      },
      list: async (dir) =>
        [...disk.keys()].filter((k) => k.startsWith(`${dir}/`)).map((k) => k.slice(dir.length + 1)),
    },
    now: () => clock.t,
  };
}

function setup(over: { maxBytes?: number } = {}) {
  const disk: Disk = new Map();
  const keyBox: { value: string | null } = { value: null };
  const clock = { t: 1_000_000 };
  const store: EncryptedStore = createEncryptedStoreCore(makeDeps(disk, keyBox, clock), {
    dir: '/priv/store',
    tempDir: '/cache/open',
    maxBytes: over.maxBytes ?? 10 * 1024 * 1024,
    maxEntryBytes: 8 * 1024 * 1024,
    maxAgeMs: 1000 * 60,
  });

  return { disk, keyBox, clock, store };
}

const sample = (length: number) => new Uint8Array(randomBytes(length));
const storedFiles = (disk: Disk) =>
  [...disk.keys()].filter((k) => k.startsWith('/priv/store/') && !k.endsWith('index.pse'));

describe('base64 helpers', () => {
  it('round-trips arbitrary bytes', () => {
    for (const length of [0, 1, 2, 3, 31, 32, 100]) {
      const bytes = sample(length);

      expect(Array.from(fromBase64(toBase64(bytes)))).toEqual(Array.from(bytes));
    }

    expect(toBase64(new TextEncoder().encode('Man'))).toBe('TWFu');
  });
});

describe('encrypted store', () => {
  it('round-trips small and multi-chunk files and never keeps plaintext on disk', async () => {
    const { store, disk } = setup();
    const small = new TextEncoder().encode('PLAINTEXT-MARKER-PLAINTEXT-MARKER');
    const big = sample(CHUNK_SIZE * 2 + 123);

    expect(await store.put('a', small, { mime: 'image/png', etag: '"1"' })).toBe(true);
    expect(await store.put('b', big)).toBe(true);
    expect(Array.from((await store.readBytes('a')) ?? [])).toEqual(Array.from(small));
    expect(Buffer.from((await store.readBytes('b')) ?? []).equals(Buffer.from(big))).toBe(true);
    expect(await store.getMeta('a')).toEqual({ mime: 'image/png', etag: '"1"' });

    for (const data of disk.values()) {
      expect(Buffer.from(data).includes(Buffer.from('PLAINTEXT-MARKER'))).toBe(false);
    }
  });

  it('detects tampering, truncation and swapped files, and forgets the broken entry', async () => {
    const { store, disk } = setup();

    await store.put('a', sample(5000));
    await store.put('b', sample(5000));

    const [fileA, fileB] = storedFiles(disk);
    const original = disk.get(fileA as string) as Uint8Array;
    const flipped = new Uint8Array(original);

    flipped[flipped.length - 20] = (flipped[flipped.length - 20] ?? 0) ^ 1;
    disk.set(fileA as string, flipped);
    expect(await store.readBytes('a')).toBeNull();
    expect(await store.has('a')).toBe(false);

    disk.set(fileB as string, (disk.get(fileB as string) as Uint8Array).subarray(0, 60));
    expect(await store.readBytes('b')).toBeNull();
  });

  it('refuses a chunk moved to another file name', async () => {
    const { store, disk } = setup();

    await store.put('a', sample(100));
    await store.put('b', sample(100));

    const [fileA, fileB] = storedFiles(disk);

    disk.set(fileB as string, disk.get(fileA as string) as Uint8Array);
    expect(await store.readBytes('b')).toBeNull();
  });

  it('opens a decrypted temp file that release() deletes', async () => {
    const { store, disk } = setup();
    const data = sample(CHUNK_SIZE + 10);

    await store.put('a', data);

    const opened = await store.open('a');

    expect(opened?.uri.startsWith('file:///cache/open/')).toBe(true);
    expect(disk.get((opened?.uri ?? '').replace('file://', ''))?.length).toBe(data.length);
    await opened?.release();
    await opened?.release();
    expect([...disk.keys()].some((k) => k.startsWith('/cache/open/'))).toBe(false);
  });

  it('sweeps temp files a crash left behind', async () => {
    const { store, disk } = setup();

    await store.put('a', sample(10));
    await store.open('a');
    expect([...disk.keys()].some((k) => k.startsWith('/cache/open/'))).toBe(true);
    await store.sweepTemp();
    expect([...disk.keys()].some((k) => k.startsWith('/cache/open/'))).toBe(false);
  });

  it('evicts least recently used entries over the size cap, but keeps the one just written', async () => {
    const { store, clock } = setup({ maxBytes: 3000 });

    await store.put('old', sample(1500));
    clock.t += 10;
    await store.put('mid', sample(1500));
    clock.t += 10;
    await store.readBytes('old'); // old becomes the most recently used
    clock.t += 10;
    await store.put('new', sample(1500));

    expect(await store.has('mid')).toBe(false);
    expect(await store.has('old')).toBe(true);
    expect(await store.has('new')).toBe(true);
    expect(await store.totalBytes()).toBeLessThanOrEqual(3000);
  });

  it('drops entries by age and refuses oversize or empty files', async () => {
    const { store, clock } = setup();

    expect(await store.put('empty', new Uint8Array(0))).toBe(false);
    expect(await store.put('huge', new Uint8Array(8 * 1024 * 1024 + 1))).toBe(false);
    await store.put('a', sample(10));
    clock.t += 1000 * 61;
    await store.trim();
    expect(await store.has('a')).toBe(false);
  });

  it('evicts by prefix and replaces an id without leaking the old file', async () => {
    const { store, disk } = setup();

    await store.put('g1:1', sample(10));
    await store.put('g1:2', sample(10));
    await store.put('g2:1', sample(10));
    await store.put('g2:1', sample(20));
    expect(storedFiles(disk)).toHaveLength(3);
    await store.evictPrefix('g1:');
    expect(await store.has('g1:1')).toBe(false);
    expect(await store.has('g2:1')).toBe(true);
    expect(storedFiles(disk)).toHaveLength(1);
  });

  it('wipe removes files, temp files and the master key; old data cannot come back', async () => {
    const { store, disk, keyBox } = setup();

    await store.put('a', sample(100));
    await store.open('a');
    expect(keyBox.value).not.toBeNull();
    await store.wipe();
    expect(disk.size).toBe(0);
    expect(keyBox.value).toBeNull();
    expect(await store.has('a')).toBe(false);
    expect(await store.readBytes('a')).toBeNull();
    expect(await store.put('b', sample(10))).toBe(true);
    expect(keyBox.value).not.toBeNull();
  });

  it('starts clean when the index was lost and removes orphaned files on trim', async () => {
    const { store, disk } = setup();

    await store.put('a', sample(100));
    disk.delete('/priv/store/index.pse');

    const fresh = createEncryptedStoreCore(
      makeDeps(disk, { value: toBase64(sample(32)) }, { t: 5 }),
      {
        dir: '/priv/store',
        tempDir: '/cache/open',
        maxBytes: 1e6,
        maxEntryBytes: 1e6,
        maxAgeMs: 1e9,
      },
    );

    expect(await fresh.has('a')).toBe(false);
    await fresh.trim();
    expect(storedFiles(disk)).toHaveLength(0);
  });

  it('uses a new master key if the stored one is unusable on another install', async () => {
    const { store, disk, keyBox } = setup();

    await store.put('a', sample(100));
    keyBox.value = toBase64(sample(32)); // e.g. keystore reset after a restore: ciphertext is unreadable

    const other = createEncryptedStoreCore(makeDeps(disk, keyBox, { t: 5 }), {
      dir: '/priv/store',
      tempDir: '/cache/open',
      maxBytes: 1e6,
      maxEntryBytes: 1e6,
      maxAgeMs: 1e9,
    });

    expect(await other.readBytes('a')).toBeNull();
  });
});
