import { env } from '../config/env';
import { logger } from '../utils/logger';
import { ACCEPT_JSON, DEFAULT_REQUEST_TIMEOUT_MS, type HttpHeaders } from './http';
import { ApiClientError, createApiError, normalizeApiError, normalizeHttpError } from './errors';
import type { ApiRequestOptions } from './request';
import { buildApiUrl, buildRequestHeaders } from './request';
import { isApiResponseEnvelope, isApiSuccess } from './response';

type ParsedResponse = {
  body: unknown;
  isJson: boolean;
};

function isFormDataBody(body: unknown): body is FormData {
  return typeof FormData !== 'undefined' && body instanceof FormData;
}

async function parseResponse(response: Response): Promise<ParsedResponse> {
  if (response.status === 204) {
    return {
      body: undefined,
      isJson: false,
    };
  }

  const contentType = response.headers.get('content-type') ?? '';
  const responseText = await response.text();

  if (!responseText) {
    return {
      body: undefined,
      isJson: false,
    };
  }

  if (!contentType.includes(ACCEPT_JSON)) {
    return {
      body: responseText,
      isJson: false,
    };
  }

  try {
    return {
      body: JSON.parse(responseText) as unknown,
      isJson: true,
    };
  } catch (error) {
    logger.warn('Failed to parse API JSON response', {
      status: response.status,
    });

    throw createApiError({
      code: 'UNKNOWN_ERROR',
      status: response.status,
      raw: error,
    });
  }
}

function buildFetchBody(body: unknown): BodyInit | undefined {
  if (body === undefined || body === null) {
    return undefined;
  }

  if (isFormDataBody(body)) {
    return body;
  }

  return JSON.stringify(body);
}

async function request<TData, TBody = unknown>(options: ApiRequestOptions<TBody>): Promise<TData> {
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    options.timeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS,
  );
  const method = options.method ?? 'GET';
  const hasBody = options.body !== undefined && options.body !== null;
  const hasFormDataBody = isFormDataBody(options.body);
  const headers: HttpHeaders = buildRequestHeaders({
    headers: options.headers,
    authToken: options.authToken,
    hasJsonBody: hasBody,
    hasFormDataBody,
  });
  const url = buildApiUrl(env.apiBaseUrl, options.path, options.query);

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: buildFetchBody(options.body),
      signal: controller.signal,
    });
    const parsedResponse = await parseResponse(response);

    if (!response.ok) {
      throw new ApiClientError(
        normalizeHttpError({
          status: response.status,
          responseBody: parsedResponse.body,
        }),
      );
    }

    if (isApiResponseEnvelope(parsedResponse.body)) {
      if (isApiSuccess(parsedResponse.body)) {
        return parsedResponse.body.data as TData;
      }

      throw new ApiClientError(
        normalizeHttpError({
          status: response.status,
          responseBody: parsedResponse.body,
        }),
      );
    }

    return parsedResponse.body as TData;
  } catch (error) {
    const normalizedError = normalizeApiError(error);

    logger.warn('API request failed', {
      code: normalizedError.code,
      status: normalizedError.status ?? 'none',
      method,
      path: options.path,
    });

    throw new ApiClientError(normalizedError);
  } finally {
    clearTimeout(timeoutId);
  }
}

export const apiClient = {
  request,
  get<TData>(path: string, options?: Omit<ApiRequestOptions, 'method' | 'path' | 'body'>) {
    return request<TData>({
      ...options,
      method: 'GET',
      path,
    });
  },
  post<TData, TBody = unknown>(
    path: string,
    body?: TBody,
    options?: Omit<ApiRequestOptions<TBody>, 'method' | 'path' | 'body'>,
  ) {
    return request<TData, TBody>({
      ...options,
      method: 'POST',
      path,
      body,
    });
  },
  put<TData, TBody = unknown>(
    path: string,
    body?: TBody,
    options?: Omit<ApiRequestOptions<TBody>, 'method' | 'path' | 'body'>,
  ) {
    return request<TData, TBody>({
      ...options,
      method: 'PUT',
      path,
      body,
    });
  },
  patch<TData, TBody = unknown>(
    path: string,
    body?: TBody,
    options?: Omit<ApiRequestOptions<TBody>, 'method' | 'path' | 'body'>,
  ) {
    return request<TData, TBody>({
      ...options,
      method: 'PATCH',
      path,
      body,
    });
  },
  delete<TData>(path: string, options?: Omit<ApiRequestOptions, 'method' | 'path' | 'body'>) {
    return request<TData>({
      ...options,
      method: 'DELETE',
      path,
    });
  },
} as const;
