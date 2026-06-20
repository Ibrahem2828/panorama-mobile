import { logger } from '../utils/logger';

export type ApiErrorCode =
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'SERVER_ERROR'
  | 'UNKNOWN_ERROR';

export type FieldErrors = Record<string, string[]>;

export type NormalizedApiError = {
  code: ApiErrorCode;
  status?: number;
  message: string;
  technicalMessage?: string;
  requestId?: string;
  fieldErrors?: FieldErrors;
  raw?: unknown;
};

type UnknownRecord = Record<string, unknown>;

const defaultMessages: Record<ApiErrorCode, string> = {
  NETWORK_ERROR: 'تعذر الاتصال بالخادم. تحقق من اتصال الإنترنت.',
  TIMEOUT: 'استغرق الطلب وقتا أطول من المتوقع. حاول مرة أخرى.',
  UNAUTHORIZED: 'انتهت الجلسة أو تحتاج إلى تسجيل الدخول.',
  FORBIDDEN: 'لا تملك صلاحية تنفيذ هذا الإجراء.',
  NOT_FOUND: 'العنصر المطلوب غير موجود.',
  VALIDATION_ERROR: 'تعذر التحقق من البيانات المدخلة.',
  SERVER_ERROR: 'حدث خطأ في الخادم. حاول لاحقا.',
  UNKNOWN_ERROR: 'حدث خطأ غير متوقع. حاول مرة أخرى.',
};

export class ApiClientError extends Error implements NormalizedApiError {
  code: ApiErrorCode;
  status?: number;
  technicalMessage?: string;
  requestId?: string;
  fieldErrors?: FieldErrors;
  raw?: unknown;

  constructor(error: NormalizedApiError) {
    super(error.message);
    this.name = 'ApiClientError';
    this.code = error.code;
    this.status = error.status;
    this.technicalMessage = error.technicalMessage;
    this.requestId = error.requestId;
    this.fieldErrors = error.fieldErrors;
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
    return defaultMessages[code];
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
  raw?: unknown;
}): ApiClientError {
  const code = input.code ?? codeFromStatus(input.status);

  return new ApiClientError({
    code,
    status: input.status,
    message: input.message || defaultMessages[code],
    technicalMessage: input.technicalMessage,
    requestId: input.requestId,
    fieldErrors: input.fieldErrors,
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
  const code = codeFromStatus(status);
  const backendMessage = extractBackendMessage(responseBody);
  const requestId = extractRequestId(responseBody);
  const fieldErrors =
    isRecord(responseBody) && 'errors' in responseBody
      ? toFieldErrors(responseBody.errors)
      : undefined;

  return {
    code,
    status,
    message: resolveUserMessage(code, backendMessage),
    technicalMessage: backendMessage,
    requestId,
    fieldErrors,
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
      raw: error.raw,
    };
  }

  if (isAbortError(error)) {
    return {
      code: 'TIMEOUT',
      message: defaultMessages.TIMEOUT,
      raw: error,
    };
  }

  if (error instanceof TypeError) {
    return {
      code: 'NETWORK_ERROR',
      message: defaultMessages.NETWORK_ERROR,
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
    message: defaultMessages.UNKNOWN_ERROR,
    raw: error,
  };
}

export function getApiErrorMessage(error: unknown): string {
  return normalizeApiError(error).message;
}
