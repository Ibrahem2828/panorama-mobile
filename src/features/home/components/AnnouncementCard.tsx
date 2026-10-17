import { memo, useCallback } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppBadge, AppText, IconTile } from '../../../components';
import { useTranslation } from '../../../i18n';
import { colors, opacity, radius, spacing } from '../../../theme';
import { formatDate } from '../../../utils/formatDateTime';
import { getAnnouncementIcon, isFreshAnnouncement } from '../services/homePresentation';
import type { Announcement } from '../types';

type AnnouncementCardProps = {
  announcement: Announcement;
  onPress?: (id: Announcement['id']) => void;
};

function getAnnouncementBody(announcement: Announcement, noDetails: string): string {
  return announcement.description?.trim() || announcement.body?.trim() || noDetails;
}

function AnnouncementCardComponent({ announcement, onPress }: AnnouncementCardProps) {
  const { t, locale } = useTranslation();
  const title = announcement.title?.trim() || t.home.announcements.untitled;
  const dateText = formatDate(
    announcement.start_date ?? announcement.created_at ?? announcement.updated_at,
    locale,
    { day: 'numeric', month: 'short', year: 'numeric' },
  );
  const isNew = isFreshAnnouncement(announcement);
  const handlePress = useCallback(() => onPress?.(announcement.id), [announcement.id, onPress]);

  return (
    <Pressable
      accessibilityLabel={t.announcements.openDetails(title)}
      accessibilityRole="button"
      android_ripple={{ color: 'rgba(16, 24, 40, 0.08)' }}
      disabled={!onPress}
      onPress={handlePress}
      style={({ pressed }) => [styles.card, pressed ? styles.pressed : null]}
    >
      <IconTile icon={getAnnouncementIcon(announcement.type)} />
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <AppText numberOfLines={2} style={styles.title} variant="title">
            {title}
          </AppText>
          {isNew ? <AppBadge label={t.announcements.newBadge} variant="brand" /> : null}
        </View>
        <AppText color="secondary" numberOfLines={3} variant="bodySmall">
          {getAnnouncementBody(announcement, t.home.announcements.noDetails)}
        </AppText>
        {dateText ? (
          <AppText color="muted" variant="caption">
            {dateText}
          </AppText>
        ) : null}
      </View>
    </Pressable>
  );
}

export const AnnouncementCard = memo(AnnouncementCardComponent);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.card.md,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.gray[200],
    backgroundColor: colors.background.surface,
    overflow: 'hidden',
  },
  pressed: { opacity: opacity.pressed },
  body: { flex: 1, minWidth: 0, gap: spacing.xs },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  title: { flex: 1, minWidth: 0 },
});
