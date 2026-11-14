import {
  ApiClientError,
  authService,
  containsArabic,
  isSessionReplacedError,
  sessionEndReason,
  type SessionEndReason,
  normalizeApiError,
  parseDeviceMismatch,
} from '../../../api';
import type {
  AuthTokens as ApiAuthTokens,
  CurrentUser,
  LoginResponse,
  RefreshTokenResponse,
} from '../../../api';
import { useLocaleStore } from '../../../i18n';
import {
  clearSessionSnapshot,
  loadSessionSnapshot,
  saveSessionSnapshot,
} from '../../../offline/sessionSnapshot';
import type { AuthSession, AuthTokens, AuthUser, LoginCredentials } from '../types';
import {
  DeviceMismatchLoginError,
  DeviceSwitchError,
  classifyDeviceSwitchError,
} from './deviceLock';
import { clearAuthTokens, getStoredAuthTokens, saveAuthTokens } from './authTokenStorage';

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function normalizeTokens(tokens: ApiAuthTokens): AuthTokens {
  if (!isNonEmptyString(tokens.access) || !isNonEmptyString(tokens.refresh)) {
    throw new Error('Invalid auth token response');
  }

  return {
    accessToken: tokens.access,
    refreshToken: tokens.refresh,
  };
}

function normalizeRefreshResponse(
  response: RefreshTokenResponse,
  currentRefreshToken: string,
): AuthTokens {
  if (!isNonEmptyString(response.access)) {
    throw new Error('Invalid refresh token response');
  }

  return {
    accessToken: response.access,
    refreshToken: isNonEmptyString(response.refresh) ? response.refresh : currentRefreshToken,
  };
}

function normalizeUser(user: CurrentUser): AuthUser {
  return {
    id: user.id,
    email: user.email,
    phone_number: user.phone_number ?? user.phone,
    full_name: user.full_name ?? user.name,
    username: user.username,
    role: user.role,
    is_phone_verified: user.is_phone_verified,
    is_email_verified: user.is_email_verified,
    requires_phone_verification:
      ((user as Record<string, unknown>).requires_phone_verification as boolean | undefined) ??
      undefined,
  };
}

// These run inside async service calls rather than render, so the catalog is read when
// the error occurs instead of being captured at module load.
function getAuthErrorMessage(error: unknown, context: 'login' | 'session' | 'generic'): string {
  const messages = useLocaleStore.getState().t.auth.errors;
  const normalizedError = normalizeApiError(error);

  if (normalizedError.code === 'NETWORK_ERROR' || normalizedError.code === 'TIMEOUT') {
    return messages.network;
  }

  if (normalizedError.code === 'UNAUTHORIZED') {
    return context === 'login' ? messages.invalidCredentials : messages.sessionExpired;
  }

  if (normalizedError.code === 'VALIDATION_ERROR') {
    // The API answers a wrong password with 400 + field errors; a bare 400 from a proxy or
    // misconfigured host carries none and must not be shown as "wrong password".
    const fromApi = Boolean(
      normalizedError.fieldErrors && Object.keys(normalizedError.fieldErrors).length > 0,
    );
    return context === 'login' && fromApi ? messages.invalidCredentials : messages.generic;
  }

  if (normalizedError.code === 'FORBIDDEN') {
    return messages.forbidden;
  }

  return messages.generic;
}

function isUnauthorizedError(error: unknown): boolean {
  return normalizeApiError(error).code === 'UNAUTHORIZED';
}

async function loadCurrentUser(accessToken: string): Promise<AuthUser> {
  const user = normalizeUser(await authService.getCurrentUser(accessToken));

  // Kept so a later cold start without a connection can still open the app (see offlineSession).
  void saveSessionSnapshot(user);

  return user;
}

/** The device cannot reach the server (no network, timeout, 5xx): that says nothing about whether the session is valid. */
export function isUnreachableError(error: unknown): boolean {
  const { code, status } = normalizeApiError(error);

  return code === 'NETWORK_ERROR' || code === 'TIMEOUT' || (status !== undefined && status >= 500);
}

/**
 * Opens the session from the saved profile when the server cannot be reached. The stored tokens are kept untouched: the
 * first request that needs a fresh token refreshes it as soon as the connection is back, and until then the app shows its
 * saved data. Returns null when nothing was saved (a first launch, or after sign-out).
 */
async function offlineSession(
  error: unknown,
  tokens: AuthTokens,
): Promise<BootstrapSessionResult | null> {
  if (!isUnreachableError(error)) {
    return null;
  }

  const snapshot = await loadSessionSnapshot<AuthUser>();

  return snapshot
    ? { session: { user: snapshot.user, tokens }, sessionExpired: false, offline: true }
    : null;
}

async function refreshStoredAccessToken(tokens: AuthTokens): Promise<AuthTokens> {
  const response = await authService.refreshToken(tokens.refreshToken);
  const refreshedTokens = normalizeRefreshResponse(response, tokens.refreshToken);

  await saveAuthTokens(refreshedTokens);

  return refreshedTokens;
}

export async function loginWithCredentials(credentials: LoginCredentials): Promise<AuthSession> {
  try {
    const loginResponse: LoginResponse = await authService.login(credentials);
    const tokens = normalizeTokens(loginResponse);

    await saveAuthTokens(tokens);

    try {
      const user = await loadCurrentUser(tokens.accessToken);

      return {
        user,
        tokens,
      };
    } catch (error) {
      await clearAuthTokens();
      throw error;
    }
  } catch (error) {
    // Right password, but the account belongs to another phone: the caller shows the device screen.
    const mismatch = parseDeviceMismatch(error);

    if (mismatch) {
      throw new DeviceMismatchLoginError(mismatch);
    }

    throw new Error(getAuthErrorMessage(error, 'login'));
  }
}

