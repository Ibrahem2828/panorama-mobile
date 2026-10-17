import { buildApiUrl as buildConfiguredApiUrl } from '../config/env';
import { getAppClientHeaders } from './appInfo';
import type { HttpHeaders, HttpMethod } from './http';
import { CONTENT_TYPE_JSON } from './http';
import { buildQueryString } from './pagination';
import type { UploadProgress } from './uploadTransport';

export type ApiQueryParamValue = string | number | boolean | null | undefined;

export type ApiQueryParams = Record<string, ApiQueryParamValue>;

export type ApiRequestOptions<TBody = unknown> = {
  method?: HttpMethod;
  path: string;
  query?: ApiQueryParams;
  body?: TBody;
  headers?: HttpHeaders;
  authToken?: string | null;
  timeoutMs?: number;
  /**
   * Sent as the `Idempotency-Key` header. Callers generate one key per user action and
   * pass the same key when that action is retried (see ./idempotency).
   */
  idempotencyKey?: string;
  /** Lets the caller cancel an in-flight request (for example a long upload). */
  signal?: AbortSignal;
  /**
   * Multipart bodies only: reports bytes sent. Supplying it switches the request to an
   * XMLHttpRequest transport, and `timeoutMs` then acts as a stall timeout that restarts on
   * every progress event instead of a hard cap on the whole upload.
   */
  onUploadProgress?: (progress: UploadProgress) => void;
};

function normalizeApiBaseUrl(baseUrl: string): string {
  return baseUrl
    .trim()
    .replace(/\/+$/u, '')
    .replace(/(?:\/api\/v1)+$/iu, '');
}

function normalizeApiPath(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  return normalizedPath.replace(/^\/(?:api\/v1\/)+(.*)$/iu, '/api/v1/$1');
}

export function buildApiUrl(baseUrl: string, path: string, query?: ApiQueryParams): string {
  const queryString = buildQueryString(query);

  if (/^https?:\/\//i.test(path)) {
    return `${path.replace(/\/api\/v1(?:\/api\/v1)+/giu, '/api/v1')}${queryString}`;
  }

  const normalizedBaseUrl = normalizeApiBaseUrl(baseUrl);
  const normalizedPath = normalizeApiPath(path);

  if (!normalizedBaseUrl) {
    return `${normalizedPath}${queryString}`;
  }

  return `${normalizedBaseUrl}${normalizedPath}${queryString}`;
}

export function buildRequestHeaders({
  headers,
  authToken,
  hasJsonBody,
  hasFormDataBody,
  idempotencyKey,
}: {
  headers?: HttpHeaders;
  authToken?: string | null;
  hasJsonBody: boolean;
  hasFormDataBody: boolean;
  idempotencyKey?: string;
}): HttpHeaders {
  return {
    Accept: CONTENT_TYPE_JSON,
    ...getAppClientHeaders(),
    ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
    ...(hasJsonBody && !hasFormDataBody ? { 'Content-Type': CONTENT_TYPE_JSON } : {}),
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...headers,
  };
}

export function buildDefaultApiUrl<TBody>(options: ApiRequestOptions<TBody>): string {
  return `${buildConfiguredApiUrl(options.path)}${buildQueryString(options.query)}`;
}
