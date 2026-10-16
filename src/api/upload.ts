import { getApiAuthBridge, refreshAccessTokenOnce, shouldAttemptAuthRefresh } from './authBridge';
import { ApiClientError, createApiError, normalizeApiError, normalizeHttpError } from './errors';
import { DEFAULT_REQUEST_TIMEOUT_MS } from './http';
import { buildDefaultApiUrl, buildRequestHeaders } from './request';
import { isApiResponseEnvelope, isApiSuccess } from './response';

/** `errorCode` of the error raised when the caller aborts an upload. */
export const UPLOAD_CANCELLED = 'UPLOAD_CANCELLED';

/** Uploads are slower than ordinary calls; allow a generous but finite window. */
const UPLOAD_TIMEOUT_MS = DEFAULT_REQUEST_TIMEOUT_MS * 4;

export type UploadOptions = {
  authToken?: string | null;
  idempotencyKey?: string;
  /** Called with a fraction in [0, 1] as the request body is sent. */
  onProgress?: (fraction: number) => void;
};

export type UploadHandle<TData> = {
  promise: Promise<TData>;
  abort: () => void;
};

export function isUploadCancelled(error: unknown): boolean {
  return normalizeApiError(error).errorCode === UPLOAD_CANCELLED;
}

function parseBody(text: string, contentType: string | null): unknown {
  if (!text) return undefined;
  if (!(contentType ?? '').includes('application/json')) return text;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return undefined;
  }
}

function sendOnce<TData>(
  path: string,
  formData: FormData,
  authToken: string | null | undefined,
  options: UploadOptions,
  registerAbort: (abort: () => void) => void,
): Promise<TData> {
  return new Promise<TData>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const headers = buildRequestHeaders({
      authToken,
      hasJsonBody: true,
      hasFormDataBody: true,
      idempotencyKey: options.idempotencyKey,
    });

    xhr.open('POST', buildDefaultApiUrl({ path }));
    xhr.timeout = UPLOAD_TIMEOUT_MS;

    for (const [name, value] of Object.entries(headers)) {
      xhr.setRequestHeader(name, value);
    }

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) {
        options.onProgress?.(Math.min(1, event.loaded / event.total));
      }
    };
    xhr.onerror = () => reject(createApiError({ code: 'NETWORK_ERROR' }));
    xhr.ontimeout = () => reject(createApiError({ code: 'TIMEOUT' }));
    xhr.onabort = () =>
      reject(createApiError({ code: 'NETWORK_ERROR', errorCode: UPLOAD_CANCELLED }));
    xhr.onload = () => {
      const body = parseBody(xhr.responseText, xhr.getResponseHeader('content-type'));

      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new ApiClientError(normalizeHttpError({ status: xhr.status, responseBody: body })));
        return;
      }

      if (isApiResponseEnvelope(body)) {
        if (isApiSuccess(body)) {
          resolve(body.data as TData);
        } else {
          reject(
            new ApiClientError(normalizeHttpError({ status: xhr.status, responseBody: body })),
          );
        }
        return;
      }

      resolve(body as TData);
    };

    registerAbort(() => xhr.abort());
    xhr.send(formData);
  });
}

/**
 * POSTs multipart form data with upload progress (fetch cannot report it) and a cancel
 * handle. Mirrors the apiClient conventions: bearer token, Idempotency-Key, the response
 * envelope, normalised errors and one transparent token refresh on 401.
 */
export function uploadFormData<TData>(
  path: string,
  formData: FormData,
  options: UploadOptions = {},
): UploadHandle<TData> {
  let abortCurrent: () => void = () => undefined;
  let aborted = false;

  const run = async (): Promise<TData> => {
    const register = (abort: () => void) => {
      abortCurrent = abort;
    };

    try {
      return await sendOnce<TData>(path, formData, options.authToken, options, register);
    } catch (error) {
      if (
        aborted ||
        normalizeApiError(error).code !== 'UNAUTHORIZED' ||
        !shouldAttemptAuthRefresh(path, options.authToken)
      ) {
        throw error;
      }

      const bridge = getApiAuthBridge();
      const refreshed = bridge ? await refreshAccessTokenOnce() : null;

      if (!refreshed) {
        await bridge?.onSessionExpired();
        throw error;
      }

      return sendOnce<TData>(path, formData, refreshed, options, register);
    }
  };

  return {
    promise: run(),
    abort: () => {
      aborted = true;
      abortCurrent();
    },
  };
}
