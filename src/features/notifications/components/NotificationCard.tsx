import { useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';

import { AppBadge, AppCard, AppText, Stack } from '../../../components';
import { colors, opacity, spacing } from '../../../theme';
import { createPressScaleAnim } from '../../../utils/motion';
import { useTranslation } from '../../../i18n';
import { formatRelativeDate } from '../../../utils/formatRelativeDate';
import {
  getNotificationBody,
  getNotificationTarget,
  getNotificationTitle,
  isNotificationUnread,
} from '../services';
import type { NotificationRecord } from '../types';
import { NotificationMetaRow } from './NotificationMetaRow';
import { NotificationStatusBadge } from './NotificationStatusBadge';
import { NotificationTypeIcon } from './NotificationTypeIcon';

type NotificationCardProps = {
  notification: NotificationRecord;
  onPress?: () => void;
};

export function NotificationCard({ notification, onPress }: NotificationCardProps) {
  const { t, locale } = useTranslation();
  const title = getNotificationTitle(notification, t.notifications);
  const body = getNotificationBody(notification);
  const unread = isNotificationUnread(notification);
  const target = getNotificationTarget(notification);
  const date = formatRelativeDate(
    notification.created_at ?? notification.updated_at,
    t.relativeTime,
    locale,
  );

  const { scale, onPressIn, onPressOut } = useRef(createPressScaleAnim()).current;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={!onPress}
      onPress={onPress}
      onPressIn={onPress ? onPressIn : undefined}
      onPressOut={onPress ? onPressOut : undefined}
      style={({ pressed }) => [pressed && onPress ? styles.pressed : null]}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <AppCard
          style={unread ? styles.unreadCard : null}
          variant={unread ? 'outlined' : 'default'}
        >
          <Stack gap="md">
            <Stack direction="horizontal" gap="md" style={styles.header}>
              <NotificationTypeIcon type={notification.type} />
              <View style={[styles.unreadDot, unread ? styles.unreadDotActive : null]} />
              <Stack gap="xs" style={styles.titleBlock}>
                <AppText numberOfLines={2} variant="title">
                  {title}
                </AppText>
                {body ? (
                  <AppText color="secondary" numberOfLines={3} variant="bodySmall">
                    {body}
                  </AppText>
                ) : (
                  <AppText color="muted" variant="bodySmall">
                    {t.notifications.noDetails}
                  </AppText>
                )}
              </Stack>
              <NotificationStatusBadge type={notification.type} />
            </Stack>

            <Stack direction="horizontal" gap="sm" wrap>
              <AppBadge
                label={unread ? t.notifications.unread : t.notifications.read}
                variant={unread ? 'warning' : 'neutral'}
              />
              {date ? <AppBadge label={date} variant="info" /> : null}
            </Stack>

            <NotificationMetaRow label={t.notifications.targetLabel} value={target.targetType} />
          </Stack>
        </AppCard>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: opacity.pressed,
  },
  unreadCard: {
    borderColor: colors.brand.primary,
  },
  header: {
    alignItems: 'flex-start',
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
  },
  unreadDot: {
    width: 10,
    height: 10,
    marginTop: spacing.sm,
    borderRadius: 5,
    backgroundColor: colors.border.strong,
  },
  unreadDotActive: {
    backgroundColor: colors.brand.primary,
  },
});
