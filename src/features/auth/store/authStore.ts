import { create } from 'zustand';

import {
  bootstrapSession,
  loginWithCredentials,
  logoutSession,
  refreshAccessToken as refreshSessionAccessToken,
  toSafeAuthErrorMessage,
} from '../services';
import type { AuthStatus, AuthUser, AuthTokens, LoginCredentials } from '../types';

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
      const session = await bootstrapSession();

      if (!session) {
        set({
          ...unauthenticatedState,
          isBootstrapping: false,
        });
        return;
      }

      set({
        ...toAuthenticatedState(session.user, session.tokens),
        isBootstrapping: false,
      });
    } catch {
      set({
        ...unauthenticatedState,
        isBootstrapping: false,
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
          errorMessage: null,
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

  clearError() {
    set({ errorMessage: null });
  },
}));
