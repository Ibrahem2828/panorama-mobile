import { apiClient } from '../client';
import { endpoints } from '../endpoints';
import type {
  ApiListParams,
  NotificationPreferences,
  NotificationRecord,
  RegisterDeviceTokenRequest,
  UnreadCountResponse,
} from '../types';
import type { PaginatedResult } from '../pagination';
import { toPaginationQuery } from '../pagination';

export function listNotifications(
  authToken: string,
  params?: ApiListParams,
): Promise<PaginatedResult<NotificationRecord>> {
  return apiClient.get<PaginatedResult<NotificationRecord>>(endpoints.notifications.list, {
    authToken,
    query: toPaginationQuery(params),
  });
}

export function getNotificationPreferences(authToken: string): Promise<NotificationPreferences> {
  return apiClient.get<NotificationPreferences>(endpoints.notifications.preferences, {
    authToken,
  });
}

export function updateNotificationPreferences(
  patch: Partial<NotificationPreferences>,
  authToken: string,
): Promise<NotificationPreferences> {
  return apiClient.patch<NotificationPreferences, Partial<NotificationPreferences>>(
    endpoints.notifications.preferences,
    patch,
    { authToken },
  );
}

export function getUnreadCount(authToken: string): Promise<UnreadCountResponse> {
  return apiClient.get<UnreadCountResponse>(endpoints.notifications.unreadCount, {
    authToken,
  });
}

export function markNotificationRead(
  notificationId: string | number,
  authToken: string,
): Promise<unknown> {
  return apiClient.post<unknown, Record<string, never>>(
    endpoints.notifications.markRead(notificationId),
    {},
    { authToken },
  );
}

export function markAllNotificationsRead(authToken: string): Promise<unknown> {
  return apiClient.post<unknown, Record<string, never>>(
    endpoints.notifications.readAll,
    {},
    { authToken },
  );
}

export function registerDeviceToken(
  input: RegisterDeviceTokenRequest,
  authToken: string,
): Promise<unknown> {
  return apiClient.post<unknown, RegisterDeviceTokenRequest>(
    endpoints.notifications.deviceTokens,
    input,
    { authToken },
  );
}

export function deleteDeviceToken(tokenId: string | number, authToken: string): Promise<unknown> {
  return apiClient.delete<unknown>(endpoints.notifications.deviceTokenDetail(tokenId), {
    authToken,
  });
}
