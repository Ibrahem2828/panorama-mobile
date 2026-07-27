import { authService, normalizeApiError } from '../../../api';
import type {
  AuthTokens as ApiAuthTokens,
  CurrentUser,
  LoginResponse,
  RefreshTokenResponse,
} from '../../../api';
import type { AuthSession, AuthTokens, AuthUser, LoginCredentials } from '../types';
import { clearAuthTokens, getStoredAuthTokens, saveAuthTokens } from './authTokenStorage';

const INVALID_CREDENTIALS_MESSAGE = 'بيانات الدخول غير صحيحة.';
const NETWORK_ERROR_MESSAGE = 'تعذر الاتصال بالخادم. تحقق من اتصال الإنترنت.';
const SESSION_EXPIRED_MESSAGE = 'انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى.';
const GENERIC_AUTH_ERROR_MESSAGE = 'تعذر تنفيذ العملية. حاول مرة أخرى.';

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

function getAuthErrorMessage(error: unknown, context: 'login' | 'session' | 'generic'): string {
  const normalizedError = normalizeApiError(error);

  if (normalizedError.code === 'NETWORK_ERROR' || normalizedError.code === 'TIMEOUT') {
    return NETWORK_ERROR_MESSAGE;
  }

  if (normalizedError.code === 'UNAUTHORIZED') {
    return context === 'login' ? INVALID_CREDENTIALS_MESSAGE : SESSION_EXPIRED_MESSAGE;
  }

  if (normalizedError.code === 'VALIDATION_ERROR') {
    return context === 'login' ? INVALID_CREDENTIALS_MESSAGE : GENERIC_AUTH_ERROR_MESSAGE;
  }

  if (normalizedError.code === 'FORBIDDEN') {
    return 'لا تملك صلاحية تنفيذ هذا الإجراء.';
  }

  return GENERIC_AUTH_ERROR_MESSAGE;
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
  } catch {
    await clearAuthTokens();
    return {
      session: null,
      sessionExpired: true,
    };
  }
}

export async function refreshAccessToken(): Promise<AuthTokens | null> {
  const storedTokens = await getStoredAuthTokens();

  if (!storedTokens) {
    return null;
  }

  try {
    return await refreshStoredAccessToken(storedTokens);
  } catch (error) {
    await clearAuthTokens();
    throw new Error(getAuthErrorMessage(error, 'session'));
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
  return error instanceof Error && error.message
    ? error.message
    : getAuthErrorMessage(error, 'generic');
}
