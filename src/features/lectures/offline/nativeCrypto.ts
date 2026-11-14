import {
  AESEncryptionKey,
  AESSealedData,
  aesDecryptAsync,
  CryptoDigestAlgorithm,
  digest,
} from 'expo-crypto';

import type { ChunkOpener } from './pnof';

/** Native AES-256-GCM (expo-crypto) for PNOF chunks: tag verified against the AAD, a failure throws. */
const keys = new Map<string, Promise<AESEncryptionKey>>();

function importKey(raw: Uint8Array): Promise<AESEncryptionKey> {
  const id = Array.from(raw.subarray(0, 12)).join(',');
  const cached = keys.get(id);

  if (cached) {
    return cached;
  }

  if (keys.size > 4) {
    keys.clear();
  }

  const created = AESEncryptionKey.import(raw);

  keys.set(id, created);

  return created;
}

/** Forgets imported keys (call when a viewer closes, on logout and after a purge). */
export function forgetImportedKeys(): void {
  keys.clear();
}

export const nativeChunkOpener: ChunkOpener = async (key, nonce, aad, ciphertextWithTag) => {
  const combined = new Uint8Array(nonce.length + ciphertextWithTag.length);

  combined.set(nonce, 0);
  combined.set(ciphertextWithTag, nonce.length);

  return aesDecryptAsync(AESSealedData.fromCombined(combined), await importKey(key), {
    additionalData: aad,
    output: 'bytes',
  });
};

export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const hash = new Uint8Array(await digest(CryptoDigestAlgorithm.SHA256, bytes as Uint8Array<ArrayBuffer>));

  return Array.from(hash, (byte) => byte.toString(16).padStart(2, '0')).join('');
}
