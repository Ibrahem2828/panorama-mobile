import * as SecureStore from 'expo-secure-store';

import type { AuthTokens } from '../types';

const ACCESS_TOKEN_KEY = 'panorama.auth.accessToken';
const REFRESH_TOKEN_KEY = 'panorama.auth.refreshToken';

export async function saveAuthTokens(tokens: AuthTokens): Promise<void> {
  try {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, tokens.accessToken);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refreshToken);
  } catch (error) {
    await clearAuthTokens();
    throw error;
  }
}

export async function getStoredAuthTokens(): Promise<AuthTokens | null> {
  const [accessToken, refreshToken] = await Promise.all([
    SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
  ]);

  if (!accessToken || !refreshToken) {
    await clearAuthTokens();
    return null;
  }

  return {
    accessToken,
    refreshToken,
  };
}

export async function clearAuthTokens(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
  ]);
}
