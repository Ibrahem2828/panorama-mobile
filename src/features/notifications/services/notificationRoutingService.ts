import type { Id, NotificationRouteIntent, NotificationTarget } from '../types';

/**
 * Identifier keys the backend actually puts in a notification's `data` payload, mapped to
 * the target type they imply. The API also exposes `related_object_type`/`related_object_id`,
 * but no producer populates them yet, so these keys are the only reliable target today.
 */
const DATA_TARGET_KEYS: ReadonlyArray<readonly [string, string]> = [
  ['print_order_id', 'printing'],
  ['support_ticket_id', 'support'],
  ['group_id', 'group'],
  ['file_id', 'file'],
  ['announcement_id', 'announcement'],
  ['verification_request_id', 'verification'],
];

function toTargetId(value: unknown): Id | null {
  return typeof value === 'string' || typeof value === 'number' ? value : null;
}

export function resolveTargetFromData(
  data: Record<string, unknown> | null | undefined,
): NotificationTarget {
  if (!data) {
    return { targetType: null, targetId: null };
  }

  for (const [key, targetType] of DATA_TARGET_KEYS) {
    const targetId = toTargetId(data[key]);
    if (targetId !== null) {
      return { targetType, targetId };
    }
  }

  return { targetType: null, targetId: null };
}

function normalizeTargetType(targetType: string | null): string | null {
  return targetType?.trim().toLowerCase() || null;
}

/** Ids come from the server but end up in navigation params: keep only plain numeric ids. */
function safeId(id: Id | null): Id | null {
  if (id === null) {
    return null;
  }

  const text = String(id).trim();

  return /^\d{1,12}$/u.test(text) ? (typeof id === 'string' ? text : id) : null;
}

export function resolveNotificationRouteIntent(
  target: NotificationTarget,
): NotificationRouteIntent {
  const targetType = normalizeTargetType(target.targetType);
  const id = safeId(target.targetId);

  if (!targetType) {
    return { kind: 'none' };
  }

  if ((targetType === 'printing' || targetType === 'print_order') && id !== null) {
    return { kind: 'printingOrder', orderId: id };
  }

  if (targetType === 'group' && id !== null) {
    return { kind: 'group', groupId: id };
  }

  if (targetType === 'file' && id !== null) {
    return { kind: 'file', fileId: id };
  }

  if (targetType === 'support' || targetType === 'support_ticket' || targetType === 'ticket') {
    return id !== null ? { kind: 'supportTicket', ticketId: id } : { kind: 'supportList' };
  }

  if (targetType === 'announcement') {
    return id !== null ? { kind: 'announcement', announcementId: id } : { kind: 'announcements' };
  }

  if (targetType === 'verification') {
    return { kind: 'verification' };
  }

  return { kind: 'none' };
}
