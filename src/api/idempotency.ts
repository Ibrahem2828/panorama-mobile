import { ApiClientError, createApiError, normalizeApiError } from './errors';
import { useLocaleStore } from '../i18n';

/** How long to wait before re-sending a request the server still reports as in progress. */
export const IDEMPOTENCY_IN_PROGRESS_DELAYS_MS: readonly number[] = [1000, 2000, 3000];

function randomHex(length: number): string {
  let out = '';

  for (let index = 0; index < length; index += 1) {
    out += Math.floor(Math.random() * 16).toString(16);
  }

  return out;
}

/**
 * RFC 4122 v4 UUID. Prefers the platform CSPRNG when the JS engine exposes one and falls
 * back to Math.random, which is acceptable here: the key only has to be unique per user
 * action, it is not a secret.
 */
export function generateIdempotencyKey(): string {
  const cryptoApi = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;

  if (cryptoApi && typeof cryptoApi.randomUUID === 'function') {
    return cryptoApi.randomUUID();
  }

  const variant = ['8', '9', 'a', 'b'][Math.floor(Math.random() * 4)];

  return `${randomHex(8)}-${randomHex(4)}-4${randomHex(3)}-${variant}${randomHex(3)}-${randomHex(12)}`;
}

type PendingAction = {
  key: string;
  fingerprint: string;
};

const pendingActions = new Map<string, PendingAction>();

function fingerprintOf(payload: unknown): string {
  try {
    return JSON.stringify(payload) ?? '';
  } catch {
    return String(payload);
  }
}

/** Test hook and sign-out hygiene: forget every in-flight action key. */
export function resetIdempotencyKeys(): void {
  pendingActions.clear();
}

/**
 * Returns the key for a user action, creating it on first use. As long as the same action
 * (same `scope`, same payload) is retried before it succeeds, the same key comes back, so
 * the server can de-duplicate. Editing the payload starts a new action with a new key.
 */
export function acquireIdempotencyKey(scope: string, payload: unknown): string {
  const fingerprint = fingerprintOf(payload);
  const existing = pendingActions.get(scope);

  if (existing && existing.fingerprint === fingerprint) {
    return existing.key;
  }

  const created = { key: generateIdempotencyKey(), fingerprint };
  pendingActions.set(scope, created);

  return created.key;
}

export function releaseIdempotencyKey(scope: string): void {
  pendingActions.delete(scope);
}

function isDefinitiveRejection(error: unknown): boolean {
  const { status, code } = normalizeApiError(error);

  if (code === 'IDEMPOTENCY_IN_PROGRESS' || code === 'RATE_LIMITED') {
    return false;
  }

  // A 4xx means the server answered and (for idempotent endpoints) may cache that answer
  // under the key, so the retry must be a fresh action. Network errors, timeouts and 5xx
  // keep the key: the first attempt may still have succeeded.
  return typeof status === 'number' && status >= 400 && status < 500;
}

/**
 * Runs one user action with a stable Idempotency-Key.
 *
 * - success: the key is released
 * - network/timeout/5xx/429: the key is kept so the user's retry re-uses it
 * - definitive 4xx: the key is released so a corrected retry is a new action
 * - IDEMPOTENCY_KEY_REUSED: a new key is minted and a friendly error is raised
 */
export async function runIdempotentAction<T>(
  scope: string,
  payload: unknown,
  action: (idempotencyKey: string) => Promise<T>,
): Promise<T> {
  const key = acquireIdempotencyKey(scope, payload);

  try {
    const result = await action(key);
    releaseIdempotencyKey(scope);

    return result;
  } catch (error) {
    const normalized = normalizeApiError(error);

    if (normalized.code === 'IDEMPOTENCY_KEY_REUSED') {
      releaseIdempotencyKey(scope);
      throw createApiError({
        code: 'IDEMPOTENCY_KEY_REUSED',
        status: normalized.status,
        message: useLocaleStore.getState().t.apiErrors.idempotencyKeyReused,
        requestId: normalized.requestId,
        errorCode: normalized.errorCode,
        raw: normalized.raw,
      });
    }

    if (isDefinitiveRejection(error)) {
      releaseIdempotencyKey(scope);
    }

    throw error instanceof ApiClientError ? error : new ApiClientError(normalized);
  }
}
