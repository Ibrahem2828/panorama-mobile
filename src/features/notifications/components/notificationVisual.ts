import type { ArtworkTone, IconName } from '../../../components';
import type { NotificationType } from '../types';

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
