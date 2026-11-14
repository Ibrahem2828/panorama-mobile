/**
 * PNOF v1: the offline lecture package format of backend PR #55 (docs/OFFLINE_LECTURE_PACKAGES.md, authoritative).
 * Pure: no native modules. The AES-GCM primitive is injected (`ChunkOpener`), so unit tests drive the exact same code with
 * node's crypto and the app drives it with expo-crypto's native AES.
 *
 * All integers are big-endian.
 *   header (40): magic 'PNOF'(4) | version(1)=1 | algorithm(1)=1 | flags(2)=0 | chunk_size(4) | plaintext_size(8)
 *                | key_id(16) | nonce_prefix(4)
 *   chunk i = ciphertext (same length as the plaintext chunk) + 16 byte tag
 *   nonce_i = nonce_prefix || uint64_be(i)               (12 bytes)
 *   aad_i   = header(40) || uint32_be(i) || final(1)     final = 1 on the last chunk, else 0
 */

export const PNOF_HEADER_SIZE = 40;
export const PNOF_TAG_SIZE = 16;
export const PNOF_NONCE_SIZE = 12;
export const PNOF_MAX_CHUNK_SIZE = 16 * 1024 * 1024;

export type PnofFailure =
  | 'header'
  | 'unsupported'
  | 'size'
  | 'tamper'
  | 'key'
  | 'cancelled'
  | 'mismatch';

export class PnofError extends Error {
  readonly failure: PnofFailure;

  constructor(failure: PnofFailure, detail?: string) {
    super(detail ? `PNOF ${failure}: ${detail}` : `PNOF ${failure}`);
    this.failure = failure;
  }
}

export type PnofHeader = {
  version: number;
  algorithm: number;
  flags: number;
  chunkSize: number;
  plaintextSize: number;
  /** 16 raw bytes. */
  keyId: Uint8Array;
  noncePrefix: Uint8Array;
  /** The 40 header bytes exactly as stored: they are part of every chunk's AAD. */
  raw: Uint8Array;
  chunkCount: number;
  /** Total package size in bytes. */
  packageSize: number;
};

/** Opens one sealed chunk (`ciphertext || tag`) or throws. Implementations must verify the tag against `aad`. */
export type ChunkOpener = (
  key: Uint8Array,
  nonce: Uint8Array,
  aad: Uint8Array,
  ciphertextWithTag: Uint8Array,
) => Promise<Uint8Array>;

export function chunkCountOf(plaintextSize: number, chunkSize: number): number {
  return plaintextSize === 0 ? 0 : Math.ceil(plaintextSize / chunkSize);
}

export function packageSizeOf(plaintextSize: number, chunkSize: number): number {
  return PNOF_HEADER_SIZE + plaintextSize + PNOF_TAG_SIZE * chunkCountOf(plaintextSize, chunkSize);
}

function readUint32(bytes: Uint8Array, offset: number): number {
  const at = (i: number) => bytes[offset + i] ?? 0;

  return at(0) * 0x1000000 + ((at(1) << 16) | (at(2) << 8) | at(3));
}

function readUint64(bytes: Uint8Array, offset: number): number {
  const high = readUint32(bytes, offset);
  const low = readUint32(bytes, offset + 4);

  return high * 0x100000000 + low;
}

