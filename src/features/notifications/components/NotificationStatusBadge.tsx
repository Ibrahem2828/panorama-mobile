import { AppBadge } from '../../../components';
import { useTranslation } from '../../../i18n';
import { getNotificationTypeLabel, getNotificationTypeVariant } from '../services';
import type { NotificationType } from '../types';

type NotificationStatusBadgeProps = {
  type?: NotificationType;
};

export function NotificationStatusBadge({ type }: NotificationStatusBadgeProps) {
  const { t } = useTranslation();

  return (
    <AppBadge
      label={getNotificationTypeLabel(type, t.notifications)}
      variant={getNotificationTypeVariant(type)}
    />
  );
}
