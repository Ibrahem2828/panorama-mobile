import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

import fixture from './fixtures/backendPackage.json';
import {
  assertHeaderMatchesLicense,
  buildAad,
  buildNonce,
  chunkCountOf,
  chunkRange,
  decodeContentKey,
  decryptChunk,
  decryptPackage,
  encodeBase64,
  PnofError,
  PNOF_HEADER_SIZE,
  packageSizeOf,
  parsePnofHeader,
  type ChunkOpener,
} from '../pnof';

const fromHex = (hex: string) => Uint8Array.from(Buffer.from(hex, 'hex'));

/** Same primitive the app uses natively, here from node: AES-256-GCM, 12 byte nonce, 16 byte tag appended. */
const nodeOpener: ChunkOpener = async (key, nonce, aad, sealed) => {
  const decipher = createDecipheriv('aes-256-gcm', key, nonce);

  decipher.setAAD(aad);
  decipher.setAuthTag(Buffer.from(sealed.subarray(sealed.length - 16)));

  return Uint8Array.from(
    Buffer.concat([decipher.update(sealed.subarray(0, sealed.length - 16)), decipher.final()]),
  );
};

/** Independent encryptor following docs/OFFLINE_LECTURE_PACKAGES.md (not the code under test). */
function buildPackage(
  plain: Uint8Array,
  key: Uint8Array,
  chunkSize: number,
  keyId = randomBytes(16),
  noncePrefix = randomBytes(4),
): Uint8Array {
  const header = Buffer.alloc(40);

  header.write('PNOF', 0, 'latin1');
  header[4] = 1;
  header[5] = 1;
  header.writeUInt16BE(0, 6);
  header.writeUInt32BE(chunkSize, 8);
  header.writeBigUInt64BE(BigInt(plain.length), 12);
  keyId.copy(header, 20);
  noncePrefix.copy(header, 36);

  const chunks = Math.ceil(plain.length / chunkSize);
  const parts: Buffer[] = [header];

  for (let i = 0; i < chunks; i += 1) {
    const nonce = Buffer.alloc(12);

    noncePrefix.copy(nonce, 0);
    nonce.writeBigUInt64BE(BigInt(i), 4);

    const aad = Buffer.alloc(45);

    header.copy(aad, 0);
    aad.writeUInt32BE(i, 40);
    aad[44] = i === chunks - 1 ? 1 : 0;

    const cipher = createCipheriv('aes-256-gcm', key, nonce);

    cipher.setAAD(aad);
    parts.push(
      cipher.update(plain.subarray(i * chunkSize, (i + 1) * chunkSize)),
      cipher.final(),
      cipher.getAuthTag(),
    );
  }

  return Uint8Array.from(Buffer.concat(parts));
}

async function decryptAll(pkg: Uint8Array, key: Uint8Array, batchChunks = 3): Promise<Uint8Array> {
  const header = parsePnofHeader(pkg);
  const out: Uint8Array[] = [];

  await decryptPackage(
    header,
    key,
    { size: pkg.length, read: async (start, length) => pkg.slice(start, start + length) },
    { write: (bytes) => void out.push(bytes) },
    nodeOpener,
    { batchChunks },
  );

  return Uint8Array.from(Buffer.concat(out));
}

