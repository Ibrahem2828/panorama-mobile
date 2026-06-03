import { apiClient } from '../client';
import { endpoints } from '../endpoints';
import type { NotificationRecord, RegisterDeviceTokenRequest, UnreadCountResponse } from '../types';
import type { PaginatedResult } from '../pagination';

export function listNotifications(authToken: string): Promise<PaginatedResult<NotificationRecord>> {
  return apiClient.get<PaginatedResult<NotificationRecord>>(endpoints.notifications.list, {
    authToken,
  });
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
