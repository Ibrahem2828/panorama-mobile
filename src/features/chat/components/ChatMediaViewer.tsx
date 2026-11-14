import { useCallback, useEffect, useRef, useState } from 'react';
import * as ScreenCapture from 'expo-screen-capture';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIconButton, AppText, ErrorState, Icon, Skeleton } from '../../../components';
import { AppModal } from '../../../components/overlay';
import { useTranslation } from '../../../i18n';
import { colors, radius, spacing } from '../../../theme';
import type { ChatMessage } from '../types';
import { ChatPdfPages } from '../media/components/ChatPdfPages';
import { ZoomableImage } from '../media/components/ZoomableImage';
import { classifyOpenFailure, type OpenFailure } from '../media/logic/errors';
import {
  loadThumbnailUri,
  MediaOpenError,
  openFullAttachment,
} from '../media/services/mediaDelivery';
import type { OpenedFile } from '../../../security/encryptedStore';

const VIEWER_SECURE_KEY = 'chat-media-viewer';

type ChatMediaViewerProps = {
  /** The message whose attachment is shown; null closes the viewer. */
  message: ChatMessage | null;
  onClose: () => void;
};

type ViewerState =
  | { status: 'loading' }
  | { status: 'error'; failure: OpenFailure }
  | { status: 'ready'; opened: OpenedFile };

/**
 * The only way to look at a chat picture or PDF: inside the app, from a decrypted temp copy in app-private storage that is
 * deleted as soon as the viewer closes. There is deliberately no share, save, export or "open with" control, no long-press
 * menu, and screenshots / screen recording are blocked for as long as it is open (always, even in tester builds).
 */
export function ChatMediaViewer({ message, onClose }: ChatMediaViewerProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [state, setState] = useState<ViewerState>({ status: 'loading' });
  const [preview, setPreview] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [pageLabel, setPageLabel] = useState<string | null>(null);
  const openedRef = useRef<OpenedFile | null>(null);
  const messageId = message?.id ?? null;
  const groupId = message?.group ?? null;
  const isImage = message?.message_type === 'image';

  const release = useCallback(() => {
    const current = openedRef.current;

    openedRef.current = null;

    if (current) {
      void current.release();
    }
  }, []);

  useEffect(() => {
    if (messageId === null || groupId === null) {
      return undefined;
    }

    let active = true;

    setState({ status: 'loading' });
    setPreview(null);
    setPageLabel(null);

    if (isImage) {
      // The thumbnail is usually already cached from the list, so something sharp-ish shows at once.
      loadThumbnailUri(groupId, messageId).then(
        (uri) => {
          if (active) setPreview(uri);
        },
        () => undefined,
      );
    }

    openFullAttachment(groupId, messageId).then(
      ({ opened }) => {
        if (!active) {
          void opened.release();
          return;
        }

        openedRef.current = opened;
        setState({ status: 'ready', opened });
      },
      (error: unknown) => {
        if (active) {
          setState({
            status: 'error',
            failure: error instanceof MediaOpenError ? error.failure : classifyOpenFailure({}),
          });
        }
      },
    );

    return () => {
      active = false;
      release();
    };
  }, [attempt, groupId, isImage, messageId, release]);

  useEffect(() => {
    if (messageId === null) {
      return undefined;
    }

    void ScreenCapture.preventScreenCaptureAsync(VIEWER_SECURE_KEY).catch(() => undefined);

    return () => {
      void ScreenCapture.allowScreenCaptureAsync(VIEWER_SECURE_KEY).catch(() => undefined);
    };
  }, [messageId]);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);
  const title = isImage
    ? t.chat.attachment.image
    : (message?.attachment_meta?.name ?? t.chat.attachment.file);

  return (
    <AppModal
      animationType="fade"
      onRequestClose={onClose}
      transparent={false}
      visible={message !== null}
    >
      <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.header}>
          <View style={styles.titleBlock}>
            <AppText color="inverse" numberOfLines={1} style={styles.whiteText} variant="title">
              {title}
            </AppText>
            <View style={styles.noteRow}>
              <Icon color={MEDIA_MUTED} name="lock" size={12} />
              <AppText style={styles.mutedText} variant="caption">
                {pageLabel ?? t.chat.media.viewer.protectedNote}
              </AppText>
            </View>
          </View>
          <AppIconButton
            accessibilityLabel={t.common.cancel}
            icon={<Icon color={MEDIA_WHITE} name="close" />}
            onPress={onClose}
          />
        </View>

        <View style={styles.body}>
          {state.status === 'loading' && !preview ? (
            <View style={styles.center}>
              <Skeleton borderRadius={radius.lg} height={260} width="86%" />
              <AppText style={styles.mutedText} variant="bodySmall">
                {t.chat.attachment.loading}
              </AppText>
            </View>
          ) : null}

          {state.status === 'loading' && preview ? (
            <View style={styles.flex}>
              <ZoomableImage
                accessibilityLabel={t.chat.media.viewer.imageLabel}
                previewUri={preview}
                uri={null}
              />
              <View pointerEvents="none" style={styles.progressBadge}>
                <AppText style={styles.whiteText} variant="caption">
                  {t.chat.media.viewer.loadingFull}
                </AppText>
              </View>
            </View>
          ) : null}

          {state.status === 'error' ? (
            <View style={styles.center}>
              <View style={styles.errorCard}>
                <ErrorState
                  kind={state.failure === 'offline' ? 'network' : 'server'}
                  message={t.chat.media.openErrors[state.failure]}
                  onRetry={
                    state.failure === 'gone' || state.failure === 'forbidden' ? undefined : retry
                  }
                />
              </View>
            </View>
          ) : null}

          {state.status === 'ready' && isImage ? (
            <ZoomableImage
              accessibilityLabel={t.chat.media.viewer.imageLabel}
              onError={() => setState({ status: 'error', failure: 'server' })}
              previewUri={preview}
              uri={state.opened.uri}
            />
          ) : null}

          {state.status === 'ready' && !isImage ? (
            <ChatPdfPages onPageLabel={setPageLabel} uri={state.opened.uri} />
          ) : null}
        </View>

        {state.status === 'ready' && isImage ? (
          <AppText align="center" style={styles.mutedText} variant="caption">
            {t.chat.media.viewer.zoomHint}
          </AppText>
        ) : null}
      </View>
    </AppModal>
  );
}

// The viewer is always black (like a photo gallery), in both colour schemes.
const MEDIA_WHITE = '#FFFFFF';
const MEDIA_MUTED = '#B8BDC9';

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000000' },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  titleBlock: { flex: 1, gap: 2 },
  noteRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xxs },
  whiteText: { color: MEDIA_WHITE },
  mutedText: { color: MEDIA_MUTED },
  body: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    padding: spacing.xl,
  },
  progressBadge: {
    position: 'absolute',
    bottom: spacing.lg,
    alignSelf: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  errorCard: {
    width: '100%',
    padding: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.background.surface,
  },
});
