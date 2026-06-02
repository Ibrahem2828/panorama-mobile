import type { AppEnvironment } from '../types/common';

const DEFAULT_APP_ENV: AppEnvironment = 'development';
const DEFAULT_API_BASE_URL = 'http://localhost:8000';
const DEFAULT_WS_BASE_URL = 'ws://localhost:8000';

function parseAppEnvironment(value: string | undefined): AppEnvironment {
  if (value === 'development' || value === 'preview' || value === 'production') {
    return value;
  }

  return DEFAULT_APP_ENV;
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

const appEnv = parseAppEnvironment(process.env.EXPO_PUBLIC_APP_ENV);
const apiBaseUrl = trimTrailingSlash(process.env.EXPO_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL);
const wsBaseUrl = trimTrailingSlash(process.env.EXPO_PUBLIC_WS_BASE_URL || DEFAULT_WS_BASE_URL);

export const env = {
  appEnv,
  apiBaseUrl,
  wsBaseUrl,
  isDevelopment: appEnv === 'development',
  isPreview: appEnv === 'preview',
  isProduction: appEnv === 'production',
} as const;

export function validateClientEnv(): string[] {
  const issues: string[] = [];

  if (!env.apiBaseUrl) {
    issues.push('EXPO_PUBLIC_API_BASE_URL is empty.');
  }

  if (!env.wsBaseUrl) {
    issues.push('EXPO_PUBLIC_WS_BASE_URL is empty.');
  }

  if (env.isProduction && env.apiBaseUrl.includes('localhost')) {
    issues.push('Production API base URL must not use localhost.');
  }

  if (env.isProduction && env.wsBaseUrl.includes('localhost')) {
    issues.push('Production WebSocket base URL must not use localhost.');
  }

  return issues;
}
