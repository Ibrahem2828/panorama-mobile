import type { Id, NotificationRouteIntent, NotificationTarget } from '../types';

const FUTURE_TARGET_LABELS: Record<string, string> = {
  announcement: 'إعلان',
};

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

export function resolveNotificationRouteIntent(
  target: NotificationTarget,
): NotificationRouteIntent {
  const targetType = normalizeTargetType(target.targetType);

  if (!targetType) {
    return { kind: 'none' };
  }

  if ((targetType === 'printing' || targetType === 'print_order') && target.targetId !== null) {
    return { kind: 'printingOrder', orderId: target.targetId };
  }

  if (targetType === 'group' && target.targetId !== null) {
    return { kind: 'group', groupId: target.targetId };
  }

  if (targetType === 'file' && target.targetId !== null) {
    return { kind: 'file', fileId: target.targetId };
  }

  if (
    (targetType === 'support' || targetType === 'support_ticket' || targetType === 'ticket') &&
    target.targetId !== null
  ) {
    return { kind: 'supportTicket', ticketId: target.targetId };
  }

  if (targetType === 'support' || targetType === 'support_ticket' || targetType === 'ticket') {
    return { kind: 'future', label: 'دعم' };
  }

  if (targetType === 'verification') {
    return { kind: 'verification' };
  }

  const futureLabel = FUTURE_TARGET_LABELS[targetType];

  if (futureLabel) {
    return { kind: 'future', label: futureLabel };
  }

  return { kind: 'none' };
}
