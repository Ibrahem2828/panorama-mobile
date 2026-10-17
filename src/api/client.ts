import { logger } from '../utils/logger';
import { getApiAuthBridge, refreshAccessTokenOnce, shouldAttemptAuthRefresh } from './authBridge';
import { ACCEPT_JSON, DEFAULT_REQUEST_TIMEOUT_MS, type HttpHeaders } from './http';
import { ApiClientError, createApiError, normalizeApiError, normalizeHttpError } from './errors';
import { IDEMPOTENCY_IN_PROGRESS_DELAYS_MS } from './idempotency';
import { reportLifecycleError } from './lifecycleBridge';
import type { ApiRequestOptions } from './request';
import { buildDefaultApiUrl, buildRequestHeaders } from './request';
import { isApiResponseEnvelope, isApiSuccess } from './response';
import { uploadWithProgress } from './uploadTransport';

type ParsedResponse = {
  body: unknown;
  isJson: boolean;
};

type InternalRequestOptions<TBody = unknown> = ApiRequestOptions<TBody> & {
  _retried?: boolean;
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

function logRequestFailure(
  normalizedError: ReturnType<typeof normalizeApiError>,
  method: string,
  path: string,
) {
  logger.warn('API request failed', {
    code: normalizedError.code,
    status: normalizedError.status ?? 'none',
    requestId: normalizedError.requestId ?? 'none',
    method,
    path,
  });
}

async function executeRequest<TData, TBody = unknown>(
  options: InternalRequestOptions<TBody>,
): Promise<TData> {
  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;
  let timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const abortFromCaller = () => controller.abort();

  if (options.signal?.aborted) {
    controller.abort();
  } else {
    options.signal?.addEventListener('abort', abortFromCaller);
  }

  const method = options.method ?? 'GET';
  const hasBody = options.body !== undefined && options.body !== null;
  const hasFormDataBody = isFormDataBody(options.body);
  const headers: HttpHeaders = buildRequestHeaders({
    headers: options.headers,
    authToken: options.authToken,
    hasJsonBody: hasBody,
    hasFormDataBody,
    idempotencyKey: options.idempotencyKey,
  });
  const url = buildDefaultApiUrl(options);

  try {
    const { onUploadProgress } = options;
    const response =
      onUploadProgress && isFormDataBody(options.body)
        ? await uploadWithProgress(url, {
            method,
            headers,
            body: options.body,
            signal: controller.signal,
            onUploadProgress: (progress) => {
              // Progress means the connection is alive: restart the stall timer.
              clearTimeout(timeoutId);
              timeoutId = setTimeout(() => controller.abort(), timeoutMs);
              onUploadProgress(progress);
            },
          })
        : await fetch(url, {
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

    logRequestFailure(normalizedError, method, options.path);
    reportLifecycleError(normalizedError);

    throw new ApiClientError(normalizedError);
  } finally {
    clearTimeout(timeoutId);
    options.signal?.removeEventListener('abort', abortFromCaller);
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * A 409 IDEMPOTENCY_IN_PROGRESS means the first attempt with this key is still running on
 * the server. Re-sending the SAME key a few times lets the server replay the stored
 * result once that attempt finishes, instead of surfacing a spurious failure.
 */
async function executeWithIdempotencyWait<TData, TBody = unknown>(
  options: InternalRequestOptions<TBody>,
): Promise<TData> {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await executeRequest<TData, TBody>(options);
    } catch (error) {
      const waitMs = IDEMPOTENCY_IN_PROGRESS_DELAYS_MS[attempt];

      if (
        !options.idempotencyKey ||
        normalizeApiError(error).code !== 'IDEMPOTENCY_IN_PROGRESS' ||
        waitMs === undefined
      ) {
        throw error;
      }

      await delay(waitMs);
    }
  }
}

async function requestWithAuthRetry<TData, TBody = unknown>(
  options: InternalRequestOptions<TBody>,
): Promise<TData> {
  try {
    return await executeWithIdempotencyWait<TData, TBody>(options);
  } catch (error) {
    const normalizedError = normalizeApiError(error);

    if (
      normalizedError.code !== 'UNAUTHORIZED' ||
      options._retried ||
      !shouldAttemptAuthRefresh(options.path, options.authToken)
    ) {
      throw error instanceof ApiClientError ? error : new ApiClientError(normalizedError);
    }

    const bridge = getApiAuthBridge();

    if (!bridge) {
      throw error instanceof ApiClientError ? error : new ApiClientError(normalizedError);
    }

    let refreshedToken: string | null;

    try {
      refreshedToken = await refreshAccessTokenOnce();
    } catch (refreshError) {
      // Transient refresh failure (network, timeout, 5xx, 429): the session is NOT
      // expired. Surface the failure to the caller and keep the user signed in.
      throw refreshError instanceof ApiClientError
        ? refreshError
        : new ApiClientError(normalizeApiError(refreshError));
    }

    if (!refreshedToken) {
      await bridge.onSessionExpired();
      throw new ApiClientError(normalizedError);
    }

    return executeWithIdempotencyWait<TData, TBody>({
      ...options,
      authToken: refreshedToken,
      _retried: true,
    });
  }
}

async function request<TData, TBody = unknown>(options: ApiRequestOptions<TBody>): Promise<TData> {
  if (shouldAttemptAuthRefresh(options.path, options.authToken)) {
    return requestWithAuthRetry<TData, TBody>(options);
  }

  return executeWithIdempotencyWait<TData, TBody>(options);
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
