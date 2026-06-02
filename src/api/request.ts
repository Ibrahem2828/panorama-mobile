import { env } from '../config/env';
import type { HttpHeaders, HttpMethod } from './http';
import { CONTENT_TYPE_JSON } from './http';
import { buildQueryString } from './pagination';

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
};

export function buildApiUrl(baseUrl: string, path: string, query?: ApiQueryParams): string {
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const queryString = buildQueryString(query);

  if (/^https?:\/\//i.test(path)) {
    return `${path}${queryString}`;
  }

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
}: {
  headers?: HttpHeaders;
  authToken?: string | null;
  hasJsonBody: boolean;
  hasFormDataBody: boolean;
}): HttpHeaders {
  return {
    Accept: CONTENT_TYPE_JSON,
    ...(hasJsonBody && !hasFormDataBody ? { 'Content-Type': CONTENT_TYPE_JSON } : {}),
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...headers,
  };
}

export function buildDefaultApiUrl<TBody>(options: ApiRequestOptions<TBody>): string {
  return buildApiUrl(env.apiBaseUrl, options.path, options.query);
}
