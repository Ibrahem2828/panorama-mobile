import { logger } from '../utils/logger';
import { useLocaleStore } from '../i18n';

export type ApiErrorCode =
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'SERVER_ERROR'
  | 'RATE_LIMITED'
  | 'CONFLICT'
  | 'MAINTENANCE_MODE'
  | 'APP_UPDATE_REQUIRED'
  | 'IDEMPOTENCY_KEY_REUSED'
  | 'IDEMPOTENCY_IN_PROGRESS'
  | 'UNKNOWN_ERROR';

export type FieldErrors = Record<string, string[]>;

export type NormalizedApiError = {
  code: ApiErrorCode;
  status?: number;
  message: string;
  technicalMessage?: string;
  requestId?: string;
  fieldErrors?: FieldErrors;
  errorCode?: string;
  retryAfterSeconds?: number;
  /** Structured payload of lifecycle errors (maintenance window, store link, ...). */
  details?: Record<string, unknown>;
  raw?: unknown;
};

type UnknownRecord = Record<string, unknown>;

/**
 * Resolved per call rather than at module load: this module is imported before the
 * locale store hydrates, so a captured map would pin every fallback to the startup
 * locale for the life of the process.
 */
function defaultMessageFor(code: ApiErrorCode): string {
  const t = useLocaleStore.getState().t.apiErrors;
  const messages: Record<ApiErrorCode, string> = {
    NETWORK_ERROR: t.network,
    TIMEOUT: t.timeout,
    UNAUTHORIZED: t.unauthorized,
    FORBIDDEN: t.forbidden,
    NOT_FOUND: t.notFound,
    VALIDATION_ERROR: t.validation,
    SERVER_ERROR: t.server,
    RATE_LIMITED: t.rateLimited,
    CONFLICT: t.conflict,
    MAINTENANCE_MODE: t.maintenance,
    APP_UPDATE_REQUIRED: t.updateRequired,
    IDEMPOTENCY_KEY_REUSED: t.idempotencyKeyReused,
    IDEMPOTENCY_IN_PROGRESS: t.idempotencyInProgress,
    UNKNOWN_ERROR: t.unknown,
  };
  return messages[code];
}

export class ApiClientError extends Error implements NormalizedApiError {
  code: ApiErrorCode;
  status?: number;
  technicalMessage?: string;
  requestId?: string;
  fieldErrors?: FieldErrors;
  errorCode?: string;
  retryAfterSeconds?: number;
  details?: Record<string, unknown>;
  raw?: unknown;

  constructor(error: NormalizedApiError) {
    super(error.message);
    this.name = 'ApiClientError';
    this.code = error.code;
    this.status = error.status;
    this.technicalMessage = error.technicalMessage;
    this.requestId = error.requestId;
    this.fieldErrors = error.fieldErrors;
    this.errorCode = error.errorCode;
    this.retryAfterSeconds = error.retryAfterSeconds;
    this.details = error.details;
    this.raw = error.raw;
  }
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null;
}

function isApiClientError(error: unknown): error is ApiClientError {
  return error instanceof ApiClientError;
}

function isAbortError(error: unknown): boolean {
  return isRecord(error) && error.name === 'AbortError';
}

function toFieldErrors(errors: unknown): FieldErrors | undefined {
  if (!isRecord(errors)) {
    return undefined;
  }

  return Object.fromEntries(
    Object.entries(errors).map(([key, value]) => {
      if (Array.isArray(value)) {
        return [key, value.map((item) => String(item))];
      }

      return [key, [String(value)]];
    }),
  );
}

function extractErrorCode(responseBody: unknown): string | undefined {
  if (!isRecord(responseBody)) return undefined;
  const data = isRecord(responseBody.data) ? responseBody.data : undefined;
  if (data && typeof data.error_code === 'string') {
    return data.error_code;
  }
  // The backend envelope carries its machine-readable code at the top level.
  if (typeof responseBody.code === 'string' && responseBody.code.trim()) {
    return responseBody.code.trim();
  }
  return undefined;
}

function extractDetails(responseBody: unknown): Record<string, unknown> | undefined {
  if (!isRecord(responseBody) || !isRecord(responseBody.errors)) return undefined;
  return responseBody.errors;
}

/**
 * Maps the status plus the backend `code` onto a typed code. Lifecycle and idempotency
 * errors are only recognised on their documented status, so an unrelated 503 or 409 keeps
 * its generic classification.
 */
function codeFromStatusAndBackendCode(
  status: number | undefined,
  backendCode?: string,
): ApiErrorCode {
  if (status === 503 && backendCode === 'MAINTENANCE_MODE') return 'MAINTENANCE_MODE';
  if (status === 426 && backendCode === 'APP_UPDATE_REQUIRED') return 'APP_UPDATE_REQUIRED';
  if (status === 409) {
    if (backendCode === 'IDEMPOTENCY_KEY_REUSED') return 'IDEMPOTENCY_KEY_REUSED';
    if (backendCode === 'IDEMPOTENCY_IN_PROGRESS') return 'IDEMPOTENCY_IN_PROGRESS';
    return 'CONFLICT';
  }
  return codeFromStatus(status);
}

