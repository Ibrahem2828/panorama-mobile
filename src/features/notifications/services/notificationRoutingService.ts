import type { NotificationRouteIntent, NotificationTarget } from '../types';

const FUTURE_TARGET_LABELS: Record<string, string> = {
  announcement: 'إعلان',
};

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
