import { apiClient } from '../client';
import { endpoints } from '../endpoints';
import type {
  ApiListParams,
  EmptyResponse,
  NotificationRecord,
  RegisterDeviceTokenRequest,
  UnreadCount,
} from '../types';
import type { PaginatedResult } from '../pagination';
import { toPaginationQuery } from '../pagination';

export function listNotifications(params?: ApiListParams, authToken?: string | null) {
  return apiClient.get<PaginatedResult<NotificationRecord>>(endpoints.notifications.list, {
    authToken,
    query: toPaginationQuery(params),
  });
}

export function getUnreadCount(authToken?: string | null) {
  return apiClient.get<UnreadCount>(endpoints.notifications.unreadCount, {
    authToken,
  });
}

export function markNotificationRead(notificationId: string | number, authToken?: string | null) {
  return apiClient.post<EmptyResponse, EmptyResponse>(
    endpoints.notifications.markRead(notificationId),
    {},
    { authToken },
  );
}

export function markAllNotificationsRead(authToken?: string | null) {
  return apiClient.post<EmptyResponse, EmptyResponse>(
    endpoints.notifications.readAll,
    {},
    { authToken },
  );
}

export function registerDeviceToken(
  request: RegisterDeviceTokenRequest,
  authToken?: string | null,
) {
  return apiClient.post<EmptyResponse, RegisterDeviceTokenRequest>(
    endpoints.notifications.deviceTokens,
    request,
    { authToken },
  );
}
