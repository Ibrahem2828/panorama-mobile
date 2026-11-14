import { Platform } from 'react-native';

import type { HttpHeaders } from './http';
import { generateIdempotencyKey } from './idempotency';

/**
 * Account device binding (students). The backend pins a student account to ONE phone: the app creates a random UUID
 * once, keeps it in secure storage and sends it on every request as `X-Panorama-Device-Id`. It is separate from the
 * installation id and never a hardware fingerprint. Enforcement is switched on server-side; the headers are harmless
 * (and recorded) while it is off, so the app always sends them.
 */
export const DEVICE_ID_STORAGE_KEY = 'panorama.device.id';

export const DEVICE_ID_HEADER = 'X-Panorama-Device-Id';
export const DEVICE_NAME_HEADER = 'X-Panorama-Device-Name';
export const DEVICE_PLATFORM_HEADER = 'X-Panorama-Platform';

const DEVICE_NAME_MAX_LENGTH = 80;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;

type PlatformName = 'android' | 'ios';

type SecureStoreModule = {
  getItemAsync: (key: string) => Promise<string | null>;
  setItemAsync: (key: string, value: string) => Promise<void>;
};

type DeviceModule = { brand?: string | null; modelName?: string | null };

// Native modules are loaded lazily so a missing one (unit tests, web) can never break the request layer.
function loadSecureStore(): SecureStoreModule | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-secure-store') as SecureStoreModule;
  } catch {
    return null;
  }
}

function loadDevice(): DeviceModule | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-device') as DeviceModule;
  } catch {
    return null;
  }
}

let cachedDeviceId: string | null = null;
let pendingDeviceId: Promise<string> | null = null;

export function isValidDeviceId(value: unknown): value is string {
  return typeof value === 'string' && UUID_PATTERN.test(value);
}

/**
 * Header values travel through the OS HTTP stack: keep printable ASCII only (a model name with a stray control or
 * non-Latin character must never make a request fail) and respect the server's 80 character limit.
 */
export function sanitizeDeviceName(raw: string | null | undefined): string {
  return String(raw ?? '')
    .replace(/[^\x20-\x7e]/gu, ' ')
    .replace(/\s+/gu, ' ')
    .trim()
    .slice(0, DEVICE_NAME_MAX_LENGTH)
    .trim();
}

export function buildDeviceName(
  device: { brand?: string | null; modelName?: string | null } | null | undefined,
): string {
  const brand = sanitizeDeviceName(device?.brand);
  const model = sanitizeDeviceName(device?.modelName);

  if (!model) {
    return brand;
  }

  // "Pixel 8" reads better with its maker ("Google Pixel 8") unless the model already names it.
  return brand && !model.toLowerCase().startsWith(brand.toLowerCase())
    ? sanitizeDeviceName(`${brand} ${model}`)
    : model;
}

function currentDeviceName(): string {
  try {
    return buildDeviceName(loadDevice());
  } catch {
    return '';
  }
}

function currentPlatform(): PlatformName | null {
  return Platform.OS === 'android' || Platform.OS === 'ios' ? Platform.OS : null;
}

async function loadOrCreateDeviceId(): Promise<string> {
  const store = loadSecureStore();

  try {
    const stored = store ? await store.getItemAsync(DEVICE_ID_STORAGE_KEY) : null;

    if (isValidDeviceId(stored)) {
      return stored.toLowerCase();
    }
  } catch {
    // Unreadable store: fall through and mint an id for this run.
  }

  const created = generateIdempotencyKey().toLowerCase();

  try {
    await store?.setItemAsync(DEVICE_ID_STORAGE_KEY, created);
  } catch {
    // Not persisted: the id still binds this run, and the next launch registers a new one.
  }

  return created;
}

/** Resolves once per process; every later call is a cached read. Must finish before the first request is built. */
export function ensureDeviceId(): Promise<string> {
  if (cachedDeviceId) {
    return Promise.resolve(cachedDeviceId);
  }

  if (!pendingDeviceId) {
    pendingDeviceId = loadOrCreateDeviceId().then((id) => {
      cachedDeviceId = id;
      return id;
    });
  }

  return pendingDeviceId;
}

export function getCachedDeviceId(): string | null {
  return cachedDeviceId;
}

/** The three headers, or none until the id is known (a request is never built before `ensureDeviceId` resolved). */
export function getDeviceHeaders(): HttpHeaders {
  if (!cachedDeviceId) {
    return {};
  }

  const headers: HttpHeaders = { [DEVICE_ID_HEADER]: cachedDeviceId };
  const name = currentDeviceName();
  const platform = currentPlatform();

  if (name) {
    headers[DEVICE_NAME_HEADER] = name;
  }

  if (platform) {
    headers[DEVICE_PLATFORM_HEADER] = platform;
  }

  return headers;
}

/** Test hook: forget the cached id so the next request reads storage again. */
export function resetDeviceIdentityForTests(): void {
  cachedDeviceId = null;
  pendingDeviceId = null;
}
