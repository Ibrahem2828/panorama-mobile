import {
  normalizeApiError,
  notificationsService as apiNotificationsService,
  type NotificationRecord as ApiNotificationRecord,
  type PaginatedResult,
} from '../../../api';
import type { StatusVariant } from '../../../types/common';
import type {
  Id,
  NotificationRecord,
  NotificationTarget,
  NotificationType,
  RegisterDeviceTokenInput,
  UnreadCountResponse,
} from '../types';

const NETWORK_MESSAGE = 'تعذر تحميل الإشعارات. تحقق من اتصال الإنترنت وحاول مرة أخرى.';
const UNAUTHORIZED_MESSAGE = 'انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى.';
const PERMISSION_MESSAGE = 'لا تملك صلاحية الوصول إلى هذه الإشعارات حاليا.';
const GENERIC_MESSAGE = 'تعذر تحميل الإشعارات. حاول مرة أخرى.';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toText(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }

  if (typeof value === 'number') {
    return String(value);
  }

  return undefined;
}

function toNullableText(value: unknown): string | null {
  return toText(value) ?? null;
}

function toId(value: unknown): Id | null {
  if (typeof value === 'string' || typeof value === 'number') {
    return value;
  }

  return null;
}

function getDataField(notification: NotificationRecord, key: string): unknown {
  return notification.data && isRecord(notification.data) ? notification.data[key] : undefined;
}

function normalizeNotification(record: ApiNotificationRecord): NotificationRecord {
  return {
    ...record,
    id: record.id,
    title: toText(record.title),
    subject: toText(record.subject),
    message: toText(record.message),
    body: toText(record.body),
    type: toText(record.type),
    is_read: typeof record.is_read === 'boolean' ? record.is_read : undefined,
    read_at: toNullableText(record.read_at),
    readAt: toNullableText(record.readAt),
    target_type: toNullableText(record.target_type),
    target_id: toId(record.target_id),
    data: isRecord(record.data) ? record.data : null,
    created_at: toText(record.created_at),
    updated_at: toText(record.updated_at),
  };
}

function normalizeList(
  response: PaginatedResult<ApiNotificationRecord>,
): PaginatedResult<NotificationRecord> {
  return {
    ...response,
    results: response.results.map(normalizeNotification),
  };
}

export function getNotificationTitle(notification: NotificationRecord): string {
  return (
    toText(notification.title) ??
    toText(notification.subject) ??
    toText(getDataField(notification, 'title')) ??
    'إشعار جديد'
  );
}

export function getNotificationBody(notification: NotificationRecord): string | null {
  return (
    toText(notification.message) ??
    toText(notification.body) ??
    toText(getDataField(notification, 'message')) ??
    toText(getDataField(notification, 'body')) ??
    null
  );
}

export function getNotificationTypeLabel(type?: NotificationType): string {
  switch (type) {
    case 'announcement':
      return 'إعلان';
    case 'verification':
      return 'توثيق';
    case 'printing':
      return 'طباعة';
    case 'group':
      return 'غروب';
    case 'file':
      return 'ملف';
    case 'support':
      return 'دعم';
    case 'system':
      return 'نظام';
    default:
      return 'إشعار';
  }
}

export function getNotificationTypeVariant(type?: NotificationType): StatusVariant {
  switch (type) {
    case 'announcement':
      return 'info';
    case 'verification':
      return 'warning';
    case 'printing':
      return 'brand';
    case 'group':
      return 'success';
    case 'file':
      return 'neutral';
    case 'support':
      return 'error';
    case 'system':
      return 'neutral';
    default:
      return 'neutral';
  }
}

export function isNotificationUnread(notification: NotificationRecord): boolean {
  if (typeof notification.is_read === 'boolean') {
    return !notification.is_read;
  }

  return !notification.read_at && !notification.readAt;
}

export function getNotificationTarget(notification: NotificationRecord): NotificationTarget {
  const targetType =
    toNullableText(notification.target_type) ??
    toNullableText(getDataField(notification, 'target_type')) ??
    toNullableText(getDataField(notification, 'targetType')) ??
    toNullableText(getDataField(notification, 'type'));
  const targetId =
    toId(notification.target_id) ??
    toId(getDataField(notification, 'target_id')) ??
    toId(getDataField(notification, 'targetId')) ??
    toId(getDataField(notification, 'id'));

  return {
    targetType,
    targetId,
  };
}

export function getNotificationTargetTypeLabel(targetType?: string | null): string | null {
  if (!targetType) {
    return null;
  }

  switch (targetType.trim().toLowerCase()) {
    case 'printing':
    case 'print_order':
      return 'طلب طباعة';
    case 'group':
      return 'غروب';
    case 'file':
      return 'ملف';
    case 'support':
    case 'support_ticket':
    case 'ticket':
      return 'دعم فني';
    case 'verification':
      return 'توثيق';
    case 'announcement':
      return 'إعلان';
    default:
      return targetType;
  }
}

export function formatNotificationDate(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleString('ar-SY');
}

export function toSafeNotificationsErrorMessage(error: unknown): string {
  const normalizedError = normalizeApiError(error);

  if (normalizedError.code === 'NETWORK_ERROR' || normalizedError.code === 'TIMEOUT') {
    return NETWORK_MESSAGE;
  }

  if (normalizedError.code === 'UNAUTHORIZED') {
    return UNAUTHORIZED_MESSAGE;
  }

  if (normalizedError.code === 'FORBIDDEN') {
    return PERMISSION_MESSAGE;
  }

  return normalizedError.message || GENERIC_MESSAGE;
}

export async function loadNotifications(
  authToken: string,
): Promise<PaginatedResult<NotificationRecord>> {
  return normalizeList(await apiNotificationsService.listNotifications(authToken));
}

export async function loadUnreadCount(authToken: string): Promise<UnreadCountResponse> {
  const response = await apiNotificationsService.getUnreadCount(authToken);

  return {
    count: typeof response.count === 'number' ? response.count : 0,
  };
}

export async function markNotificationRead(notificationId: Id, authToken: string): Promise<void> {
  await apiNotificationsService.markNotificationRead(notificationId, authToken);
}

export async function markAllNotificationsRead(authToken: string): Promise<void> {
  await apiNotificationsService.markAllNotificationsRead(authToken);
}

export async function registerDeviceToken(
  input: RegisterDeviceTokenInput,
  authToken: string,
): Promise<unknown> {
  return apiNotificationsService.registerDeviceToken(input, authToken);
}

export async function deleteDeviceToken(tokenId: Id, authToken: string): Promise<unknown> {
  return apiNotificationsService.deleteDeviceToken(tokenId, authToken);
}