describe('PNOF header and layout', () => {
  it('computes chunk counts and package size like the backend', () => {
    expect(chunkCountOf(200, 64)).toBe(4);
    expect(chunkCountOf(128, 64)).toBe(2);
    expect(chunkCountOf(0, 64)).toBe(0);
    expect(packageSizeOf(200, 64)).toBe(40 + 200 + 16 * 4);
  });

  it('parses the header of a package built by the backend encryptor', () => {
    const header = parsePnofHeader(fromHex(fixture.packageHex));

    expect(header.chunkSize).toBe(64);
    expect(header.plaintextSize).toBe(200);
    expect(header.chunkCount).toBe(4);
    expect(header.packageSize).toBe(fixture.size);
    expect(chunkRange(header, 0)).toEqual({ start: 40, length: 80, plainLength: 64 });
    expect(chunkRange(header, 3)).toEqual({ start: 40 + 3 * 80, length: 8 + 16, plainLength: 8 });
  });

  it('builds the nonce and aad exactly as documented', () => {
    const nonce = buildNonce(Uint8Array.from([1, 2, 3, 4]), 0x0102030405);

    expect(Array.from(nonce)).toEqual([1, 2, 3, 4, 0, 0, 0, 1, 2, 3, 4, 5]);

    const raw = new Uint8Array(40).fill(7);
    const aad = buildAad(raw, 258, true);

    expect(aad.length).toBe(45);
    expect(Array.from(aad.slice(40))).toEqual([0, 0, 1, 2, 1]);
    expect(buildAad(raw, 1, false)[44]).toBe(0);
  });

  it('rejects bad magic, versions, short headers and absurd sizes', () => {
    const good = fromHex(fixture.packageHex);
    const bad = (mutate: (copy: Uint8Array) => void) => {
      const copy = good.slice();

      mutate(copy);

      return () => parsePnofHeader(copy);
    };

    expect(() => parsePnofHeader(good.slice(0, 20))).toThrow(PnofError);
    expect(bad((c) => (c[0] = 0))).toThrow(/magic/u);
    expect(bad((c) => (c[4] = 2))).toThrow(/unsupported/u);
    expect(bad((c) => (c[5] = 9))).toThrow(/unsupported/u);
    expect(bad((c) => (c[7] = 1))).toThrow(/unsupported/u);
    expect(bad((c) => c.fill(0, 8, 12))).toThrow(/chunk size/u);
    expect(bad((c) => c.fill(0xff, 12, 20))).toThrow(PnofError);
  });

  it('checks the header against the license response', () => {
    const header = parsePnofHeader(fromHex(fixture.packageHex));
    const expected = {
      keyId: fixture.keyId,
      plaintextSize: 200,
      chunkSize: 64,
      fileSize: fixture.size,
    };

    expect(() => assertHeaderMatchesLicense(header, expected)).not.toThrow();
    expect(() =>
      assertHeaderMatchesLicense(header, { ...expected, keyId: '00000000-0000-0000-0000-000000000000' }),
    ).toThrow(/key id/u);
    expect(() => assertHeaderMatchesLicense(header, { ...expected, fileSize: 1 })).toThrow(/sizes/u);
  });
});

