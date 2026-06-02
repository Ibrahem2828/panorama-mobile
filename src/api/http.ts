export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type HttpHeaders = Record<string, string>;

export type RequestContentType = 'json' | 'multipart';

export const CONTENT_TYPE_JSON = 'application/json';
export const CONTENT_TYPE_MULTIPART = 'multipart/form-data';
export const ACCEPT_JSON = 'application/json';

export const DEFAULT_REQUEST_TIMEOUT_MS = 30_000;
