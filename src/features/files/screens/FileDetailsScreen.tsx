import { useEffect } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
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
  SectionHeader,
  Stack,
} from '../../../components';
import { useTranslation } from '../../../i18n';
import { formatDate } from '../../../utils/formatDateTime';
import { PrintingRoutes, SharedRoutes, TabRoutes } from '../../../navigation/routes';
import type { AppTabsParamList } from '../../../navigation/types';
import { spacing } from '../../../theme';
import { FileDetailHeader, FileMetaRow } from '../components';
import {
  formatFileSize,
  getEntityLabel,
  getFileDescription,
  getFileDisplayTitle,
  getFileExtension,
  getFileSize,
  canRequestProtectedPreview,
  getFileViewerType,
  getVisibilityLabel,
} from '../services';
import { useFilesStore } from '../store';
import type { FileResource, Id } from '../types';

type FileDetailsRouteParamList = {
  FileDetails: { fileId: Id };
};

type FileDetailsNavigationParamList = {
  FileDetails: { fileId: Id };
  PdfViewer: { fileId: Id; title?: string };
};

type FileDetailsRoute = RouteProp<FileDetailsRouteParamList, 'FileDetails'>;
type FileDetailsNavigation = NativeStackNavigationProp<
  FileDetailsNavigationParamList,
  'FileDetails'
>;
type AppTabsNavigation = BottomTabNavigationProp<AppTabsParamList>;

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

export function FileDetailsScreen() {
  const { t, locale } = useTranslation();
  const navigation = useNavigation<FileDetailsNavigation>();
  const route = useRoute<FileDetailsRoute>();
  const { fileId } = route.params;
  const files = useFilesStore((state) => state.files);
  const groupFilesByGroupId = useFilesStore((state) => state.groupFilesByGroupId);
  const selectedFile = useFilesStore((state) => state.selectedFile);
  const isLoadingDetail = useFilesStore((state) => state.isLoadingDetail);
  const errorMessage = useFilesStore((state) => state.errorMessage);
  const loadFileDetail = useFilesStore((state) => state.loadFileDetail);
  const cachedFile = findFileById(fileId, files, groupFilesByGroupId);
  const activeFile = selectedFile && isSameId(selectedFile.id, fileId) ? selectedFile : cachedFile;
  const showInitialLoading = isLoadingDetail && !activeFile;
  const canPreview = activeFile ? canRequestProtectedPreview(activeFile) : false;

  useEffect(() => {
    void loadFileDetail(fileId);
  }, [fileId, loadFileDetail]);

  function handleRetry() {
    void loadFileDetail(fileId);
  }

  function handleOpenViewer(file: FileResource) {
    navigation.navigate(SharedRoutes.PdfViewer, {
      fileId: file.id,
      title: getFileDisplayTitle(file, t.files),
    });
  }

  function handleRequestPrint(file: FileResource) {
    navigation.getParent<AppTabsNavigation>()?.navigate(TabRoutes.Printing, {
      screen: PrintingRoutes.CreatePrintOrder,
      params: {
        fileId: file.id,
        fileTitle: getFileDisplayTitle(file, t.files),
      },
    });
  }

  if (showInitialLoading) {
    return (
      <AppScreen contentContainerStyle={styles.content} scroll>
        <AppHeader subtitle={t.files.details.subtitle} title={t.files.title} />
        <LoadingState message={t.files.details.loading} />
      </AppScreen>
    );
  }

  if (!activeFile) {
    return (
      <AppScreen contentContainerStyle={styles.content} scroll>
        <Stack gap="lg">
          <AppHeader subtitle={t.files.details.subtitle} title={t.files.title} />
          <AppButton onPress={() => navigation.goBack()} title={t.common.back} variant="ghost" />
          <ErrorState
            message={errorMessage ?? t.files.details.unavailableMessage}
            onRetry={handleRetry}
            title={t.files.details.unavailableTitle}
          />
        </Stack>
      </AppScreen>
    );
  }

  return (
    <AppScreen contentContainerStyle={styles.content} scroll>
      <Stack gap="xl">
        <Stack gap="md">
          <AppHeader subtitle={t.files.details.subtitle} title={t.files.title} />
          <AppButton onPress={() => navigation.goBack()} title={t.common.back} variant="ghost" />
        </Stack>

        <FileDetailHeader file={activeFile} />

        {errorMessage ? <ErrorState message={errorMessage} onRetry={handleRetry} /> : null}

        <Stack direction="horizontal" gap="md" wrap>
          <AppButton
            disabled={!canPreview}
            onPress={() => handleOpenViewer(activeFile)}
            title={t.files.details.openInApp}
          />
          <AppButton
            onPress={() => handleRequestPrint(activeFile)}
            title={t.files.details.requestPrint}
            variant="outline"
          />
        </Stack>

        {!canPreview ? (
          <AppCard variant="muted">
            <AppText color="error" variant="bodySmall">
              {t.files.details.noTicket}
            </AppText>
          </AppCard>
        ) : null}

        <AppCard variant="muted">
          <Stack gap="sm">
            <AppText variant="title">{t.files.details.descriptionTitle}</AppText>
            <AppText color="secondary" variant="bodySmall">
              {getFileDescription(activeFile) ?? t.files.details.noDescription}
            </AppText>
          </Stack>
        </AppCard>

        <Stack gap="md">
          <SectionHeader
            subtitle={t.files.details.infoSubtitle}
            title={t.files.details.infoTitle}
          />
          <AppCard>
            <Stack gap="sm">
              <FileMetaRow label={t.files.details.type} value={getFileViewerType(activeFile)} />
              <FileMetaRow
                label={t.files.details.extension}
                value={getFileExtension(activeFile)?.toUpperCase()}
              />
              <FileMetaRow
                label={t.files.details.size}
                value={formatFileSize(getFileSize(activeFile), t.files)}
              />
              <FileMetaRow
                label={t.files.details.visibility}
                value={getVisibilityLabel(activeFile.visibility, t.files)}
              />
              <FileMetaRow label={t.files.details.group} value={getEntityLabel(activeFile.group)} />
              <FileMetaRow
                label={t.files.details.subject}
                value={getEntityLabel(activeFile.subject)}
              />
              <FileMetaRow
                label={t.files.details.createdAt}
                value={formatDate(activeFile.created_at, locale)}
              />
              <FileMetaRow
                label={t.files.details.updatedAt}
                value={formatDate(activeFile.updated_at, locale)}
              />
            </Stack>
          </AppCard>
        </Stack>

        <AppCard variant="muted">
          <AppText color="secondary" variant="caption">
            {t.files.details.protectionNote}
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
