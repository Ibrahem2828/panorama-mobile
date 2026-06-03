import { StyleSheet, View } from 'react-native';

import { AppBadge, AppCard, AppText, Stack } from '../../../components';
import { colors, spacing } from '../../../theme';
import type { Announcement } from '../types';

type AnnouncementCardProps = {
  announcement: Announcement;
};

function getAnnouncementTitle(announcement: Announcement): string {
  return announcement.title?.trim() || 'إعلان';
}

function getAnnouncementBody(announcement: Announcement): string {
  return (
    announcement.description?.trim() ||
    announcement.body?.trim() ||
    'لا توجد تفاصيل إضافية لهذا الإعلان.'
  );
}

function formatAnnouncementDate(value?: string): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleDateString('ar-SY', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function AnnouncementCard({ announcement }: AnnouncementCardProps) {
  const dateText = formatAnnouncementDate(
    announcement.start_date ?? announcement.created_at ?? announcement.updated_at,
  );

  return (
    <AppCard padding="md" variant="default">
      <Stack gap="md">
        <View style={styles.header}>
          <AppText style={styles.title} variant="title">
            {getAnnouncementTitle(announcement)}
          </AppText>
          {announcement.type ? <AppBadge label={announcement.type} variant="info" /> : null}
        </View>

        <AppText color="secondary" variant="bodySmall">
          {getAnnouncementBody(announcement)}
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
