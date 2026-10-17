import { ApiClientError, authService, containsArabic, normalizeApiError } from '../../../api';
import type {
  AuthTokens as ApiAuthTokens,
  CurrentUser,
  LoginResponse,
  RefreshTokenResponse,
} from '../../../api';
import { useLocaleStore } from '../../../i18n';
import type { AuthSession, AuthTokens, AuthUser, LoginCredentials } from '../types';
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
  const user = await authService.getCurrentUser(accessToken);

  return normalizeUser(user);
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
    throw new Error(getAuthErrorMessage(error, 'login'));
  }
}

export type BootstrapSessionResult = {
  session: AuthSession | null;
  sessionExpired: boolean;
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
    if (!isUnauthorizedError(error)) {
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
    if (!isDefinitiveRefreshRejection(error)) {
      // Transient failure while refreshing: keep the tokens so the next launch can retry.
      throw new Error(getAuthErrorMessage(error, 'session'));
    }

    await clearAuthTokens();
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
