import { useCallback, useEffect, useState } from 'react';
import * as ScreenCapture from 'expo-screen-capture';
import { ActivityIndicator, Image, Modal, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

import { AppButton, AppIconButton, AppText, Icon } from '../../../components';
import { colors, spacing } from '../../../theme';
import { useTranslation } from '../../../i18n';
import { isTrustedBackendUrl } from '../../../utils/trustedUrl';
import { useAuthStore } from '../../auth/store';
import { CHAT_ATTACHMENT_PATH_PREFIX, requestChatAttachmentUrl } from '../services';
import type { ChatMessage, Id } from '../types';

type ChatAttachmentViewerProps = {
  groupId: Id;
  /** The message whose attachment is shown; null closes the viewer. */
  message: ChatMessage | null;
  onClose: () => void;
};

type ViewerState = { status: 'loading' } | { status: 'error' } | { status: 'ready'; uri: string };

/**
 * In-app preview of a chat attachment. The short-lived URL never leaves the app (no share,
 * no browser), is only loaded with the user's auth header, and screenshots are blocked
 * while it is open.
 */
export function ChatAttachmentViewer({ groupId, message, onClose }: ChatAttachmentViewerProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const accessToken = useAuthStore((state) => state.accessToken);
  const [state, setState] = useState<ViewerState>({ status: 'loading' });
  const messageId = message?.id ?? null;
  const isImage = message?.message_type === 'image';

  const load = useCallback(async () => {
    if (messageId === null || !accessToken) {
      setState({ status: 'error' });
      return;
    }

    setState({ status: 'loading' });

    try {
      setState({
        status: 'ready',
        uri: await requestChatAttachmentUrl(groupId, messageId, accessToken),
      });
    } catch {
      setState({ status: 'error' });
    }
  }, [accessToken, groupId, messageId]);

  useEffect(() => {
    if (messageId === null) {
      return undefined;
    }

    void ScreenCapture.preventScreenCaptureAsync();
    void load();

    return () => {
      void ScreenCapture.allowScreenCaptureAsync();
    };
  }, [load, messageId]);

  const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      transparent={false}
      visible={message !== null}
    >
      <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.header}>
          <AppText color="inverse" variant="title">
            {t.chat.attachment.viewerTitle}
          </AppText>
          <AppIconButton
            accessibilityLabel={t.common.cancel}
            icon={<Icon color={colors.text.inverse} name="close" />}
            onPress={onClose}
          />
        </View>

        <View style={styles.body}>
          {state.status === 'loading' ? (
            <View style={styles.center}>
              <ActivityIndicator color={colors.text.inverse} size="large" />
              <AppText color="inverse" variant="bodySmall">
                {t.chat.attachment.loading}
              </AppText>
            </View>
          ) : null}

          {state.status === 'error' ? (
            <View style={styles.center}>
              <AppText align="center" color="inverse">
                {t.chat.attachment.loadError}
              </AppText>
              <AppButton onPress={() => void load()} title={t.common.retry} variant="outline" />
            </View>
          ) : null}

          {state.status === 'ready' && isImage ? (
            <Image
              accessibilityIgnoresInvertColors
              accessibilityLabel={t.chat.attachment.image}
              onError={() => setState({ status: 'error' })}
              resizeMode="contain"
              source={{ uri: state.uri, headers }}
              style={styles.image}
            />
          ) : null}

          {state.status === 'ready' && !isImage ? (
            <WebView
              allowsLinkPreview={false}
              cacheEnabled={false}
              incognito
              onError={() => setState({ status: 'error' })}
              onShouldStartLoadWithRequest={(request: { url: string }) =>
                isTrustedBackendUrl(request.url, {
                  pathPrefixes: [CHAT_ATTACHMENT_PATH_PREFIX],
                  allowHttpInDevelopment: true,
                })
              }
              originWhitelist={['https://*', 'http://*']}
              source={{ uri: state.uri, headers }}
              style={styles.web}
            />
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  body: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    padding: spacing.xl,
  },
  image: {
    flex: 1,
    width: '100%',
  },
  web: {
    flex: 1,
    backgroundColor: colors.background.surface,
  },
});
