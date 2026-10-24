import { useCallback } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTranslation } from '../../../i18n';
import { useFeedbackStore } from '../../feedback/store';
import { ProtectedPreview } from '../components/ProtectedPreview';
import {
  getFileDisplayTitle,
  getFileViewerType,
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
  const requestFeedbackPrompt = useFeedbackStore((state) => state.requestPrompt);
  const file = useFilesStore((state) => state.getFileById(fileId));
  const loadFileDetail = useFilesStore((state) => state.loadFileDetail);
  const displayTitle = file
    ? getFileDisplayTitle(file, t.files)
    : (title ?? t.files.viewer.fallbackTitle);

  const requestTicket = useCallback(
    (authToken: string) => requestProtectedFileTicket(fileId, authToken),
    [fileId],
  );
  const toErrorMessage = useCallback(
    (error: unknown) => toSafeFilesErrorMessage(error, t.files),
    [t],
  );
  const prepare = useCallback(() => loadFileDetail(fileId), [fileId, loadFileDetail]);
  const canRender = useCallback(() => {
    const loaded = useFilesStore.getState().getFileById(fileId);

    return !loaded || getFileViewerType(loaded) === 'image';
  }, [fileId]);
  const handleViewed = useCallback(() => {
    void requestFeedbackPrompt({
      context: 'file',
      actionKey: 'file.viewed',
      objectType: 'file',
      objectId: fileId,
    });
  }, [fileId, requestFeedbackPrompt]);

  return (
    <ProtectedPreview
      onBack={() => navigation.goBack()}
      canRender={canRender}
      onViewed={handleViewed}
      pathPrefix="/api/v1/protected-files/"
      prepare={prepare}
      requestTicket={requestTicket}
      subtitle={t.files.viewer.subtitle}
      title={displayTitle}
      toErrorMessage={toErrorMessage}
    />
  );
}
