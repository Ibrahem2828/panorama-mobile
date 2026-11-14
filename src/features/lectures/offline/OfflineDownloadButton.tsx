import { memo, useCallback } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppButton, AppText, Icon } from '../../../components';
import { useTranslation } from '../../../i18n';
import { LecturesRoutes } from '../../../navigation/routes';
import type { HomeStackParamList } from '../../../navigation/types';
import { colors, radius, spacing, useBrand } from '../../../theme';
import { formatDate } from '../../../utils/formatDateTime';
import { isViewable, lectureTitle } from '../logic';
import type { Lecture } from '../types';
import { formatBytes, percentOf } from './formatBytes';
import {
  cancelDownload,
  clearTransferError,
  deleteDownload,
  downloadLecture,
  renewLecture,
} from './offlineLibrary';
import { useOfflineItem } from './useOfflineItem';

type Props = { lecture: Lecture };

type Nav = NativeStackNavigationProp<HomeStackParamList>;

/**
 * "Download to study offline" for one lecture, with every state of the offline copy: not downloaded, downloading (progress and
 * cancel), paused (resume), saved (size, valid until, open, delete), needs renewal, expired / clock problem, and the error cases.
 */
function OfflineDownloadButtonBase({ lecture }: Props) {
  const { t, locale } = useTranslation();
  const brand = useBrand();
  const navigation = useNavigation<Nav>();
  const { state, isOnline, ready } = useOfflineItem(lecture.id);
  const copy = t.offlineLectures;
  const title = lectureTitle(lecture, t.lectures.untitled);

  const ref = {
    id: lecture.id,
    title,
    subjectName: lecture.subject_name,
    pageCount: lecture.page_count,
  };

  const start = () => void downloadLecture(ref);
  const renew = useCallback(
    () => void renewLecture(lecture.id).catch(() => undefined),
    [lecture.id],
  );
  const open = useCallback(
    () =>
      navigation.navigate(LecturesRoutes.LectureViewer, {
        lectureId: lecture.id,
        title,
        offline: true,
      }),
    [lecture.id, navigation, title],
  );
  const confirmDelete = useCallback(() => {
    Alert.alert(copy.deleteTitle, copy.deleteMessage, [
      { text: t.common.cancel, style: 'cancel' },
      { text: copy.delete, style: 'destructive', onPress: () => void deleteDownload(lecture.id) },
    ]);
  }, [copy, lecture.id, t.common.cancel]);

  if (!ready || (!isViewable(lecture) && state.kind === 'none')) {
    return null;
  }

  const box = (children: React.ReactNode, tone: 'neutral' | 'warning' | 'error' = 'neutral') => (
    <View
      style={[
        styles.box,
        { borderColor: tone === 'neutral' ? colors.border.default : colors.semantic[tone] },
      ]}
    >
      {children}
    </View>
  );

  switch (state.kind) {
    case 'none':
      return box(
        <>
          <AppButton
            accessibilityLabel={`${copy.download}: ${title}`}
            disabled={!isOnline}
            leftIcon={<Icon color={brand.primary} name="download" size={18} />}
            onPress={start}
            size="sm"
            title={copy.download}
            variant="outline"
          />
          <AppText color="muted" variant="caption">
            {isOnline ? copy.downloadHint : copy.errors.offline}
          </AppText>
        </>,
      );

    case 'downloading': {
      const percent = percentOf(state.doneBytes, state.totalBytes);

      return box(
        <>
          <View style={styles.row}>
            <AppText style={styles.grow} variant="bodySmall">
              {state.totalBytes > 0 ? copy.downloading(percent) : copy.downloadingPending}
            </AppText>
            <AppButton
              onPress={() => cancelDownload(lecture.id)}
              size="sm"
              title={t.common.cancel}
              variant="ghost"
            />
          </View>
          <View
            accessibilityLabel={copy.downloading(percent)}
            accessibilityRole="progressbar"
            accessibilityValue={{ min: 0, max: 100, now: percent }}
            style={[styles.track, { backgroundColor: brand.primarySoft }]}
          >
            <View style={[styles.fill, { backgroundColor: brand.primary, width: `${percent}%` }]} />
          </View>
        </>,
      );
    }

    case 'verifying':
      return box(<AppText variant="bodySmall">{copy.verifying}</AppText>);

    case 'renewing':
      return box(<AppText variant="bodySmall">{copy.renewing}</AppText>);

    case 'partial':
      return box(
        <>
          <AppText color="secondary" variant="bodySmall">
            {copy.partial(percentOf(state.doneBytes, state.totalBytes))}
          </AppText>
          <View style={styles.row}>
            <AppButton
              disabled={!isOnline}
              onPress={start}
              size="sm"
              title={copy.resume}
              variant="outline"
            />
            <AppButton
              onPress={() => void deleteDownload(lecture.id)}
              size="sm"
              title={t.common.cancel}
              variant="ghost"
            />
          </View>
        </>,
      );

    case 'ready': {
      const date = formatDate(state.expiresAt, locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });

      return box(
        <>
          <View style={styles.row}>
            <Icon color={colors.semantic.success} name="check" size={16} />
            <AppText style={styles.grow} variant="bodySmall">
              {copy.downloaded(formatBytes(state.sizeBytes))}
            </AppText>
          </View>
          <AppText color="muted" variant="caption">
            {date ? copy.availableUntil(date) : ''}
          </AppText>
          {state.renewSoon ? (
            <AppText color="warning" variant="caption">
              {copy.renewSoon}
            </AppText>
          ) : null}
          <View style={styles.row}>
            <AppButton onPress={open} size="sm" title={copy.openOffline} variant="primary" />
            {state.renewSoon && isOnline ? (
              <AppButton onPress={renew} size="sm" title={copy.renew} variant="outline" />
            ) : null}
            <AppButton
              accessibilityLabel={copy.delete}
              onPress={confirmDelete}
              size="sm"
              title={copy.delete}
              variant="ghost"
            />
          </View>
        </>,
      );
    }

    case 'expired':
    case 'clockRollback':
      return box(
        <>
          <AppText color="warning" variant="label">
            {state.kind === 'expired' ? copy.expiredTitle : copy.clockTitle}
          </AppText>
          <AppText color="secondary" variant="bodySmall">
            {state.kind === 'expired' ? copy.expired : copy.clockRollback}
          </AppText>
          <View style={styles.row}>
            <AppButton
              disabled={!isOnline}
              onPress={renew}
              size="sm"
              title={copy.renew}
              variant="primary"
            />
            <AppButton onPress={confirmDelete} size="sm" title={copy.delete} variant="ghost" />
          </View>
        </>,
        'warning',
      );

    case 'error':
      return box(
        <>
          <AppText color="error" variant="bodySmall">
            {copy.errors[state.reason as keyof typeof copy.errors] ?? copy.errors.unknown}
          </AppText>
          <View style={styles.row}>
            <AppButton
              onPress={() => {
                clearTransferError(lecture.id);

                if (state.reason === 'network' || state.reason === 'unknown') {
                  start();
                }
              }}
              size="sm"
              title={
                state.reason === 'network' || state.reason === 'unknown'
                  ? copy.viewer.retry
                  : t.offlineLectures.screen.dismiss
              }
              variant="outline"
            />
          </View>
        </>,
        'error',
      );

    default:
      return null;
  }
}

export const OfflineDownloadButton = memo(OfflineDownloadButtonBase);

const styles = StyleSheet.create({
  box: {
    marginTop: spacing.xs,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.md,
  },
  row: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm },
  grow: { flex: 1 },
  track: { height: 6, borderRadius: radius.full, overflow: 'hidden' },
  fill: { height: 6, borderRadius: radius.full },
});
