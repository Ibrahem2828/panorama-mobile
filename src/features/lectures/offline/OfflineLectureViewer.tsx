import { useCallback, useEffect, useRef, useState } from 'react';
import * as ScreenCapture from 'expo-screen-capture';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton, AppIconButton, AppText, Icon, LoadingState } from '../../../components';
import { useTranslation } from '../../../i18n';
import { useNetworkStore } from '../../../offline/networkStore';
import { radius, spacing } from '../../../theme';
import { ChatPdfPages } from '../../chat/media/components/ChatPdfPages';
import { percentOf } from './formatBytes';
import {
  OfflineOpenError,
  openDownloadedLecture,
  renewLecture,
  useOfflineLibrary,
  type OpenBlock,
  type OpenedLecture,
} from './offlineLibrary';

const SECURE_KEY = 'offline-lecture-viewer';
const BG = '#0B1020';
const WHITE = '#FFFFFF';
const MUTED = '#B8BDC9';

type ViewerState =
  | { status: 'loading'; percent: number }
  | { status: 'blocked'; reason: OpenBlock | 'failed' }
  | { status: 'ready'; opened: OpenedLecture };

type Props = { lectureId: number; title: string; onBack: () => void };

/**
 * Reads a downloaded lecture inside the app, fully offline. The package is decrypted chunk by chunk into a temp PDF in the
 * app-private cache (deleted when the viewer closes), drawn page by page by the platform PdfRenderer. Screen capture is blocked
 * for as long as it is open, always (also in tester builds). There is no share, save, export or open-with, and no long-press menu.
 * An expired license or a rolled-back clock blocks opening until the app is online and the license is renewed.
 */
export function OfflineLectureViewer({ lectureId, title, onBack }: Props) {
  const { t } = useTranslation();
  const copy = t.offlineLectures;
  const insets = useSafeAreaInsets();
  const isOnline = useNetworkStore((state) => state.isOnline);
  const ready = useOfflineLibrary((library) => library.ready);
  const [state, setState] = useState<ViewerState>({ status: 'loading', percent: 0 });
  const [attempt, setAttempt] = useState(0);
  const [pageLabel, setPageLabel] = useState<string | null>(null);
  const [renewing, setRenewing] = useState(false);
  const openedRef = useRef<OpenedLecture | null>(null);

  useEffect(() => {
    void ScreenCapture.preventScreenCaptureAsync(SECURE_KEY).catch(() => undefined);

    return () => {
      void ScreenCapture.allowScreenCaptureAsync(SECURE_KEY).catch(() => undefined);
    };
  }, []);

  useEffect(() => {
    if (!ready) {
      return undefined;
    }

    let active = true;
    let lastPercent = -1;

    setState({ status: 'loading', percent: 0 });

    openDownloadedLecture(lectureId, {
      isCancelled: () => !active,
      onProgress: (done, total) => {
        const percent = percentOf(done, total);

        if (active && percent !== lastPercent) {
          lastPercent = percent;
          setState({ status: 'loading', percent });
        }
      },
    }).then(
      (opened) => {
        if (!active) {
          opened.release();
          return;
        }

        openedRef.current = opened;
        setState({ status: 'ready', opened });
      },
      (error: unknown) => {
        if (active && !(error instanceof OfflineOpenError && error.reason === 'cancelled')) {
          setState({
            status: 'blocked',
            reason: error instanceof OfflineOpenError ? error.reason : 'failed',
          });
        }
      },
    );

    return () => {
      active = false;
      openedRef.current?.release();
      openedRef.current = null;
    };
  }, [attempt, lectureId, ready]);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);
  const renew = useCallback(async () => {
    setRenewing(true);

    try {
      await renewLecture(lectureId);
      retry();
    } catch {
      // The reason is shown by the library state; the screen stays blocked.
    } finally {
      setRenewing(false);
    }
  }, [lectureId, retry]);

  const blockedMessage = (reason: OpenBlock | 'failed'): { title: string; body: string } => {
    switch (reason) {
      case 'expired':
        return { title: copy.expiredTitle, body: copy.expired };
      case 'clockRollback':
        return { title: copy.clockTitle, body: copy.clockRollback };
      case 'missing':
        return { title: copy.viewer.failed, body: copy.viewer.missing };
      case 'corrupt':
        return { title: copy.viewer.failed, body: copy.viewer.corrupt };
      default:
        return { title: copy.viewer.failed, body: copy.errors.unknown };
    }
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <AppIconButton
          accessibilityLabel={t.common.back}
          icon={<Icon color={WHITE} name="chevronRight" />}
          onPress={onBack}
        />
        <View style={styles.titleBlock}>
          <AppText color="inverse" numberOfLines={1} style={styles.white} variant="title">
            {title}
          </AppText>
          {pageLabel ? (
            <AppText style={styles.muted} variant="caption">
              {pageLabel}
            </AppText>
          ) : null}
        </View>
      </View>
      <View
        accessibilityRole="summary"
        style={[styles.banner, isOnline ? styles.bannerOnline : styles.bannerOffline]}
      >
        <AppText style={styles.white} variant="caption">
          {copy.viewer.banner}
        </AppText>
      </View>
      <View style={styles.body}>
        {state.status === 'loading' ? (
          <View style={styles.center}>
            <LoadingState
              message={
                state.percent > 0 ? copy.viewer.openingProgress(state.percent) : copy.viewer.opening
              }
            />
          </View>
        ) : state.status === 'blocked' ? (
          <View style={styles.center}>
            <Icon color="#F5B942" name="alert" size={36} />
            <AppText align="center" style={styles.white} variant="subtitle">
              {blockedMessage(state.reason).title}
            </AppText>
            <AppText align="center" style={styles.muted}>
              {blockedMessage(state.reason).body}
            </AppText>
            {state.reason === 'expired' || state.reason === 'clockRollback' ? (
              <AppButton
                disabled={!isOnline}
                loading={renewing}
                onPress={() => void renew()}
                title={isOnline ? copy.renew : copy.renewFailedOffline}
              />
            ) : state.reason === 'failed' ? (
              <AppButton onPress={retry} title={copy.viewer.retry} />
            ) : (
              <AppButton onPress={onBack} title={t.common.back} variant="outline" />
            )}
          </View>
        ) : (
          <ChatPdfPages onPageLabel={setPageLabel} uri={state.opened.uri} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  titleBlock: { flex: 1, minWidth: 0, gap: 2 },
  white: { color: WHITE },
  muted: { color: MUTED },
  banner: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  bannerOffline: { backgroundColor: '#8A5A00' },
  bannerOnline: { backgroundColor: '#2B3350' },
  body: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xl,
  },
});
