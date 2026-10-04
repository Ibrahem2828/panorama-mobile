import { useCallback, useEffect, useState } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ScreenCapture from 'expo-screen-capture';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

import {
  AppButton,
  AppCard,
  AppHeader,
  AppScreen,
  AppText,
  ErrorState,
  LoadingState,
  Stack,
} from '../../../components';
import { useTranslation } from '../../../i18n';
import { colors, spacing } from '../../../theme';
import { isTrustedBackendUrl } from '../../../utils/trustedUrl';
import { useAuthStore } from '../../auth/store';
import { useFeedbackStore } from '../../feedback/store';
import {
  getFileDisplayTitle,
  requestProtectedFileTicket,
  toSafeFilesErrorMessage,
} from '../services';
import { useFilesStore } from '../store';
import type { Id } from '../types';

type ParamList = { PdfViewer: { fileId: Id; title?: string } };
type ViewerRoute = RouteProp<ParamList, 'PdfViewer'>;
type ViewerNavigation = NativeStackNavigationProp<ParamList, 'PdfViewer'>;

export function PdfViewerScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<ViewerNavigation>();
  const route = useRoute<ViewerRoute>();
  const { fileId, title } = route.params;
  const accessToken = useAuthStore((state) => state.accessToken);
  const requestFeedbackPrompt = useFeedbackStore((state) => state.requestPrompt);
  const file = useFilesStore((state) => state.getFileById(fileId));
  const loadFileDetail = useFilesStore((state) => state.loadFileDetail);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPreview = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setError(null);
    try {
      await loadFileDetail(fileId);
      const ticket = await requestProtectedFileTicket(fileId, accessToken);
      const trusted = isTrustedBackendUrl(ticket.preview_url, {
        pathPrefixes: ['/api/v1/protected-files/'],
        allowHttpInDevelopment: true,
      });
      if (!trusted) throw new Error('UNTRUSTED_PREVIEW_URL');
      setPreviewUrl(ticket.preview_url);
    } catch (loadError) {
      setError(toSafeFilesErrorMessage(loadError, t.files));
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, fileId, loadFileDetail]);

  useEffect(() => {
    void ScreenCapture.preventScreenCaptureAsync();
    void loadPreview();
    return () => {
      void ScreenCapture.allowScreenCaptureAsync();
    };
  }, [loadPreview]);

  const displayTitle = file
    ? getFileDisplayTitle(file, t.files)
    : (title ?? t.files.viewer.fallbackTitle);

  return (
    <AppScreen horizontalPadding={false} safeArea style={styles.screen}>
      <View style={styles.header}>
        <AppHeader subtitle={t.files.viewer.subtitle} title={displayTitle} />
        <AppButton onPress={() => navigation.goBack()} title={t.common.back} variant="ghost" />
      </View>

      {isLoading ? <LoadingState message={t.files.viewer.issuingTicket} /> : null}
      {error ? <ErrorState message={error} onRetry={() => void loadPreview()} /> : null}

      {previewUrl && !isLoading ? (
        <WebView
          allowsBackForwardNavigationGestures={false}
          allowsLinkPreview={false}
          cacheEnabled={false}
          incognito
          javaScriptEnabled
          onError={() => setError(t.files.viewer.loadError)}
          onLoadEnd={() => {
            void requestFeedbackPrompt({
              context: 'file',
              actionKey: 'file.viewed',
              objectType: 'file',
              objectId: fileId,
            });
          }}
          onShouldStartLoadWithRequest={(request: { url: string }) =>
            isTrustedBackendUrl(request.url, {
              pathPrefixes: ['/api/v1/protected-files/'],
              allowHttpInDevelopment: true,
            })
          }
          originWhitelist={['https://*', 'http://127.0.0.1:*', 'http://localhost:*']}
          pullToRefreshEnabled
          setSupportMultipleWindows={false}
          source={{ uri: previewUrl }}
          style={styles.webView}
        />
      ) : null}

      <AppCard padding="sm" style={styles.notice} variant="muted">
        <Stack gap="xs">
          <AppText color="secondary" variant="caption">
            {t.files.viewer.securityNote}
          </AppText>
        </Stack>
      </AppCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background.primary },
  header: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.sm },
  webView: { flex: 1, backgroundColor: colors.background.surface },
  notice: { margin: spacing.sm },
});
