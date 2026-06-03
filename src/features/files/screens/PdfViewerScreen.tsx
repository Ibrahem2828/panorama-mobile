import { useEffect } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StyleSheet } from 'react-native';

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
import { spacing } from '../../../theme';
import { useAuthStore } from '../../auth/store';
import { InAppFileViewer } from '../components';
import { getFileDisplayTitle } from '../services';
import { useFilesStore } from '../store';
import type { FileResource, Id } from '../types';

type PdfViewerRouteParamList = {
  PdfViewer: { fileId: Id; title?: string };
};

type PdfViewerNavigationParamList = {
  PdfViewer: { fileId: Id; title?: string };
};

type PdfViewerRoute = RouteProp<PdfViewerRouteParamList, 'PdfViewer'>;
type PdfViewerNavigation = NativeStackNavigationProp<PdfViewerNavigationParamList, 'PdfViewer'>;

function isSameId(left: Id, right: Id): boolean {
  return String(left) === String(right);
}

function findFileById(
  fileId: Id,
  files: FileResource[],
  groupFilesByGroupId: Record<string, FileResource[]>,
): FileResource | null {
  const fromFiles = files.find((file) => isSameId(file.id, fileId));

  if (fromFiles) {
    return fromFiles;
  }

  for (const groupFiles of Object.values(groupFilesByGroupId)) {
    const fromGroupFiles = groupFiles.find((file) => isSameId(file.id, fileId));

    if (fromGroupFiles) {
      return fromGroupFiles;
    }
  }

  return null;
}

export function PdfViewerScreen() {
  const navigation = useNavigation<PdfViewerNavigation>();
  const route = useRoute<PdfViewerRoute>();
  const { fileId, title } = route.params;
  const accessToken = useAuthStore((state) => state.accessToken);
  const files = useFilesStore((state) => state.files);
  const groupFilesByGroupId = useFilesStore((state) => state.groupFilesByGroupId);
  const selectedFile = useFilesStore((state) => state.selectedFile);
  const isLoadingDetail = useFilesStore((state) => state.isLoadingDetail);
  const errorMessage = useFilesStore((state) => state.errorMessage);
  const loadFileDetail = useFilesStore((state) => state.loadFileDetail);
  const cachedFile = findFileById(fileId, files, groupFilesByGroupId);
  const activeFile = selectedFile && isSameId(selectedFile.id, fileId) ? selectedFile : cachedFile;
  const showInitialLoading = isLoadingDetail && !activeFile;
  const displayTitle = activeFile ? getFileDisplayTitle(activeFile) : (title ?? 'عارض الملفات');

  useEffect(() => {
    void loadFileDetail(fileId);
  }, [fileId, loadFileDetail]);

  function handleRetry() {
    void loadFileDetail(fileId);
  }

  if (showInitialLoading) {
    return (
      <AppScreen contentContainerStyle={styles.content} scroll>
        <AppHeader subtitle="عارض داخلي" title="الملفات" />
        <LoadingState message="جاري تجهيز الملف..." />
      </AppScreen>
    );
  }

  if (!activeFile) {
    return (
      <AppScreen contentContainerStyle={styles.content} scroll>
        <Stack gap="lg">
          <AppHeader subtitle="عارض داخلي" title="الملفات" />
          <AppButton onPress={() => navigation.goBack()} title="رجوع" variant="ghost" />
          <ErrorState
            message={errorMessage ?? 'لا يمكن فتح هذا الملف حاليا.'}
            onRetry={handleRetry}
            title="الملف غير متاح"
          />
        </Stack>
      </AppScreen>
    );
  }

  return (
    <AppScreen contentContainerStyle={styles.content} scroll>
      <Stack gap="xl">
        <Stack gap="md">
          <AppHeader subtitle="عارض داخلي بدون تنزيل مباشر" title={displayTitle} />
          <AppButton onPress={() => navigation.goBack()} title="رجوع" variant="ghost" />
        </Stack>

        {errorMessage ? <ErrorState message={errorMessage} onRetry={handleRetry} /> : null}

        <InAppFileViewer authToken={accessToken} file={activeFile} />

        <AppCard variant="muted">
          <AppText color="secondary" variant="caption">
            يعرض التطبيق الملف داخل الواجهة عند توفر نوع مدعوم. لا توجد أزرار تنزيل أو مشاركة أو فتح
            خارجي تلقائي.
          </AppText>
        </AppCard>
      </Stack>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
  },
});
