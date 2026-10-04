import { StyleSheet, View } from 'react-native';

import { AppBadge, AppCard, AppText, Stack } from '../../../components';
import { useTranslation } from '../../../i18n';
import { colors, spacing } from '../../../theme';
import { formatDate } from '../../../utils/formatDateTime';
import type { Announcement } from '../types';

type AnnouncementCardProps = {
  announcement: Announcement;
};

function getAnnouncementTitle(announcement: Announcement, fallback: string): string {
  return announcement.title?.trim() || fallback;
}

function getAnnouncementBody(announcement: Announcement, noDetails: string): string {
  return announcement.description?.trim() || announcement.body?.trim() || noDetails;
}

export function AnnouncementCard({ announcement }: AnnouncementCardProps) {
  const { t, locale } = useTranslation();
  const dateText = formatDate(
    announcement.start_date ?? announcement.created_at ?? announcement.updated_at,
    locale,
    { day: 'numeric', month: 'short', year: 'numeric' },
  );

  return (
    <AppCard padding="md" variant="default">
      <Stack gap="md">
        <View style={styles.header}>
          <AppText style={styles.title} variant="title">
            {getAnnouncementTitle(announcement, t.home.announcements.untitled)}
          </AppText>
          {announcement.type ? <AppBadge label={announcement.type} variant="info" /> : null}
        </View>

        <AppText color="secondary" variant="bodySmall">
          {getAnnouncementBody(announcement, t.home.announcements.noDetails)}
        </AppText>

        {dateText ? (
          <AppText color="muted" variant="caption">
            {dateText}
          </AppText>
        ) : null}
      </Stack>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.default,
  },
  title: {
    flex: 1,
    minWidth: 0,
  },
});
