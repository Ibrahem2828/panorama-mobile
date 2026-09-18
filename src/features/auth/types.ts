import type { TranslationCatalog } from '../../i18n';

export type UserRole = 'it_support' | 'admin' | 'print_staff' | 'student' | 'normal_user' | string;

export type AuthUser = {
  id: string | number;
  email?: string;
  phone_number?: string;
  full_name?: string;
  username?: string | null;
  role?: UserRole;
  is_phone_verified?: boolean;
  is_email_verified?: boolean;
  // D1: may be present on login for normal_user flow
  requires_phone_verification?: boolean;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type LoginCredentials = {
  identifier: string;
  password: string;
};

export type AuthStatus = 'idle' | 'bootstrapping' | 'authenticated' | 'unauthenticated';

export type AuthSession = {
  user: AuthUser;
  tokens: AuthTokens;
};

/** Passed into the error mappers so they stay pure and locale-agnostic. */
export type AuthErrorMessages = TranslationCatalog['auth']['errors'];
