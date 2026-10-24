import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppButton, AppHeader, AppScreen, AppText, ErrorState, Stack } from '../../../components';
import { useTranslation } from '../../../i18n';
import { spacing, useBrand } from '../../../theme';
import { useFeedbackStore } from '../../feedback/store';
import { useProcessingStatus } from '../../lectures/hooks/useProcessingStatus';
import { isTerminalStatus } from '../../lectures/logic';
import { DocumentViewerBody } from '../../viewer/DocumentViewerBody';
import { getFileDisplayTitle } from '../services';
import { useFilesStore } from '../store';
import type { Id } from '../types';

type ParamList = { PdfViewer: { fileId: Id; title?: string } };
type ViewerRoute = RouteProp<ParamList, 'PdfViewer'>;
type ViewerNavigation = NativeStackNavigationProp<ParamList, 'PdfViewer'>;

/**
 * Opens a library file in the unified viewer (the same engine as lectures): protected page images, zoom, thumbnails,
 * night mode, text view and the student's private marks. A file that is still being prepared shows its progress.
 */
export function PdfViewerScreen() {
  const { t } = useTranslation();
  const brand = useBrand();
  const navigation = useNavigation<ViewerNavigation>();
  const route = useRoute<ViewerRoute>();
  const { fileId, title } = route.params;
  const requestFeedbackPrompt = useFeedbackStore((state) => state.requestPrompt);
  const file = useFilesStore((state) => state.getFileById(fileId));
  const loadFileDetail = useFilesStore((state) => state.loadFileDetail);
  const doc = useMemo(() => ({ kind: 'file' as const, id: fileId }), [fileId]);
  const [ready, setReady] = useState(false);
  const processing = useProcessingStatus(doc, !ready, (status) => {
    if (status.is_ready) setReady(true);
  });
  const displayTitle = file
    ? getFileDisplayTitle(file, t.files)
    : (title ?? t.files.viewer.fallbackTitle);
  const goBack = useCallback(() => navigation.goBack(), [navigation]);

  useEffect(() => {
    void loadFileDetail(fileId);
  }, [fileId, loadFileDetail]);

  useEffect(() => {
    if (ready) {
      void requestFeedbackPrompt({
        context: 'file',
        actionKey: 'file.viewed',
        objectType: 'file',
        objectId: fileId,
      });
    }
  }, [fileId, ready, requestFeedbackPrompt]);

  if (ready && processing.status) {
    return (
      <DocumentViewerBody
        doc={doc}
        onBack={goBack}
        pageCount={Math.max(processing.status.page_count, 1)}
        title={displayTitle}
      />
    );
  }

  const status = processing.status?.status;

  return (
    <AppScreen contentContainerStyle={styles.content} scroll>
      <AppHeader onBack={goBack} showBack title={displayTitle} />
      {status === 'failed' || status === 'quarantined' ? (
        <ErrorState message={t.docViewer.failedBody} title={t.docViewer.failedTitle} />
      ) : processing.errorKind && !status ? (
        <ErrorState
          message={t.lectures.errors[processing.errorKind]}
          onRetry={processing.checkNow}
          title={t.files.viewer.unavailableTitle}
        />
      ) : status && isTerminalStatus(status) && !processing.status?.is_ready ? (
        <ErrorState message={t.docViewer.notReadyBody} title={t.docViewer.notReadyTitle} />
      ) : (
        <Stack align="center" gap="md" style={styles.waiting}>
          <ActivityIndicator color={brand.primary} size="large" />
          <AppText align="center" variant="title">
            {t.docViewer.processingTitle}
          </AppText>
          <AppText align="center" color="secondary" variant="bodySmall">
            {t.docViewer.processingBody}
          </AppText>
          <AppButton
            onPress={processing.checkNow}
            title={t.lectures.viewer.retry}
            variant="outline"
          />
        </Stack>
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.xl },
  waiting: { paddingVertical: spacing.xxl },
});
