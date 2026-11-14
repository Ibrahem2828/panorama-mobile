import { useCallback, useMemo } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Alert, StyleSheet, View } from 'react-native';

import {
  AppBadge,
  AppButton,
  AppCard,
  AppHeader,
  AppScreen,
  AppText,
  Chip,
  EmptyState,
  Icon,
  Stack,
} from '../../../components';
import { useTranslation } from '../../../i18n';
import { LecturesRoutes } from '../../../navigation/routes';
import type { ProfileStackParamList } from '../../../navigation/types';
import { useNetworkStore } from '../../../offline/networkStore';
import { radius, spacing, useBrand } from '../../../theme';
import { formatDate } from '../../../utils/formatDateTime';
import { formatBytes, percentOf } from './formatBytes';
import { deriveItemState, usedBytes, type OfflineEntry } from './licenseLogic';
import {
  cancelDownload,
  deleteAllDownloads,
  deleteDownload,
  dismissNotices,
  renewLecture,
  setBudget,
  useOfflineLibrary,
} from './offlineLibrary';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Downloads'>;

const MB = 1024 * 1024;
const BUDGET_OPTIONS = [500 * MB, 1024 * MB, 1536 * MB, 3072 * MB] as const;

/** The student's downloaded lectures: what is stored, how much space it takes, when each copy expires, delete one or all. */
export function DownloadsScreen({ navigation }: Props) {
  const { t, locale } = useTranslation();
  const brand = useBrand();
  const copy = t.offlineLectures;
  const isOnline = useNetworkStore((state) => state.isOnline);
  const entries = useOfflineLibrary((library) => library.entries);
  const transfers = useOfflineLibrary((library) => library.transfers);
  const guard = useOfflineLibrary((library) => library.guard);
  const budget = useOfflineLibrary((library) => library.budgetBytes);
  const notices = useOfflineLibrary((library) => library.notices);
  const rows = useMemo(
    () =>
      Object.values(entries).sort(
        (a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0) || b.lectureId - a.lectureId,
      ),
    [entries],
  );
  const used = usedBytes(rows);

  const open = useCallback(
    (entry: OfflineEntry) =>
      navigation.navigate(LecturesRoutes.LectureViewer, {
        lectureId: entry.lectureId,
        title: entry.title,
        offline: true,
      }),
    [navigation],
  );

  const confirmDelete = useCallback(
    (entry: OfflineEntry) => {
      Alert.alert(copy.deleteTitle, copy.deleteMessage, [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: copy.delete,
          style: 'destructive',
          onPress: () => void deleteDownload(entry.lectureId),
        },
      ]);
    },
    [copy, t.common.cancel],
  );

  const confirmDeleteAll = useCallback(() => {
    Alert.alert(copy.screen.deleteAllTitle, copy.screen.deleteAllMessage, [
      { text: t.common.cancel, style: 'cancel' },
      {
        text: copy.screen.deleteAll,
        style: 'destructive',
        onPress: () => void deleteAllDownloads(),
      },
    ]);
  }, [copy, t.common.cancel]);

  const stateLabel = (
    entry: OfflineEntry,
  ): { label: string; tone: 'success' | 'warning' | 'info' } => {
    const state = deriveItemState(
      entry,
      transfers[String(entry.lectureId)] ?? { kind: 'idle' },
      Date.now(),
      guard,
    );

    switch (state.kind) {
      case 'ready':
        return { label: copy.screen.stateReady, tone: 'success' };
      case 'expired':
        return { label: copy.screen.stateExpired, tone: 'warning' };
      case 'clockRollback':
        return { label: copy.screen.stateClock, tone: 'warning' };
      case 'downloading':
      case 'verifying':
      case 'renewing':
        return { label: copy.screen.stateDownloading, tone: 'info' };
      default:
        return { label: copy.screen.statePartial, tone: 'info' };
    }
  };

  return (
    <AppScreen contentContainerStyle={styles.content} scroll>
      <AppHeader showBack subtitle={copy.subtitle} title={copy.title} />

      {notices.map((notice) => (
        <AppCard key={`${notice.lectureId}-${notice.reason}`} padding="md">
          <Stack gap="sm">
            <AppText variant="bodySmall">
              {notice.reason === 'corrupt'
                ? copy.screen.removedCorrupt(notice.title)
                : copy.screen.removedRevoked(notice.title)}
            </AppText>
            <AppButton
              onPress={dismissNotices}
              size="sm"
              title={copy.screen.dismiss}
              variant="ghost"
            />
          </Stack>
        </AppCard>
      ))}

      {!isOnline ? (
        <AppText color="warning" variant="bodySmall">
          {copy.screen.offlineNow}
        </AppText>
      ) : null}

      <AppCard padding="md">
        <Stack gap="sm">
          <AppText variant="subtitle">
            {copy.screen.usage(formatBytes(used), formatBytes(budget))}
          </AppText>
          <View
            accessibilityLabel={copy.screen.usage(formatBytes(used), formatBytes(budget))}
            accessibilityRole="progressbar"
            style={[styles.track, { backgroundColor: brand.primarySoft }]}
          >
            <View
              style={[
                styles.fill,
                { backgroundColor: brand.primary, width: `${percentOf(used, budget)}%` },
              ]}
            />
          </View>
          <AppText color="secondary" variant="caption">
            {copy.screen.budgetTitle}
          </AppText>
          <View style={styles.chips}>
            {BUDGET_OPTIONS.map((option) => (
              <Chip
                key={option}
                label={formatBytes(option)}
                onPress={() => void setBudget(option)}
                selected={budget === option}
              />
            ))}
          </View>
        </Stack>
      </AppCard>

      {rows.length === 0 ? (
        <EmptyState
          icon={<Icon color={brand.primary} name="download" size={32} />}
          message={copy.screen.emptyBody}
          title={copy.screen.emptyTitle}
        />
      ) : (
        <Stack gap="sm">
          {rows.map((entry) => {
            const status = stateLabel(entry);
            const date = formatDate(entry.expiresAt, locale, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            });
            const transfer = transfers[String(entry.lectureId)];
            const busy = transfer?.kind === 'downloading';
            const needsRenewal = status.tone === 'warning';

            return (
              <AppCard key={entry.lectureId} padding="md">
                <Stack gap="sm">
                  <AppText numberOfLines={2} variant="subtitle">
                    {entry.title}
                  </AppText>
                  {entry.subjectName ? (
                    <AppText color="secondary" variant="bodySmall">
                      {entry.subjectName}
                    </AppText>
                  ) : null}
                  <Stack direction="horizontal" gap="xs" wrap>
                    <AppBadge label={status.label} variant={status.tone} />
                    <AppBadge label={formatBytes(entry.fileSize)} />
                    {date ? <AppBadge label={copy.availableUntil(date)} /> : null}
                  </Stack>
                  <View style={styles.actions}>
                    {entry.status === 'complete' && !needsRenewal ? (
                      <AppButton onPress={() => open(entry)} size="sm" title={copy.openOffline} />
                    ) : null}
                    {needsRenewal ? (
                      <AppButton
                        disabled={!isOnline}
                        onPress={() => void renewLecture(entry.lectureId).catch(() => undefined)}
                        size="sm"
                        title={copy.renew}
                      />
                    ) : null}
                    {busy ? (
                      <AppButton
                        onPress={() => cancelDownload(entry.lectureId)}
                        size="sm"
                        title={t.common.cancel}
                        variant="ghost"
                      />
                    ) : (
                      <AppButton
                        accessibilityLabel={`${copy.delete}: ${entry.title}`}
                        onPress={() => confirmDelete(entry)}
                        size="sm"
                        title={copy.delete}
                        variant="dangerOutline"
                      />
                    )}
                  </View>
                </Stack>
              </AppCard>
            );
          })}
          <AppButton
            onPress={confirmDeleteAll}
            title={copy.screen.deleteAll}
            variant="dangerOutline"
          />
        </Stack>
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg },
  track: { height: 8, borderRadius: radius.full, overflow: 'hidden' },
  fill: { height: 8, borderRadius: radius.full },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
