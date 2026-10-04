import { create } from 'zustand';

import {
  bootstrapSession,
  loginWithCredentials,
  logoutSession,
  refreshAccessToken as refreshSessionAccessToken,
  toSafeAuthErrorMessage,
} from '../services';
import { useLocaleStore } from '../../../i18n';
import type { AuthStatus, AuthUser, AuthTokens, LoginCredentials } from '../types';

function sessionExpiredMessage(): string {
  return useLocaleStore.getState().t.auth.errors.sessionExpired;
}

type AuthState = {
  status: AuthStatus;
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isBootstrapping: boolean;
  isSubmitting: boolean;
  errorMessage: string | null;

  bootstrap: () => Promise<void>;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<string | null>;
  forceSessionExpired: (message?: string) => Promise<void>;
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
          errorMessage: result.sessionExpired ? sessionExpiredMessage() : null,
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
        errorMessage:
          error instanceof Error && error.message ? error.message : sessionExpiredMessage(),
      });
    }
  },

  async login(credentials) {
    set({
      isSubmitting: true,
      errorMessage: null,
    });

    try {
      const session = await loginWithCredentials(credentials);

      set({
        ...toAuthenticatedState(session.user, session.tokens),
        isSubmitting: false,
        errorMessage: null,
      });
    } catch (error) {
      set({
        ...unauthenticatedState,
        isSubmitting: false,
        errorMessage: toSafeAuthErrorMessage(error),
      });

      throw error;
    }
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

  async refreshAccessToken() {
    try {
      const tokens = await refreshSessionAccessToken();

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
    } catch (error) {
      set({
        ...unauthenticatedState,
        errorMessage: toSafeAuthErrorMessage(error),
      });

      return null;
    }
  },

  async forceSessionExpired(message = sessionExpiredMessage()) {
    const { status } = get();

    if (status === 'unauthenticated' && get().errorMessage === message) {
      return;
    }

    set({
      ...unauthenticatedState,
      isSubmitting: false,
      errorMessage: message,
    });
  },

  setUser(user) {
    set({ user });
  },

  clearError() {
    set({ errorMessage: null });
  },
}));
