import { endpoints } from './endpoints';

export type ApiAuthBridge = {
  getAccessToken: () => string | null;
  refreshAccessToken: () => Promise<string | null>;
  onSessionExpired: () => void | Promise<void>;
};

const AUTH_EXEMPT_PATHS = new Set<string>([
  endpoints.health,
  endpoints.auth.login,
  endpoints.auth.registerStudent,
  endpoints.auth.registerNormal,
  endpoints.auth.refresh,
  endpoints.auth.logout,
  endpoints.auth.sendOtp,
  endpoints.auth.verifyOtp,
  endpoints.auth.requestPasswordReset,
  endpoints.auth.confirmPasswordReset,
]);

let authBridge: ApiAuthBridge | null = null;
let refreshPromise: Promise<string | null> | null = null;

export function registerApiAuthBridge(bridge: ApiAuthBridge): void {
  authBridge = bridge;
}

export function getApiAuthBridge(): ApiAuthBridge | null {
  return authBridge;
}

export function isAuthExemptPath(path: string): boolean {
  return AUTH_EXEMPT_PATHS.has(path);
}

export function shouldAttemptAuthRefresh(path: string, authToken?: string | null): boolean {
  return Boolean(authToken) && !isAuthExemptPath(path);
}

export async function refreshAccessTokenOnce(): Promise<string | null> {
  if (!authBridge) {
    return null;
  }

  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = authBridge.refreshAccessToken().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}