/**
 * Takes the account over on this phone with the single-use token of a refused login. Returns the signed-in session;
 * a failure raises `DeviceSwitchError` so the screen can tell an expired link from a used-up allowance.
 */
export async function switchDeviceSession(switchToken: string): Promise<AuthSession> {
  let tokens: AuthTokens;

  try {
    tokens = normalizeTokens(await authService.switchDevice(switchToken));
  } catch (error) {
    throw new DeviceSwitchError(classifyDeviceSwitchError(error));
  }

  await saveAuthTokens(tokens);

  try {
    return { user: await loadCurrentUser(tokens.accessToken), tokens };
  } catch (error) {
    await clearAuthTokens();
    throw new DeviceSwitchError(classifyDeviceSwitchError(error));
  }
}

/** Another phone replaced this one: forget the session (the tokens belong to a binding that no longer exists). */
export async function endSessionReplacedByAnotherDevice(): Promise<void> {
  await clearAuthTokens();
  await clearSessionSnapshot();
}

export type BootstrapSessionResult = {
  session: AuthSession | null;
  sessionExpired: boolean;
  /** True when the session was opened from the saved profile because the server was unreachable. */
  offline?: boolean;
  /** Set when the server ended the session on purpose: another phone took the account, or staff reset it. */
  endReason?: SessionEndReason;
};

export async function bootstrapSession(): Promise<BootstrapSessionResult> {
  const storedTokens = await getStoredAuthTokens();

  if (!storedTokens) {
    return {
      session: null,
      sessionExpired: false,
    };
  }

  try {
    const user = await loadCurrentUser(storedTokens.accessToken);

    return {
      session: {
        user,
        tokens: storedTokens,
      },
      sessionExpired: false,
    };
  } catch (error) {
    if (isSessionReplacedError(error)) {
      await endSessionReplacedByAnotherDevice();
      return {
        session: null,
        sessionExpired: false,
        endReason: sessionEndReason(error) ?? undefined,
      };
    }

    if (!isUnauthorizedError(error)) {
      const offline = await offlineSession(error, storedTokens);

      if (offline) {
        return offline;
      }

      throw new Error(getAuthErrorMessage(error, 'session'));
    }
  }

  try {
    const refreshedTokens = await refreshStoredAccessToken(storedTokens);
    const user = await loadCurrentUser(refreshedTokens.accessToken);

    return {
      session: {
        user,
        tokens: refreshedTokens,
      },
      sessionExpired: false,
    };
  } catch (error) {
    if (isSessionReplacedError(error)) {
      await endSessionReplacedByAnotherDevice();
      return {
        session: null,
        sessionExpired: false,
        endReason: sessionEndReason(error) ?? undefined,
      };
    }

    if (!isDefinitiveRefreshRejection(error)) {
      // Transient failure while refreshing: keep the tokens so the next launch can retry, and open from the saved profile.
      const offline = await offlineSession(error, storedTokens);

      if (offline) {
        return offline;
      }

      throw new Error(getAuthErrorMessage(error, 'session'));
    }

    await clearAuthTokens();
    await clearSessionSnapshot();
    return {
      session: null,
      sessionExpired: true,
    };
  }
}

/**
 * Only a definitive answer from the refresh endpoint (400/401: the refresh token is
 * invalid, expired or revoked) means the session is over. Network errors, timeouts, 5xx,
 * 429 and malformed responses say nothing about the token and must not sign the user out.
 */
export function isDefinitiveRefreshRejection(error: unknown): boolean {
  const { status } = normalizeApiError(error);

  return status === 400 || status === 401;
}

/**
 * Resolves with new tokens, or `null` when the session is definitively over (nothing
 * stored, or the server rejected the refresh token). Rejects with the original API error
 * on a transient failure; the stored tokens are kept so a later attempt can succeed.
 */
export async function refreshAccessToken(): Promise<AuthTokens | null> {
  const storedTokens = await getStoredAuthTokens();

  if (!storedTokens) {
    return null;
  }

  try {
    return await refreshStoredAccessToken(storedTokens);
  } catch (error) {
    if (isSessionReplacedError(error)) {
      // Rethrown so the store can tell "replaced by another phone" from "session expired".
      await endSessionReplacedByAnotherDevice();
      throw error;
    }

    if (isDefinitiveRefreshRejection(error)) {
      await clearAuthTokens();
      return null;
    }

    throw error;
  }
}

export async function logoutSession(currentTokens?: Partial<AuthTokens>): Promise<void> {
  const storedTokens = await getStoredAuthTokens();
  const accessToken = currentTokens?.accessToken ?? storedTokens?.accessToken ?? null;
  const refreshToken = currentTokens?.refreshToken ?? storedTokens?.refreshToken ?? null;

  try {
    if (refreshToken) {
      await authService.logout(refreshToken, accessToken);
    }
  } catch {
    // Local session cleanup must still complete if backend logout is unavailable.
  } finally {
    await clearAuthTokens();
    await clearSessionSnapshot();
  }
}

export function toSafeAuthErrorMessage(error: unknown): string {
  // ApiClientError is an Error whose message may be server text: localize it by code.
  // Errors created locally by this service already carry a localized (Arabic) message.
  if (
    !(error instanceof ApiClientError) &&
    error instanceof Error &&
    containsArabic(error.message)
  ) {
    return error.message;
  }
  return getAuthErrorMessage(error, 'generic');
}
