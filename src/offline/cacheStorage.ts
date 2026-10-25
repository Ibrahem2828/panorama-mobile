/**
 * Thin key-value adapter under the response cache. The default adapter is AsyncStorage (already a dependency); it is loaded
 * lazily so modules that import the API client in tests or in non-native contexts never need the native module, and it
 * can be swapped with {@link setCacheStorageAdapter}. If AsyncStorage cannot be loaded the cache falls back to memory, so
 * the app still works (it just does not survive a restart).
 */
export type CacheStorageAdapter = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
  getAllKeys: () => Promise<readonly string[]>;
  multiRemove: (keys: readonly string[]) => Promise<void>;
};

function createMemoryAdapter(): CacheStorageAdapter {
  const data = new Map<string, string>();

  return {
    getItem: async (key) => data.get(key) ?? null,
    setItem: async (key, value) => {
      data.set(key, value);
    },
    removeItem: async (key) => {
      data.delete(key);
    },
    getAllKeys: async () => Array.from(data.keys()),
    multiRemove: async (keys) => {
      keys.forEach((key) => data.delete(key));
    },
  };
}

let adapter: CacheStorageAdapter | null = null;

function loadDefaultAdapter(): CacheStorageAdapter {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const module = require('@react-native-async-storage/async-storage') as {
      default?: CacheStorageAdapter;
    } & CacheStorageAdapter;
    const storage = module.default ?? module;

    if (storage && typeof storage.getItem === 'function') {
      return {
        getItem: (key) => storage.getItem(key),
        setItem: (key, value) => storage.setItem(key, value),
        removeItem: (key) => storage.removeItem(key),
        getAllKeys: async () => storage.getAllKeys(),
        multiRemove: (keys) => storage.multiRemove(keys),
      };
    }
  } catch {
    // Fall through to the in-memory adapter.
  }

  return createMemoryAdapter();
}

export function getCacheStorage(): CacheStorageAdapter {
  adapter ??= loadDefaultAdapter();

  return adapter;
}

export function setCacheStorageAdapter(next: CacheStorageAdapter | null): void {
  adapter = next;
}

export function createInMemoryCacheStorage(): CacheStorageAdapter {
  return createMemoryAdapter();
}