export function parsePnofHeader(bytes: Uint8Array): PnofHeader {
  if (bytes.length < PNOF_HEADER_SIZE) {
    throw new PnofError('header', 'too short');
  }

  if (bytes[0] !== 0x50 || bytes[1] !== 0x4e || bytes[2] !== 0x4f || bytes[3] !== 0x46) {
    throw new PnofError('header', 'bad magic');
  }

  const version = bytes[4] ?? 0;
  const algorithm = bytes[5] ?? 0;
  const flags = ((bytes[6] ?? 0) << 8) | (bytes[7] ?? 0);

  if (version !== 1 || algorithm !== 1 || flags !== 0) {
    throw new PnofError('unsupported', `v${version} a${algorithm} f${flags}`);
  }

  const chunkSize = readUint32(bytes, 8);
  const plaintextSize = readUint64(bytes, 12);

  if (chunkSize <= 0 || chunkSize > PNOF_MAX_CHUNK_SIZE) {
    throw new PnofError('header', 'chunk size');
  }

  if (!Number.isSafeInteger(plaintextSize)) {
    throw new PnofError('header', 'plaintext size');
  }

  const raw = bytes.slice(0, PNOF_HEADER_SIZE);

  return {
    version,
    algorithm,
    flags,
    chunkSize,
    plaintextSize,
    keyId: raw.slice(20, 36),
    noncePrefix: raw.slice(36, 40),
    raw,
    chunkCount: chunkCountOf(plaintextSize, chunkSize),
    packageSize: packageSizeOf(plaintextSize, chunkSize),
  };
}

export function buildNonce(noncePrefix: Uint8Array, index: number): Uint8Array {
  const nonce = new Uint8Array(PNOF_NONCE_SIZE);

  nonce.set(noncePrefix.subarray(0, 4), 0);

  const high = Math.floor(index / 0x100000000);
  const low = index % 0x100000000;

  nonce[4] = (high >>> 24) & 0xff;
  nonce[5] = (high >>> 16) & 0xff;
  nonce[6] = (high >>> 8) & 0xff;
  nonce[7] = high & 0xff;
  nonce[8] = (low >>> 24) & 0xff;
  nonce[9] = (low >>> 16) & 0xff;
  nonce[10] = (low >>> 8) & 0xff;
  nonce[11] = low & 0xff;

  return nonce;
}

export function buildAad(headerRaw: Uint8Array, index: number, isFinal: boolean): Uint8Array {
  const aad = new Uint8Array(PNOF_HEADER_SIZE + 5);

  aad.set(headerRaw.subarray(0, PNOF_HEADER_SIZE), 0);
  aad[40] = (index >>> 24) & 0xff;
  aad[41] = (index >>> 16) & 0xff;
  aad[42] = (index >>> 8) & 0xff;
  aad[43] = index & 0xff;
  aad[44] = isFinal ? 1 : 0;

  return aad;
}

/** Byte range of chunk `index` inside the package, including its tag, and its plaintext length. */
export function chunkRange(
  header: PnofHeader,
  index: number,
): { start: number; length: number; plainLength: number } {
  if (index < 0 || index >= header.chunkCount) {
    throw new PnofError('size', 'chunk index');
  }

  const start = PNOF_HEADER_SIZE + index * (header.chunkSize + PNOF_TAG_SIZE);
  const isLast = index === header.chunkCount - 1;
  const plainLength = isLast
    ? header.plaintextSize - header.chunkSize * (header.chunkCount - 1)
    : header.chunkSize;

  return { start, length: plainLength + PNOF_TAG_SIZE, plainLength };
}

