export type ApiSuccessResponse<TData> = {
  success: true;
  message?: string;
  data: TData;
};

export type ApiErrorResponse<TErrors = unknown> = {
  success: false;
  message?: string;
  errors?: TErrors;
  request_id?: string;
};

export type ApiResponse<TData, TErrors = unknown> =
  | ApiSuccessResponse<TData>
  | ApiErrorResponse<TErrors>;

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null;
}

export function isApiSuccess<TData>(
  response: ApiResponse<TData>,
): response is ApiSuccessResponse<TData> {
  return response.success;
}

export function isApiError<TErrors>(
  response: ApiResponse<unknown, TErrors>,
): response is ApiErrorResponse<TErrors> {
  return !response.success;
}

export function isApiResponseEnvelope(value: unknown): value is ApiResponse<unknown> {
  return isRecord(value) && typeof value.success === 'boolean';
}
