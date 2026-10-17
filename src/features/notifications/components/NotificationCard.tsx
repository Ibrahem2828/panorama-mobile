import { memo, useCallback } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppBadge, AppCard, AppText, Stack } from '../../../components';
import { useTranslation } from '../../../i18n';
import { colors, opacity, radius, spacing, useBrand } from '../../../theme';
import { formatRelativeDate } from '../../../utils/formatRelativeDate';
import {
  getNotificationBody,
  getNotificationTitle,
  isNotificationExpired,
  isNotificationUnread,
} from '../services';
import type { NotificationRecord } from '../types';
import { NotificationStatusBadge } from './NotificationStatusBadge';
import { NotificationTypeIcon } from './NotificationTypeIcon';

type NotificationCardProps = {
  notification: NotificationRecord;
  onPress: (notification: NotificationRecord) => void;
};

const DOT_SIZE = 10;

function NotificationCardComponent({ notification, onPress }: NotificationCardProps) {
  const { t, locale } = useTranslation();
  const brand = useBrand();
  const title = getNotificationTitle(notification, t.notifications, locale);
  const body = getNotificationBody(notification, locale);
  const unread = isNotificationUnread(notification);
  const expired = isNotificationExpired(notification);
  const date = formatRelativeDate(
    notification.created_at ?? notification.updated_at,
    t.relativeTime,
    locale,
  );
  const handlePress = useCallback(() => onPress(notification), [notification, onPress]);

  return (
    <Pressable
      accessibilityLabel={`${unread ? `${t.notifications.unread}. ` : ''}${title}`}
      accessibilityRole="button"
      onPress={handlePress}
      style={({ pressed }) => [expired ? styles.expired : null, pressed ? styles.pressed : null]}
    >
      <AppCard
        style={unread ? { borderColor: brand.primary, borderWidth: 1.5 } : undefined}
        variant="default"
      >
        <Stack gap="md">
          <Stack direction="horizontal" gap="md" style={styles.header}>
            <NotificationTypeIcon type={notification.type} />
            <View
              style={[
                styles.dot,
                { backgroundColor: unread ? brand.primary : colors.border.strong },
              ]}
            />
            <Stack gap="xs" style={styles.titleBlock}>
              <AppText numberOfLines={2} variant="title" weight={unread ? '700' : '600'}>
                {title}
              </AppText>
              <AppText color={body ? 'secondary' : 'muted'} numberOfLines={3} variant="bodySmall">
                {body ?? t.notifications.noDetails}
              </AppText>
            </Stack>
            <NotificationStatusBadge type={notification.type} />
          </Stack>

          <Stack direction="horizontal" gap="sm" wrap>
            <AppBadge
              label={unread ? t.notifications.unread : t.notifications.read}
              variant={unread ? 'warning' : 'neutral'}
            />
            {expired ? <AppBadge label={t.notifications.expired} variant="error" /> : null}
            {date ? <AppBadge label={date} variant="info" /> : null}
          </Stack>
        </Stack>
      </AppCard>
    </Pressable>
  );
}

export const NotificationCard = memo(NotificationCardComponent);

const styles = StyleSheet.create({
  pressed: { opacity: opacity.pressed },
  expired: { opacity: 0.7 },
  header: { alignItems: 'flex-start' },
  titleBlock: { flex: 1, minWidth: 0 },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    marginTop: spacing.sm,
    borderRadius: radius.full,
  },
});