export function keyIdHex(keyId: Uint8Array): string {
  return Array.from(keyId, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/** Compares the header against what the license promised (`key_id` UUID string, sizes). */
export function assertHeaderMatchesLicense(
  header: PnofHeader,
  expected: { keyId: string; plaintextSize: number; chunkSize: number; fileSize: number },
): void {
  const wanted = expected.keyId.replace(/-/gu, '').toLowerCase();

  if (keyIdHex(header.keyId) !== wanted) {
    throw new PnofError('mismatch', 'key id');
  }

  if (
    header.plaintextSize !== expected.plaintextSize ||
    header.chunkSize !== expected.chunkSize ||
    header.packageSize !== expected.fileSize
  ) {
    throw new PnofError('mismatch', 'sizes');
  }
}

export function decodeContentKey(base64: string): Uint8Array {
  const clean = base64.trim();

  if (!/^[A-Za-z0-9+/]+={0,2}$/u.test(clean)) {
    throw new PnofError('key', 'encoding');
  }

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const out: number[] = [];
  let buffer = 0;
  let bits = 0;

  for (const char of clean.replace(/=+$/u, '')) {
    buffer = (buffer << 6) | alphabet.indexOf(char);
    bits += 6;

    if (bits >= 8) {
      bits -= 8;
      out.push((buffer >> bits) & 0xff);
    }
  }

  if (out.length !== 32) {
    throw new PnofError('key', 'length');
  }

  return Uint8Array.from(out);
}

export function encodeBase64(bytes: Uint8Array): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let out = '';

  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i] ?? 0;
    const b = bytes[i + 1] ?? 0;
    const c = bytes[i + 2] ?? 0;

    out += (alphabet[a >> 2] ?? '') + (alphabet[((a & 3) << 4) | (b >> 4)] ?? '');
    out += i + 1 < bytes.length ? (alphabet[((b & 15) << 2) | (c >> 6)] ?? '') : '=';
    out += i + 2 < bytes.length ? (alphabet[c & 63] ?? '') : '=';
  }

  return out;
}

export async function decryptChunk(
  header: PnofHeader,
  key: Uint8Array,
  index: number,
  sealed: Uint8Array,
  open: ChunkOpener,
): Promise<Uint8Array> {
  const range = chunkRange(header, index);

  if (sealed.length !== range.length) {
    throw new PnofError('size', `chunk ${index}`);
  }

  const aad = buildAad(header.raw, index, index === header.chunkCount - 1);

  let plain: Uint8Array;

  try {
    plain = await open(key, buildNonce(header.noncePrefix, index), aad, sealed);
  } catch {
    throw new PnofError('tamper', `chunk ${index}`);
  }

  if (plain.length !== range.plainLength) {
    throw new PnofError('tamper', `chunk ${index} length`);
  }

  return plain;
}

export type DecryptSource = {
  /** Reads exactly `length` bytes at `start` of the package (fewer only at the end of the file, which is an error). */
  read(start: number, length: number): Promise<Uint8Array>;
  size: number;
};

export type DecryptSink = { write(bytes: Uint8Array): Promise<void> | void };

export type DecryptOptions = {
  /** Chunks read and opened per batch (bounds memory: batch * chunk_size). */
  batchChunks?: number;
  onProgress?: (doneBytes: number, totalBytes: number) => void;
  isCancelled?: () => boolean;
};

/**
 * Decrypts a whole package into `sink` in order, verifying every tag. Throws PnofError('tamper'|'size') on any
 * corruption, truncation, extension or reordering; the caller must discard the output then.
 */
export async function decryptPackage(
  header: PnofHeader,
  key: Uint8Array,
  source: DecryptSource,
  sink: DecryptSink,
  open: ChunkOpener,
  options: DecryptOptions = {},
): Promise<void> {
  if (source.size !== header.packageSize) {
    throw new PnofError('size', 'package length');
  }

  const batch = Math.max(1, options.batchChunks ?? 16);
  let done = 0;

  for (let first = 0; first < header.chunkCount; first += batch) {
    if (options.isCancelled?.()) {
      throw new PnofError('cancelled');
    }

    const last = Math.min(header.chunkCount, first + batch) - 1;
    const start = chunkRange(header, first).start;
    const end = chunkRange(header, last);
    const block = await source.read(start, end.start + end.length - start);

    if (block.length !== end.start + end.length - start) {
      throw new PnofError('size', 'short read');
    }

    for (let index = first; index <= last; index += 1) {
      const range = chunkRange(header, index);
      const plain = await decryptChunk(
        header,
        key,
        index,
        block.subarray(range.start - start, range.start - start + range.length),
        open,
      );

      await sink.write(plain);
      done += plain.length;
    }

    options.onProgress?.(done, header.plaintextSize);
  }

  if (done !== header.plaintextSize) {
    throw new PnofError('size', 'plaintext length');
  }
}
