import { memo } from 'react';

import { IconTile } from '../../../components';
import { useTranslation } from '../../../i18n';
import type { NotificationType } from '../types';
import { getNotificationVisual } from './notificationVisual';

type NotificationTypeIconProps = {
  type?: NotificationType;
};

function NotificationTypeIconComponent({ type }: NotificationTypeIconProps) {
  const { t } = useTranslation();
  const visual = getNotificationVisual(type);
  return (
    <IconTile
      accessibilityLabel={t.notifications.typeIconAlt}
      icon={visual.icon}
      tone={visual.tone}
    />
  );
}

export const NotificationTypeIcon = memo(NotificationTypeIconComponent);
