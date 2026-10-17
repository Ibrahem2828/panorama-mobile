import { useEffect } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as WebBrowser from 'expo-web-browser';
import { Image, StyleSheet } from 'react-native';

import {
  AppBadge,
  AppButton,
  AppCard,
  AppHeader,
  AppScreen,
  AppText,
  EmptyState,
  ErrorState,
  LoadingState,
  Stack,
} from '../../../components';
import { useTranslation } from '../../../i18n';
import type { HomeStackParamList } from '../../../navigation/types';
import { radius, spacing } from '../../../theme';
import { formatDate } from '../../../utils/formatDateTime';
import { getAnnouncementDate, getAudienceKey } from '../services';
import { useAnnouncementsStore } from '../store';
import type { AcademicTargetKey, AudienceKey } from '../types';

type Props = NativeStackScreenProps<HomeStackParamList, 'AnnouncementDetail'>;

const IMAGE_HEIGHT = 200;

export function AnnouncementDetailScreen({ route }: Props) {
  const { t, locale } = useTranslation();
  const { announcementId } = route.params;
  const key = String(announcementId);
  const detail = useAnnouncementsStore((state) => state.details[key]);
  const listed = useAnnouncementsStore((state) =>
    state.items.find((entry) => String(entry.id) === key),
  );
  const status = useAnnouncementsStore((state) => state.detailStatus[key]);
  const errorMessage = useAnnouncementsStore((state) => state.detailError[key]);
  const loadDetail = useAnnouncementsStore((state) => state.loadDetail);
  const markRead = useAnnouncementsStore((state) => state.markRead);
  const hydrateReadIds = useAnnouncementsStore((state) => state.hydrateReadIds);
  const announcement = detail ?? listed;

  useEffect(() => {
    void hydrateReadIds();
    markRead(announcementId);
    void loadDetail(announcementId);
  }, [announcementId, hydrateReadIds, loadDetail, markRead]);

  const header = (
    <Stack gap="md">
      <AppHeader title={announcement?.title ?? t.announcements.detailTitle} />
    </Stack>
  );

  if (!announcement && status === 'missing') {
    return (
      <AppScreen contentContainerStyle={styles.content} scroll>
        {header}
        <EmptyState
          message={t.announcements.notFoundMessage}
          title={t.announcements.notFoundTitle}
        />
      </AppScreen>
    );
  }

  if (!announcement && status === 'error') {
    return (
      <AppScreen contentContainerStyle={styles.content} scroll>
        {header}
        <ErrorState message={errorMessage} onRetry={() => void loadDetail(announcementId)} />
      </AppScreen>
    );
  }

  if (!announcement) {
    return (
      <AppScreen contentContainerStyle={styles.content} scroll>
        {header}
        <LoadingState message={t.announcements.loading} />
      </AppScreen>
    );
  }

  const audienceLabels: Record<AudienceKey, string> = {
    all: t.announcements.audienceAll,
    students: t.announcements.audienceStudents,
    verified: t.announcements.audienceVerified,
    normal: t.announcements.audienceNormal,
    admins: t.announcements.audienceAdmins,
    custom: t.announcements.audienceCustom,
  };
  const targetLabels: Record<AcademicTargetKey, string> = {
    university: t.announcements.targetUniversity,
    faculty: t.announcements.targetFaculty,
    major: t.announcements.targetMajor,
    year: t.announcements.targetYear,
    semester: t.announcements.targetSemester,
  };
  const dateOptions = { day: 'numeric', month: 'long', year: 'numeric' } as const;
  const rows = [
    {
      label: t.announcements.publishedAt,
      value: formatDate(getAnnouncementDate(announcement), locale, dateOptions),
    },
    {
      label: t.announcements.validUntil,
      value: formatDate(announcement.endsAt, locale, dateOptions),
    },
    {
      label: t.announcements.audience,
      value: audienceLabels[getAudienceKey(announcement.targetUserType)],
    },
    { label: t.announcements.createdBy, value: announcement.createdByName },
  ].filter((row): row is { label: string; value: string } => Boolean(row.value));
  const linkUrl = announcement.linkUrl;

  return (
    <AppScreen contentContainerStyle={styles.content} scroll>
      {header}

      <AppCard padding="none" variant="default">
        {announcement.imageUrl ? (
          <Image
            accessibilityIgnoresInvertColors
            accessibilityLabel={t.announcements.imageAlt}
            resizeMode="cover"
            source={{ uri: announcement.imageUrl }}
            style={styles.image}
          />
        ) : null}
        <Stack gap="md" style={styles.cardBody}>
          <AppText variant="bodySmall">{announcement.body ?? t.announcements.noDetails}</AppText>
          {linkUrl ? (
            <AppButton
              onPress={() => void WebBrowser.openBrowserAsync(linkUrl)}
              title={t.announcements.openLink}
              variant="outline"
            />
          ) : null}
        </Stack>
      </AppCard>

      <AppCard variant="muted">
        <Stack gap="md">
          {rows.map((row) => (
            <Stack direction="horizontal" gap="md" justify="space-between" key={row.label}>
              <AppText color="muted" variant="caption">
                {row.label}
              </AppText>
              <AppText style={styles.rowValue} variant="bodySmall" weight="600">
                {row.value}
              </AppText>
            </Stack>
          ))}
          {announcement.academicTargets.length > 0 ? (
            <Stack gap="xs">
              <AppText color="muted" variant="caption">
                {t.announcements.targetsTitle}
              </AppText>
              <Stack direction="horizontal" gap="sm" wrap>
                {announcement.academicTargets.map((target) => (
                  <AppBadge key={target} label={targetLabels[target]} variant="info" />
                ))}
              </Stack>
            </Stack>
          ) : null}
        </Stack>
      </AppCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.xl },
  image: {
    width: '100%',
    height: IMAGE_HEIGHT,
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
  },
  cardBody: { padding: spacing.card.md },
  rowValue: { flexShrink: 1 },
});
