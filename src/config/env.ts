import type { AppEnvironment } from '../types/common';
import { logger } from '../utils/logger';

const DEFAULT_APP_ENV: AppEnvironment = 'development';
const DEFAULT_API_BASE_URL = 'http://eby52x8qksscjvfeqxf0eob7.76.13.155.172.sslip.io';
const DEFAULT_WS_BASE_URL = 'ws://eby52x8qksscjvfeqxf0eob7.76.13.155.172.sslip.io';
const API_PREFIX_PATTERN = /(?:\/api\/v1)+$/iu;
const DUPLICATED_API_PREFIX_PATTERN = /^\/(?:api\/v1\/)+(.*)$/iu;

function parseAppEnvironment(value: string | undefined): AppEnvironment {
  if (value === 'development' || value === 'preview' || value === 'production') {
    return value;
  }

  return DEFAULT_APP_ENV;
}

function trimTrailingSlash(value: string): string {
  return value.trim().replace(/\/+$/u, '');
}

function normalizeApiBaseUrl(value: string): string {
  return trimTrailingSlash(value).replace(API_PREFIX_PATTERN, '');
}

function normalizePath(path: string): string {
  const trimmedPath = path.trim().replace(/\/api\/v1(?:\/api\/v1)+/giu, '/api/v1');

  if (/^https?:\/\//iu.test(trimmedPath)) {
    return trimmedPath;
  }

  const pathWithLeadingSlash = trimmedPath.startsWith('/') ? trimmedPath : `/${trimmedPath}`;

  return pathWithLeadingSlash.replace(DUPLICATED_API_PREFIX_PATTERN, '/api/v1/$1');
}

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);

    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function isValidWebSocketUrl(value: string): boolean {
  try {
    const url = new URL(value);

    return url.protocol === 'ws:' || url.protocol === 'wss:';
  } catch {
    return false;
  }
}

const configuredApiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
const configuredWsBaseUrl = process.env.EXPO_PUBLIC_WS_BASE_URL;
const configuredDashboardUrl = process.env.EXPO_PUBLIC_DASHBOARD_URL;
const appEnv = parseAppEnvironment(process.env.EXPO_PUBLIC_APP_ENV);
const apiBaseUrl = normalizeApiBaseUrl(configuredApiBaseUrl || DEFAULT_API_BASE_URL);
const wsBaseUrl = trimTrailingSlash(configuredWsBaseUrl || DEFAULT_WS_BASE_URL);
const isHttpApi = apiBaseUrl.toLowerCase().startsWith('http://');
const enableSelfServiceAuth =
  process.env.EXPO_PUBLIC_ENABLE_SELF_SERVICE_AUTH?.trim().toLowerCase() === 'true';

export const env = {
  appEnv,
  apiBaseUrl,
  wsBaseUrl,
  isHttpApi,
  enableSelfServiceAuth,
  dashboardUrl: configuredDashboardUrl?.trim() || 'https://dashboard.xn--mgbaab0cxheq.tech',
  isDevelopment: appEnv === 'development',
  isPreview: appEnv === 'preview',
  isProduction: appEnv === 'production',
} as const;

export function buildApiUrl(path: string): string {
  const normalizedPath = normalizePath(path);

  if (/^https?:\/\//iu.test(normalizedPath) || !env.apiBaseUrl) {
    return normalizedPath;
  }

  return `${env.apiBaseUrl}${normalizedPath}`;
}

export function buildGroupChatWebSocketUrl({
  groupId,
  accessToken,
}: {
  groupId: string | number;
  accessToken: string;
}): string {
  return `${env.wsBaseUrl}/ws/v1/groups/${encodeURIComponent(
    String(groupId),
  )}/chat/?token=${encodeURIComponent(accessToken)}`;
}

