import {
  AESEncryptionKey,
  AESSealedData,
  aesDecryptAsync,
  aesEncryptAsync,
  getRandomBytes,
} from 'expo-crypto';
import { Directory, File, FileMode, Paths } from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';

import {
  createEncryptedStoreCore,
  type EncryptedStore,
  type StoreDeps,
  type StoreOptions,
} from './encryptedStoreCore';

export type { EncryptedStore, OpenedFile, StoreMeta } from './encryptedStoreCore';

const MASTER_KEY_PREFIX = 'pano.secure-store.master.';

/** Imported AES keys are reused across the chunks of one file (importing is a native call). */
const keyCache = new Map<string, Promise<AESEncryptionKey>>();

function importKey(raw: Uint8Array): Promise<AESEncryptionKey> {
  const id =
    Array.from(raw.subarray(0, 8)).join(',') + ':' + raw.length + ':' + raw[raw.length - 1];
  const cached = keyCache.get(id);

  if (cached) {
    return cached;
  }

  if (keyCache.size > 8) {
    keyCache.clear();
  }

  const created = AESEncryptionKey.import(raw);

  keyCache.set(id, created);

  return created;
}

async function seal(key: Uint8Array, plain: Uint8Array, aad: Uint8Array): Promise<Uint8Array> {
  const sealed = await aesEncryptAsync(plain, await importKey(key), {
    nonce: { length: 12 },
    additionalData: aad,
  });

  return sealed.combined();
}

async function open(key: Uint8Array, sealed: Uint8Array, aad: Uint8Array): Promise<Uint8Array> {
  return aesDecryptAsync(AESSealedData.fromCombined(sealed), await importKey(key), {
    additionalData: aad,
    output: 'bytes',
  });
}

function fileOf(path: string): File {
  return new File(path);
}

function nativeDeps(keyName: string): StoreDeps {
  return {
    random: (length) => getRandomBytes(length),
    seal,
    open,
    keyStore: {
      get: () => SecureStore.getItemAsync(keyName),
      set: (value) => SecureStore.setItemAsync(keyName, value),
      remove: () => SecureStore.deleteItemAsync(keyName),
    },
    fs: {
      async ensureDir(dir) {
        new Directory(dir).create({ intermediates: true, idempotent: true });
      },
      async readFile(path) {
        return fileOf(path).bytes();
      },
      async writeFile(path, bytes) {
        const file = fileOf(path);

        if (!file.exists) {
          file.create({ intermediates: true });
        }

        file.write(bytes);
      },
      async openWriter(path) {
        const file = fileOf(path);

        file.create({ intermediates: true, overwrite: true });

        const handle = file.open(FileMode.WriteOnly);

        return {
          async write(bytes) {
            handle.writeBytes(bytes);
          },
          async close() {
            handle.close();
          },
        };
      },
      async openReader(path) {
        const handle = fileOf(path).open(FileMode.ReadOnly);

        return {
          size: handle.size ?? 0,
          async read(length) {
            return handle.readBytes(length);
          },
          async close() {
            handle.close();
          },
        };
      },
      async exists(path) {
        return fileOf(path).exists;
      },
      async remove(path) {
        const file = fileOf(path);

        if (file.exists) {
          file.delete();
        }
      },
      async removeDir(dir) {
        const directory = new Directory(dir);

        if (directory.exists) {
          directory.delete();
        }
      },
      async list(dir) {
        const directory = new Directory(dir);

        return directory.exists ? directory.list().map((entry) => entry.name) : [];
      },
    },
    now: () => Date.now(),
  };
}

/**
 * Creates an encrypted private store named `name`. Each store has its own master key, its own folder under the app's
 * private document directory (never external storage) and its own temp folder under the private cache directory.
 * The chat media cache is one instance; a future "downloaded lectures" feature creates another with a larger `maxBytes`.
 */
export function createEncryptedStore(
  name: string,
  limits: Pick<StoreOptions, 'maxBytes' | 'maxEntryBytes' | 'maxAgeMs'>,
): EncryptedStore {
  return createEncryptedStoreCore(nativeDeps(`${MASTER_KEY_PREFIX}${name}`), {
    dir: new Directory(Paths.document, 'pano-secure', name).uri.replace(/\/+$/u, ''),
    tempDir: new Directory(Paths.cache, 'pano-open', name).uri.replace(/\/+$/u, ''),
    ...limits,
  });
}
