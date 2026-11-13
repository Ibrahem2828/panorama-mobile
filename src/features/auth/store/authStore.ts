import { create } from 'zustand';

import { isDeviceMismatchError } from '../../../api';
import {
  DeviceMismatchLoginError,
  DeviceSwitchError,
  bootstrapSession,
  deviceLockReducer,
  endSessionReplacedByAnotherDevice,
  initialDeviceLockState,
  loginWithCredentials,
  logoutSession,
  refreshAccessToken as refreshSessionAccessToken,
  switchDeviceSession,
  toSafeAuthErrorMessage,
} from '../services';
import type { DeviceLockState } from '../services';
import { useLocaleStore } from '../../../i18n';
import { bindOfflineToAuth } from '../../../offline/authSync';
import type { AuthStatus, AuthUser, AuthTokens, LoginCredentials } from '../types';

function sessionExpiredMessage(): string {
  return useLocaleStore.getState().t.auth.errors.sessionExpired;
}

function deviceReplacedMessage(): string {
  return useLocaleStore.getState().t.deviceLock.replacedNotice;
}

type AuthState = {
  status: AuthStatus;
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isBootstrapping: boolean;
  isSubmitting: boolean;
  errorMessage: string | null;
  /** The login was refused because the account belongs to another phone (see deviceLock). */
  deviceLock: DeviceLockState;
  /** Set when another phone took the account over, so a late "session expired" does not replace the explanation. */
  endedByDevice: boolean;

  bootstrap: () => Promise<void>;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<string | null>;
  forceSessionExpired: (message?: string) => Promise<void>;
  /** Another phone took the account over: sign out and explain on the login screen. */
  forceDeviceReplaced: () => Promise<void>;
  switchDevice: () => Promise<void>;
  tickDeviceLock: () => void;
  resetDeviceLock: () => void;
  setUser: (user: AuthUser) => void;
  clearError: () => void;
};

const unauthenticatedState = {
  status: 'unauthenticated' as const,
  user: null,
  accessToken: null,
  refreshToken: null,
};

function toAuthenticatedState(user: AuthUser, tokens: AuthTokens) {
  return {
    status: 'authenticated' as const,
    user,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
}

export const useAuthStore = create<AuthState>((set, get) => ({
  status: 'idle',
  user: null,
  accessToken: null,
  refreshToken: null,
  isBootstrapping: false,
  isSubmitting: false,
  errorMessage: null,
  deviceLock: initialDeviceLockState,
  endedByDevice: false,

  async bootstrap() {
    const { status, isBootstrapping } = get();

    if (status !== 'idle' || isBootstrapping) {
      return;
    }

    set({
      status: 'bootstrapping',
      isBootstrapping: true,
      errorMessage: null,
    });

    try {
      const result = await bootstrapSession();

      if (!result.session) {
        set({
          ...unauthenticatedState,
          isBootstrapping: false,
          endedByDevice: Boolean(result.deviceReplaced),
          errorMessage: result.deviceReplaced
            ? deviceReplacedMessage()
            : result.sessionExpired
              ? sessionExpiredMessage()
              : null,
        });
        return;
      }

      set({
        ...toAuthenticatedState(result.session.user, result.session.tokens),
        isBootstrapping: false,
      });
    } catch (error) {
      set({
        ...unauthenticatedState,
        isBootstrapping: false,
        errorMessage: toSafeAuthErrorMessage(error) || sessionExpiredMessage(),
      });
    }
  },

  async login(credentials) {
    set({
      isSubmitting: true,
      errorMessage: null,
      endedByDevice: false,
      deviceLock: initialDeviceLockState,
    });

    try {
      const session = await loginWithCredentials(credentials);

      set({
        ...toAuthenticatedState(session.user, session.tokens),
        isSubmitting: false,
        errorMessage: null,
      });
    } catch (error) {
      if (error instanceof DeviceMismatchLoginError) {
        // Not a failed login: the password was right. The device screen takes over from the form.
        set({
          ...unauthenticatedState,
          isSubmitting: false,
          errorMessage: null,
          deviceLock: deviceLockReducer(get().deviceLock, {
            type: 'mismatch',
            info: error.info,
            now: Date.now(),
          }),
        });

        throw error;
      }

      set({
        ...unauthenticatedState,
        isSubmitting: false,
        errorMessage: toSafeAuthErrorMessage(error),
      });

      throw error;
    }
  },

  async switchDevice() {
    const { deviceLock } = get();
    const token = deviceLock.info?.switchToken;

    if (deviceLock.phase !== 'conflict' || !token) {
      return;
    }

    set({ deviceLock: deviceLockReducer(deviceLock, { type: 'switch_started' }) });

    try {
      const session = await switchDeviceSession(token);

      set({
        ...toAuthenticatedState(session.user, session.tokens),
        isSubmitting: false,
        errorMessage: null,
        endedByDevice: false,
        deviceLock: initialDeviceLockState,
      });
    } catch (error) {
      const failure = error instanceof DeviceSwitchError ? error.failure : 'generic';

      set({
        deviceLock: deviceLockReducer(get().deviceLock, { type: 'switch_failed', failure }),
      });
    }
  },

  tickDeviceLock() {
    const next = deviceLockReducer(get().deviceLock, { type: 'tick', now: Date.now() });

    if (next !== get().deviceLock) {
      set({ deviceLock: next });
    }
  },

  resetDeviceLock() {
    set({ deviceLock: initialDeviceLockState });
  },

  async logout() {
    const { accessToken, refreshToken } = get();

    set({
      isSubmitting: true,
      errorMessage: null,
    });

    try {
      await logoutSession({
        accessToken: accessToken ?? undefined,
        refreshToken: refreshToken ?? undefined,
      });
    } finally {
      set({
        ...unauthenticatedState,
        isSubmitting: false,
        errorMessage: null,
      });
    }
  },

  /**
   * Resolves with a fresh access token, or `null` when the session is definitively over
   * (the refresh endpoint answered 400/401). A transient failure rejects instead and
   * leaves the session untouched, so a flaky connection never signs the user out.
   */
  async refreshAccessToken() {
    let tokens: AuthTokens | null;

    try {
      tokens = await refreshSessionAccessToken();
    } catch (error) {
      if (isDeviceMismatchError(error)) {
        // This phone was replaced: the stored tokens are already gone; explain on the login screen.
        set({
          ...unauthenticatedState,
          endedByDevice: true,
          errorMessage: deviceReplacedMessage(),
        });
        return null;
      }

      throw error;
    }

    if (!tokens) {
      set({
        ...unauthenticatedState,
        errorMessage: sessionExpiredMessage(),
      });
      return null;
    }

    set({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      errorMessage: null,
    });

    return tokens.accessToken;
  },

  async forceSessionExpired(message = sessionExpiredMessage()) {
    const { status } = get();

    if (status === 'unauthenticated' && (get().errorMessage === message || get().endedByDevice)) {
      return;
    }

    set({
      ...unauthenticatedState,
      isSubmitting: false,
      errorMessage: message,
    });
  },

  async forceDeviceReplaced() {
    await endSessionReplacedByAnotherDevice();

    set({
      ...unauthenticatedState,
      isSubmitting: false,
      endedByDevice: true,
      errorMessage: deviceReplacedMessage(),
    });
  },

  setUser(user) {
    set({ user });
  },

  clearError() {
    set({ errorMessage: null });
  },
}));

// The offline cache follows the signed-in user and is wiped when they sign out or another account signs in.
bindOfflineToAuth(useAuthStore);
