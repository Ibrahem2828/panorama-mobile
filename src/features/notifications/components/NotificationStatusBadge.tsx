import { AppBadge } from '../../../components';
import { getNotificationTypeLabel, getNotificationTypeVariant } from '../services';
import type { NotificationType } from '../types';

type NotificationStatusBadgeProps = {
  type?: NotificationType;
};

export function NotificationStatusBadge({ type }: NotificationStatusBadgeProps) {
  return (
    <AppBadge label={getNotificationTypeLabel(type)} variant={getNotificationTypeVariant(type)} />
  );
}