function extractRetryAfter(responseBody: unknown): number | undefined {
  if (!isRecord(responseBody)) return undefined;
  if (typeof responseBody.retry_after_seconds === 'number') {
    return responseBody.retry_after_seconds;
  }
  const data = isRecord(responseBody.data) ? responseBody.data : undefined;
  if (data && typeof data.retry_after_seconds === 'number') {
    return data.retry_after_seconds;
  }
  if (data && typeof data.retry_after_minutes === 'number') {
    return data.retry_after_minutes * 60;
  }
  return undefined;
}

function extractRequestId(responseBody: unknown): string | undefined {
  if (!isRecord(responseBody)) {
    return undefined;
  }

  const requestId = responseBody.request_id;

  return typeof requestId === 'string' && requestId.trim() ? requestId.trim() : undefined;
}

function extractBackendMessage(responseBody: unknown): string | undefined {
  if (!isRecord(responseBody) || typeof responseBody.message !== 'string') {
    return undefined;
  }

  const message = responseBody.message.trim();

  return message || undefined;
}

function resolveUserMessage(code: ApiErrorCode, backendMessage?: string): string {
  if (!backendMessage) {
    return defaultMessageFor(code);
  }

  return backendMessage;
}

function codeFromStatus(status?: number): ApiErrorCode {
  if (status === 400 || status === 422) {
    return 'VALIDATION_ERROR';
  }

  if (status === 401) {
    return 'UNAUTHORIZED';
  }

  if (status === 403) {
    return 'FORBIDDEN';
  }

  if (status === 404) {
    return 'NOT_FOUND';
  }

  if (status === 429) {
    return 'RATE_LIMITED';
  }

  if (status && status >= 500) {
    return 'SERVER_ERROR';
  }

  return 'UNKNOWN_ERROR';
}

export function createApiError(input: {
  code?: ApiErrorCode;
  status?: number;
  message?: string;
  technicalMessage?: string;
  requestId?: string;
  fieldErrors?: FieldErrors;
  errorCode?: string;
  retryAfterSeconds?: number;
  details?: Record<string, unknown>;
  raw?: unknown;
}): ApiClientError {
  const code = input.code ?? codeFromStatus(input.status);

  return new ApiClientError({
    code,
    status: input.status,
    message: input.message || defaultMessageFor(code),
    technicalMessage: input.technicalMessage,
    requestId: input.requestId,
    fieldErrors: input.fieldErrors,
    errorCode: input.errorCode,
    retryAfterSeconds: input.retryAfterSeconds,
    details: input.details,
    raw: input.raw,
  });
}

export function normalizeHttpError({
  status,
  responseBody,
}: {
  status: number;
  responseBody: unknown;
}): NormalizedApiError {
  const errorCode = extractErrorCode(responseBody);
  const code = codeFromStatusAndBackendCode(status, errorCode);
  const isLifecycle = code === 'MAINTENANCE_MODE' || code === 'APP_UPDATE_REQUIRED';
  const backendMessage = extractBackendMessage(responseBody);
  const requestId = extractRequestId(responseBody);
  const fieldErrors =
    !isLifecycle && isRecord(responseBody) && 'errors' in responseBody
      ? toFieldErrors(responseBody.errors)
      : undefined;

  return {
    code,
    status,
    message: resolveUserMessage(code, backendMessage),
    technicalMessage: backendMessage,
    requestId,
    fieldErrors,
    errorCode,
    retryAfterSeconds: extractRetryAfter(responseBody),
    details: isLifecycle ? extractDetails(responseBody) : undefined,
    raw: responseBody,
  };
}

export function normalizeApiError(error: unknown): NormalizedApiError {
  if (isApiClientError(error)) {
    return {
      code: error.code,
      status: error.status,
      message: error.message,
      technicalMessage: error.technicalMessage,
      requestId: error.requestId,
      fieldErrors: error.fieldErrors,
      errorCode: error.errorCode,
      retryAfterSeconds: error.retryAfterSeconds,
      details: error.details,
      raw: error.raw,
    };
  }

  if (isAbortError(error)) {
    return {
      code: 'TIMEOUT',
      message: defaultMessageFor('TIMEOUT'),
      raw: error,
    };
  }

  if (error instanceof TypeError) {
    return {
      code: 'NETWORK_ERROR',
      message: defaultMessageFor('NETWORK_ERROR'),
      raw: error,
    };
  }

  if (isRecord(error) && typeof error.message === 'string') {
    logger.debug('Normalized unknown API error', {
      name: typeof error.name === 'string' ? error.name : 'UnknownError',
    });
  }

  return {
    code: 'UNKNOWN_ERROR',
    message: defaultMessageFor('UNKNOWN_ERROR'),
    raw: error,
  };
}

export function getApiErrorMessage(error: unknown): string {
  return normalizeApiError(error).message;
}
