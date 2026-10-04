import {
  normalizeApiError,
  notificationsService as apiNotificationsService,
  type NotificationRecord as ApiNotificationRecord,
  type PaginatedResult,
} from '../../../api';
import type { StatusVariant } from '../../../types/common';
import { resolveTargetFromData } from './notificationRoutingService';
import type {
  Id,
  NotificationRecord,
  NotificationTarget,
  NotificationType,
  RegisterDeviceTokenInput,
  UnreadCountResponse,
} from '../types';
import type { TranslationCatalog } from '../../../i18n';

type NotificationsCatalog = TranslationCatalog['notifications'];

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

export function getNotificationTitle(
  notification: NotificationRecord,
  t: NotificationsCatalog,
): string {
  return (
    toText(notification.title) ??
    toText(notification.subject) ??
    toText(getDataField(notification, 'title')) ??
    t.fallbackTitle
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

export function getNotificationTypeLabel(
  type: NotificationType | undefined,
  t: NotificationsCatalog,
): string {
  switch (type) {
    case 'announcement':
      return t.types.announcement;
    case 'verification':
      return t.types.verification;
    case 'printing':
      return t.types.printing;
    case 'group':
      return t.types.group;
    case 'file':
      return t.types.file;
    case 'support':
      return t.types.support;
    case 'system':
      return t.types.system;
    default:
      return t.types.fallback;
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
  const fromData = resolveTargetFromData(isRecord(notification.data) ? notification.data : null);
  if (fromData.targetType && fromData.targetId !== null) {
    return fromData;
  }

  const targetType =
    toNullableText(notification.related_object_type) ??
    toNullableText(notification.target_type) ??
    toNullableText(getDataField(notification, 'target_type')) ??
    toNullableText(getDataField(notification, 'targetType')) ??
    toNullableText(getDataField(notification, 'type')) ??
    toNullableText(notification.type);
  const targetId =
    toId(notification.related_object_id) ??
    toId(notification.target_id) ??
    toId(getDataField(notification, 'target_id')) ??
    toId(getDataField(notification, 'targetId')) ??
    toId(getDataField(notification, 'id'));

  return {
    targetType,
    targetId,
  };
}

export function getNotificationTargetTypeLabel(
  targetType: string | null | undefined,
  t: NotificationsCatalog,
): string | null {
  if (!targetType) {
    return null;
  }

  switch (targetType.trim().toLowerCase()) {
    case 'printing':
    case 'print_order':
      return t.targets.printOrder;
    case 'group':
      return t.targets.group;
    case 'file':
      return t.targets.file;
    case 'support':
    case 'support_ticket':
    case 'ticket':
      return t.targets.support;
    case 'verification':
      return t.targets.verification;
    case 'announcement':
      return t.targets.announcement;
    default:
      return targetType;
  }
}

export function toSafeNotificationsErrorMessage(error: unknown, t: NotificationsCatalog): string {
  const normalizedError = normalizeApiError(error);

  if (normalizedError.code === 'NETWORK_ERROR' || normalizedError.code === 'TIMEOUT') {
    return t.errors.network;
  }

  if (normalizedError.code === 'UNAUTHORIZED') {
    return t.errors.unauthorized;
  }

  if (normalizedError.code === 'FORBIDDEN') {
    return t.errors.permission;
  }

  return normalizedError.message || t.errors.generic;
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
