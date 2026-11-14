import { normalizeApiError } from './errors';

/** Backend codes of the account device binding (students). */
export const DEVICE_ERROR = {
  mismatch: 'DEVICE_MISMATCH',
  idRequired: 'DEVICE_ID_REQUIRED',
  switchTokenInvalid: 'DEVICE_SWITCH_TOKEN_INVALID',
  switchLimitReached: 'DEVICE_SWITCH_LIMIT_REACHED',
  /** Staff reset the account's device binding: the session ended, sign in again. */
  revokedByAdmin: 'SESSION_REVOKED_BY_ADMIN',
} as const;

export type BoundDevice = {
  name: string;
  platform: string;
  lastSeenAt: string | null;
};

/** What the login refusal `409 DEVICE_MISMATCH` tells the app about the phone that owns the account. */
export type DeviceMismatchInfo = {
  boundDevice: BoundDevice;
  canSwitch: boolean;
  switchesRemaining: number;
  /** Absent when the refusal came from refresh or a plain request: only a password login mints one. */
  switchToken: string | null;
  switchTokenExpiresInSeconds: number | null;
};

export function deviceErrorCode(error: unknown): string | undefined {
  return normalizeApiError(error).errorCode;
}

/** 409 on login, 409 or 401 on refresh and on authenticated requests: this phone is not the account's phone. */
export function isDeviceMismatchError(error: unknown): boolean {
  return deviceErrorCode(error) === DEVICE_ERROR.mismatch;
}

export type SessionEndReason = 'device_replaced' | 'revoked_by_admin';

/** Why the server ended this session, when it says so (another phone took the account, or staff reset it). */
export function sessionEndReason(error: unknown): SessionEndReason | null {
  const code = deviceErrorCode(error);

  if (code === DEVICE_ERROR.mismatch) return 'device_replaced';
  if (code === DEVICE_ERROR.revokedByAdmin) return 'revoked_by_admin';

  return null;
}

export function isSessionReplacedError(error: unknown): boolean {
  return sessionEndReason(error) !== null;
}

export function isDeviceSwitchLimitError(error: unknown): boolean {
  return deviceErrorCode(error) === DEVICE_ERROR.switchLimitReached;
}

export function isDeviceSwitchTokenInvalidError(error: unknown): boolean {
  return deviceErrorCode(error) === DEVICE_ERROR.switchTokenInvalid;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function text(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

export function parseDeviceMismatchDetails(
  details: Record<string, unknown> | undefined | null,
): DeviceMismatchInfo {
  const bound = asRecord(details?.bound_device);
  const token = details?.device_switch_token;
  const remaining = Number(details?.switches_remaining);
  const expires = Number(details?.device_switch_token_expires_in);

  return {
    boundDevice: {
      name: text(bound?.name).trim(),
      platform: text(bound?.platform).trim().toLowerCase(),
      lastSeenAt: text(bound?.last_seen_at) || null,
    },
    switchesRemaining: Number.isFinite(remaining) ? Math.max(0, remaining) : 0,
    canSwitch: details?.can_switch === true && typeof token === 'string' && token.length > 0,
    switchToken: typeof token === 'string' && token.length > 0 ? token : null,
    switchTokenExpiresInSeconds: Number.isFinite(expires) && expires > 0 ? expires : null,
  };
}

/** The structured mismatch, or null when the error is something else. */
export function parseDeviceMismatch(error: unknown): DeviceMismatchInfo | null {
  const normalized = normalizeApiError(error);

  return normalized.errorCode === DEVICE_ERROR.mismatch
    ? parseDeviceMismatchDetails(normalized.details)
    : null;
}
