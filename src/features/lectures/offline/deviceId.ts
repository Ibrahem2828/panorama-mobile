import { generateIdempotencyKey } from '../../../api';

/**
 * Offline licenses are bound to (account, device). The server hashes `X-Panorama-Device-Id` and expects it to be sent
 * consistently. This is the same secure-store key and header that the account device-binding feature (mobile PR #39,
 * `src/api/deviceIdentity.ts`) uses, so once #39 lands both read ONE id and licenses keep working; until then this tiny
 * helper mints the id the first time. It is read lazily, so tests and web builds never touch native code.
 */
export const DEVICE_ID_STORAGE_KEY = 'panorama.device.id';
export const DEVICE_ID_HEADER = 'X-Panorama-Device-Id';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;

type SecureStoreLike = {
  getItemAsync: (key: string) => Promise<string | null>;
  setItemAsync: (key: string, value: string) => Promise<void>;
};

let cached: string | null = null;
let pending: Promise<string> | null = null;

function loadSecureStore(): SecureStoreLike | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-secure-store') as SecureStoreLike;
  } catch {
    return null;
  }
}

async function loadOrCreate(): Promise<string> {
  const store = loadSecureStore();

  try {
    const stored = store ? await store.getItemAsync(DEVICE_ID_STORAGE_KEY) : null;

    if (stored && UUID.test(stored)) {
      return stored.toLowerCase();
    }
  } catch {
    // Unreadable: mint one for this run.
  }

  const created = generateIdempotencyKey().toLowerCase();

  try {
    await store?.setItemAsync(DEVICE_ID_STORAGE_KEY, created);
  } catch {
    // Not persisted; the next launch will mint another one and the server will treat it as a new device.
  }

  return created;
}

export function ensureOfflineDeviceId(): Promise<string> {
  if (cached) {
    return Promise.resolve(cached);
  }

  if (!pending) {
    pending = loadOrCreate().then((id) => {
      cached = id;

      return id;
    });
  }

  return pending;
}

export async function offlineDeviceHeaders(): Promise<Record<string, string>> {
  return { [DEVICE_ID_HEADER]: await ensureOfflineDeviceId() };
}
