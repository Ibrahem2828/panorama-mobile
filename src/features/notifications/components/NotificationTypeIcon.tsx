import { Image, StyleSheet, View } from 'react-native';

import { images } from '../../../assets/images';
import { colors } from '../../../theme';
import type { NotificationType } from '../types';

type NotificationTypeIconProps = {
  type?: NotificationType;
};

function getNotificationImage(type?: NotificationType) {
  switch (type) {
    case 'verification':
      return images.notifications.verification;
    case 'printing':
      return images.notifications.printing;
    case 'support':
      return images.notifications.support;
    case 'group':
      return images.notifications.group;
    case 'announcement':
    case 'file':
    case 'system':
    default:
      return images.notifications.announcement;
  }
}

export function NotificationTypeIcon({ type }: NotificationTypeIconProps) {
  return (
    <View style={styles.container}>
      <Image
        accessibilityIgnoresInvertColors
        accessibilityLabel="أيقونة نوع الإشعار"
        resizeMode="contain"
        source={getNotificationImage(type)}
        style={styles.image}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: colors.background.muted,
  },
  image: {
    width: '80%',
    height: '80%',
  },
});
