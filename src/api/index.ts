export {
  getApiAuthBridge,
  isAuthExemptPath,
  refreshAccessTokenOnce,
  registerApiAuthBridge,
  shouldAttemptAuthRefresh,
} from './authBridge';
export { apiClient } from './client';
export { endpoints, API_PREFIX } from './endpoints';
export {
  ApiClientError,
  createApiError,
  getApiErrorMessage,
  normalizeApiError,
  normalizeHttpError,
} from './errors';
export { buildQueryString, toPaginationQuery } from './pagination';
export { buildApiUrl, buildDefaultApiUrl, buildRequestHeaders } from './request';
export { isApiError, isApiResponseEnvelope, isApiSuccess } from './response';
export * as academicService from './services/academic.service';
export * as announcementsService from './services/announcements.service';
export * as authService from './services/auth.service';
export * as filesService from './services/files.service';
export * as groupsService from './services/groups.service';
export * as healthService from './services/health.service';
export * as notificationsService from './services/notifications.service';
export * as printingService from './services/printing.service';
export * as supportService from './services/support.service';
export * as verificationService from './services/verification.service';
export type { ApiErrorCode, FieldErrors, NormalizedApiError } from './errors';
export type { HttpHeaders, HttpMethod, RequestContentType } from './http';
export type { PaginatedResult, PaginationParams } from './pagination';
export type { ApiQueryParams, ApiRequestOptions } from './request';
export type { ApiErrorResponse, ApiResponse, ApiSuccessResponse } from './response';
export type * from './types';
