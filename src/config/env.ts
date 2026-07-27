import Constants from 'expo-constants';

import type { AppEnvironment } from '../types/common';
import { logger } from '../utils/logger';

const DEVELOPMENT_API_BASE_URL = 'http://127.0.0.1:8000';
const DEVELOPMENT_WS_BASE_URL = 'ws://127.0.0.1:8000';
const API_PREFIX_PATTERN = /(?:\/api\/v1)+$/iu;

type PublicExtra = {
  appEnv?: AppEnvironment;
  apiBaseUrl?: string;
  wsBaseUrl?: string;
  supportEmail?: string;
  sentryDsn?: string;
  dashboardUrl?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as PublicExtra;
const appEnv: AppEnvironment =
  extra.appEnv === 'preview' || extra.appEnv === 'production' ? extra.appEnv : 'development';

function trimTrailingSlash(value: string): string {
  return value.trim().replace(/\/+$/u, '');
}

function normalizeApiBaseUrl(value: string): string {
  return trimTrailingSlash(value).replace(API_PREFIX_PATTERN, '');
}

function normalizePath(path: string): string {
  if (/^https?:\/\//iu.test(path)) return path;
  const withSlash = path.startsWith('/') ? path : `/${path}`;
  return withSlash.replace(/^\/(?:api\/v1\/)+(.*)$/iu, '/api/v1/$1');
}

const apiBaseUrl = normalizeApiBaseUrl(extra.apiBaseUrl || DEVELOPMENT_API_BASE_URL);
const wsBaseUrl = trimTrailingSlash(extra.wsBaseUrl || DEVELOPMENT_WS_BASE_URL);

export const env = {
  appEnv,
  apiBaseUrl,
  wsBaseUrl,
  supportEmail: extra.supportEmail || 'panoramacompany31@gmail.com',
  sentryDsn: extra.sentryDsn || '',
  dashboardUrl: extra.dashboardUrl || '',
  isDevelopment: appEnv === 'development',
  isPreview: appEnv === 'preview',
  isProduction: appEnv === 'production',
} as const;

export function buildApiUrl(path: string): string {
  const normalized = normalizePath(path);
  if (/^https?:\/\//iu.test(normalized)) return normalized;
  return `${env.apiBaseUrl}${normalized}`;
}

export function buildGroupChatWebSocketUrl(groupId: string | number): string {
  return `${env.wsBaseUrl}/ws/v1/groups/${encodeURIComponent(String(groupId))}/chat/`;
}

export function assertClientEnvForRelease(): void {
  const issues: string[] = [];
  if (!/^https?:\/\//iu.test(env.apiBaseUrl)) issues.push('عنوان API غير صالح.');
  if (!/^wss?:\/\//iu.test(env.wsBaseUrl)) issues.push('عنوان WebSocket غير صالح.');
  if (!env.isDevelopment && !env.apiBaseUrl.startsWith('https://')) {
    issues.push('نسخ المعاينة والإنتاج تتطلب HTTPS.');
  }
  if (!env.isDevelopment && !env.wsBaseUrl.startsWith('wss://')) {
    issues.push('نسخ المعاينة والإنتاج تتطلب WSS.');
  }
  if (issues.length) {
    logger.error('Invalid release environment', { issues, appEnv: env.appEnv });
    throw new Error(issues.join(' '));
  }
}
