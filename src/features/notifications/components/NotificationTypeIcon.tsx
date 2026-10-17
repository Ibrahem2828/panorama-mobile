import { memo } from 'react';

import type { ArtworkTone, IconName } from '../../../components';
import { IconTile } from '../../../components';
import { useTranslation } from '../../../i18n';
import type { NotificationType } from '../types';

type NotificationTypeIconProps = {
  type?: NotificationType;
};

export function getNotificationVisual(type?: NotificationType): {
  icon: IconName;
  tone: ArtworkTone;
} {
  switch (type) {
    case 'verification':
      return { icon: 'shield', tone: 'success' };
    case 'printing':
      return { icon: 'printer', tone: 'info' };
    case 'support':
      return { icon: 'help', tone: 'warning' };
    case 'group':
      return { icon: 'users', tone: 'brand' };
    case 'file':
      return { icon: 'file', tone: 'brand' };
    case 'announcement':
    case 'system':
    default:
      return { icon: 'megaphone', tone: 'brand' };
  }
}

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