describe('PNOF decryption', () => {
  it('decrypts the cross-language vector produced by the backend encryptor', async () => {
    const plain = await decryptAll(fromHex(fixture.packageHex), fromHex(fixture.keyHex));

    expect(Buffer.from(plain).toString('hex')).toBe(fixture.plaintextHex);
    expect(Buffer.from(plain.slice(0, 5)).toString('latin1')).toBe('%PDF-');
  });

  it('round-trips random documents for every chunk boundary shape', async () => {
    const key = randomBytes(32);

    for (const [length, chunk] of [
      [1, 16],
      [16, 16],
      [17, 16],
      [64, 16],
      [1000, 64],
      [65536, 65536],
      [65537, 65536],
    ] as const) {
      const plain = Uint8Array.from(randomBytes(length));
      const pkg = buildPackage(plain, key, chunk);

      expect(pkg.length).toBe(packageSizeOf(length, chunk));
      expect(Buffer.from(await decryptAll(pkg, key, 5))).toEqual(Buffer.from(plain));
    }
  });

  it('reports progress and honours cancellation', async () => {
    const key = randomBytes(32);
    const pkg = buildPackage(Uint8Array.from(randomBytes(1000)), key, 64);
    const header = parsePnofHeader(pkg);
    const progress: number[] = [];
    const read = async (start: number, length: number) => pkg.slice(start, start + length);

    await decryptPackage(
      header,
      key,
      { size: pkg.length, read },
      { write: () => undefined },
      nodeOpener,
      { batchChunks: 4, onProgress: (done) => progress.push(done) },
    );
    expect(progress[progress.length - 1]).toBe(1000);
    expect(progress).toEqual([...progress].sort((a, b) => a - b));

    await expect(
      decryptPackage(header, key, { size: pkg.length, read }, { write: () => undefined }, nodeOpener, {
        isCancelled: () => true,
      }),
    ).rejects.toMatchObject({ failure: 'cancelled' });
  });

  it('fails with the wrong key', async () => {
    const pkg = buildPackage(Uint8Array.from(randomBytes(300)), randomBytes(32), 64);

    await expect(decryptAll(pkg, randomBytes(32))).rejects.toMatchObject({ failure: 'tamper' });
  });

  it('detects a flipped ciphertext byte, a flipped tag byte and a flipped header byte', async () => {
    const key = randomBytes(32);
    const pkg = buildPackage(Uint8Array.from(randomBytes(300)), key, 64);

    for (const offset of [PNOF_HEADER_SIZE + 3, PNOF_HEADER_SIZE + 70, 41 + 64 * 2 + 40, 12]) {
      const copy = pkg.slice();

      copy[offset] ^= 0x01;
      // A header edit may also be rejected while parsing; either way it never yields plaintext.
      await expect(decryptAll(copy, key)).rejects.toBeInstanceOf(PnofError);
    }
  });

  it('detects truncation (whole chunks and a cut tail)', async () => {
    const key = randomBytes(32);
    const pkg = buildPackage(Uint8Array.from(randomBytes(300)), key, 64);

    await expect(decryptAll(pkg.slice(0, pkg.length - 5), key)).rejects.toMatchObject({
      failure: 'size',
    });
    await expect(decryptAll(pkg.slice(0, pkg.length - 80), key)).rejects.toMatchObject({
      failure: 'size',
    });
  });

  it('detects truncation even when the header is rewritten to match (final flag in the aad)', async () => {
    const key = randomBytes(32);
    const plain = Uint8Array.from(randomBytes(256));
    const full = buildPackage(plain, key, 64, Buffer.alloc(16, 1), Buffer.alloc(4, 2));
    // Attacker keeps the first 3 chunks and edits the header's plaintext_size to 192: the header is in every aad, so no tag verifies.
    const cut = full.slice(0, 40 + 3 * 80);

    new DataView(cut.buffer, cut.byteOffset).setUint32(16, 192);
    await expect(decryptAll(cut, key)).rejects.toMatchObject({ failure: 'tamper' });

    // Header untouched but the last chunk removed: size check catches it.
    await expect(decryptAll(full.slice(0, 40 + 3 * 80), key)).rejects.toMatchObject({ failure: 'size' });
  });

  it('detects reordered and duplicated chunks', async () => {
    const key = randomBytes(32);
    const pkg = buildPackage(Uint8Array.from(randomBytes(256)), key, 64);
    const header = parsePnofHeader(pkg);
    const slot = (i: number) => pkg.slice(chunkRange(header, i).start, chunkRange(header, i).start + 80);
    const swapped = Uint8Array.from(
      Buffer.concat([pkg.slice(0, 40), slot(1), slot(0), slot(2), slot(3)]),
    );
    const duplicated = Uint8Array.from(
      Buffer.concat([pkg.slice(0, 40), slot(0), slot(0), slot(2), slot(3)]),
    );

    await expect(decryptAll(swapped, key)).rejects.toMatchObject({ failure: 'tamper' });
    await expect(decryptAll(duplicated, key)).rejects.toMatchObject({ failure: 'tamper' });
  });

  it('rejects a chunk moved to the final position (final flag)', async () => {
    const key = randomBytes(32);
    const pkg = buildPackage(Uint8Array.from(randomBytes(128)), key, 64);
    const header = parsePnofHeader(pkg);

    await expect(
      decryptChunk(header, key, 1, pkg.slice(40, 40 + 80), nodeOpener),
    ).rejects.toMatchObject({ failure: 'tamper' });
  });

  it('rejects an appended extra chunk', async () => {
    const key = randomBytes(32);
    const pkg = buildPackage(Uint8Array.from(randomBytes(128)), key, 64);
    const extended = Uint8Array.from(Buffer.concat([pkg, randomBytes(80)]));

    await expect(decryptAll(extended, key)).rejects.toMatchObject({ failure: 'size' });
  });
});

describe('content key encoding', () => {
  it('decodes a 32 byte base64 key and refuses anything else', () => {
    const key = randomBytes(32);

    expect(Buffer.from(decodeContentKey(key.toString('base64')))).toEqual(key);
    expect(encodeBase64(key)).toBe(key.toString('base64'));
    expect(() => decodeContentKey(randomBytes(16).toString('base64'))).toThrow(/length/u);
    expect(() => decodeContentKey('not base64!!')).toThrow(/encoding/u);
  });
});