export function validateClientEnv(): string[] {
  const issues: string[] = [];

  if (!configuredApiBaseUrl?.trim()) {
    issues.push(
      'EXPO_PUBLIC_API_BASE_URL is missing; temporary default in use (preview/development only).',
    );
  }

  if (configuredApiBaseUrl && /\/api\/v1(?:\/|$)/iu.test(configuredApiBaseUrl)) {
    issues.push('EXPO_PUBLIC_API_BASE_URL must not include /api/v1; it was removed at runtime.');
  }

  if (env.isHttpApi) {
    issues.push(
      'The API uses temporary cleartext HTTP; preview/development only. Production must use HTTPS.',
    );
  }

  const expectsSecureWebSocket = env.apiBaseUrl.toLowerCase().startsWith('https://');
  const hasSecureWebSocket = env.wsBaseUrl.toLowerCase().startsWith('wss://');

  if (expectsSecureWebSocket !== hasSecureWebSocket) {
    issues.push(
      'EXPO_PUBLIC_WS_BASE_URL protocol must match the API protocol (HTTP/WS or HTTPS/WSS).',
    );
  }

  return issues;
}

export function validateClientEnvStrict(): string[] {
  const issues: string[] = [];

  // Configured URLs are required only for production builds.
  // Preview may rely on compile-time defaults (temporary HTTP/WS allowed).
  if (env.isProduction) {
    if (!configuredApiBaseUrl?.trim()) {
      issues.push('EXPO_PUBLIC_API_BASE_URL is required for production builds.');
    } else if (!isValidHttpUrl(configuredApiBaseUrl.trim())) {
      issues.push('EXPO_PUBLIC_API_BASE_URL must be a valid HTTP or HTTPS URL.');
    }

    if (!configuredWsBaseUrl?.trim()) {
      issues.push('EXPO_PUBLIC_WS_BASE_URL is required for production builds.');
    } else if (!isValidWebSocketUrl(configuredWsBaseUrl.trim())) {
      issues.push('EXPO_PUBLIC_WS_BASE_URL must be a valid WS or WSS URL.');
    }
  } else if (configuredApiBaseUrl && !isValidHttpUrl(configuredApiBaseUrl.trim())) {
    issues.push('EXPO_PUBLIC_API_BASE_URL must be a valid HTTP or HTTPS URL.');
  } else if (configuredWsBaseUrl && !isValidWebSocketUrl(configuredWsBaseUrl.trim())) {
    issues.push('EXPO_PUBLIC_WS_BASE_URL must be a valid WS or WSS URL.');
  }

  const expectsSecureWebSocket = env.apiBaseUrl.toLowerCase().startsWith('https://');
  const hasSecureWebSocket = env.wsBaseUrl.toLowerCase().startsWith('wss://');

  if (expectsSecureWebSocket !== hasSecureWebSocket) {
    issues.push(
      'EXPO_PUBLIC_WS_BASE_URL protocol must match the API protocol (HTTP/WS or HTTPS/WSS).',
    );
  }

  if (env.isProduction && env.isHttpApi) {
    issues.push('Production builds must use HTTPS for EXPO_PUBLIC_API_BASE_URL.');
  }

  if (env.isProduction && !env.wsBaseUrl.toLowerCase().startsWith('wss://')) {
    issues.push('Production builds must use WSS for EXPO_PUBLIC_WS_BASE_URL.');
  }

  return [...new Set(issues)];
}

export function assertClientEnvForRelease(): void {
  // Development: warnings only (soft validate).
  // Preview: allow HTTP/WS + defaults (for temporary backend); only fatal on malformed provided values.
  // Production: strict (HTTPS/WSS required; missing/malformed configured values fatal).
  if (env.isDevelopment) {
    return;
  }

  const fatalIssues = validateClientEnvStrict();

  if (fatalIssues.length === 0) {
    return;
  }

  const message = fatalIssues.join(' ');

  logger.error('Invalid client environment configuration', {
    appEnv: env.appEnv,
    issues: fatalIssues,
  });

  throw new Error(message);
}

if (env.isDevelopment) {
  for (const issue of validateClientEnv()) {
    logger.warn('Client environment configuration warning', { issue });
  }
}
