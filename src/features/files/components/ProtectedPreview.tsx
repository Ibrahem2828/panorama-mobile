import { useCallback, useEffect, useRef, useState } from 'react';
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

type ProtectedPreviewProps = {
  title: string;
  subtitle: string;
  /** Backend path the ticket's `preview_url` must live under (anything else is refused). */
  pathPrefix: string;
  requestTicket: (authToken: string) => Promise<{ preview_url: string }>;
  toErrorMessage: (error: unknown) => string;
  onBack: () => void;
  onViewed?: () => void;
  /** Runs before the ticket is requested, e.g. to refresh the record the title comes from. */
  prepare?: () => Promise<unknown>;
};

/**
 * Shows protected content (a file or a print item) inside the app. Screen capture is blocked
 * for as long as the screen is mounted, the short-lived ticket URL is only opened when it
 * points at the expected protected path of our own backend, and navigation inside the web view
 * is locked to that path. The raw URL is never shown or logged.
 */
export function ProtectedPreview({
  title,
  subtitle,
  pathPrefix,
  requestTicket,
  toErrorMessage,
  onBack,
  onViewed,
  prepare,
}: ProtectedPreviewProps) {
  const { t } = useTranslation();
  const accessToken = useAuthStore((state) => state.accessToken);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Callers pass inline functions; keep the latest in a ref so a re-render never re-issues a ticket.
  const callbacks = useRef({ requestTicket, toErrorMessage, prepare });

  callbacks.current = { requestTicket, toErrorMessage, prepare };

  const loadPreview = useCallback(async () => {
    if (!accessToken) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await callbacks.current.prepare?.();

      const ticket = await callbacks.current.requestTicket(accessToken);
      const trusted = isTrustedBackendUrl(ticket.preview_url, {
        pathPrefixes: [pathPrefix],
        allowHttpInDevelopment: true,
      });

      if (!trusted) {
        throw new Error('UNTRUSTED_PREVIEW_URL');
      }

      setPreviewUrl(ticket.preview_url);
    } catch (loadError) {
      setPreviewUrl(null);
      setError(callbacks.current.toErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, pathPrefix]);

  useEffect(() => {
    void ScreenCapture.preventScreenCaptureAsync();
    void loadPreview();

    return () => {
      void ScreenCapture.allowScreenCaptureAsync();
    };
  }, [loadPreview]);

  return (
    <AppScreen horizontalPadding={false} safeArea style={styles.screen}>
      <View style={styles.header}>
        <AppHeader subtitle={subtitle} title={title} />
        <AppButton onPress={onBack} title={t.common.back} variant="ghost" />
      </View>

      {isLoading ? <LoadingState message={t.files.viewer.issuingTicket} /> : null}
      {error ? <ErrorState message={error} onRetry={() => void loadPreview()} /> : null}

      {previewUrl && !isLoading && !error ? (
        <WebView
          allowsBackForwardNavigationGestures={false}
          allowsLinkPreview={false}
          cacheEnabled={false}
          incognito
          javaScriptEnabled
          onError={() => setError(t.files.viewer.loadError)}
          onLoadEnd={onViewed}
          onShouldStartLoadWithRequest={(request: { url: string }) =>
            isTrustedBackendUrl(request.url, {
              pathPrefixes: [pathPrefix],
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
