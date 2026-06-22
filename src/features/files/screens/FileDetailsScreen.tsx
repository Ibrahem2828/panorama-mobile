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
  getFileUri,
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

function formatDate(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleDateString('ar-SY');
}

export function FileDetailsScreen() {
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
  const fileUri = activeFile ? getFileUri(activeFile) : null;

  useEffect(() => {
    void loadFileDetail(fileId);
  }, [fileId, loadFileDetail]);

  function handleRetry() {
    void loadFileDetail(fileId);
  }

  function handleOpenViewer(file: FileResource) {
    navigation.navigate(SharedRoutes.PdfViewer, {
      fileId: file.id,
      title: getFileDisplayTitle(file),
    });
  }

  function handleRequestPrint(file: FileResource) {
    navigation.getParent<AppTabsNavigation>()?.navigate(TabRoutes.Printing, {
      screen: PrintingRoutes.CreatePrintOrder,
      params: {
        fileId: file.id,
        fileTitle: getFileDisplayTitle(file),
      },
    });
  }

  if (showInitialLoading) {
    return (
      <AppScreen contentContainerStyle={styles.content} scroll>
        <AppHeader subtitle="تفاصيل الملف" title="الملفات" />
        <LoadingState message="جاري تحميل تفاصيل الملف..." />
      </AppScreen>
    );
  }

  if (!activeFile) {
    return (
      <AppScreen contentContainerStyle={styles.content} scroll>
        <Stack gap="lg">
          <AppHeader subtitle="تفاصيل الملف" title="الملفات" />
          <AppButton onPress={() => navigation.goBack()} title="رجوع" variant="ghost" />
          <ErrorState
            message={errorMessage ?? 'تعذر تحميل تفاصيل الملف.'}
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
          <AppHeader subtitle="تفاصيل الملف" title="الملفات" />
          <AppButton onPress={() => navigation.goBack()} title="رجوع" variant="ghost" />
        </Stack>

        <FileDetailHeader file={activeFile} />

        {errorMessage ? <ErrorState message={errorMessage} onRetry={handleRetry} /> : null}

        <Stack direction="horizontal" gap="md" wrap>
          <AppButton
            disabled={!fileUri}
            onPress={() => handleOpenViewer(activeFile)}
            title="فتح داخل التطبيق"
          />
          <AppButton
            onPress={() => handleRequestPrint(activeFile)}
            title="طلب طباعة"
            variant="outline"
          />
        </Stack>

        {!fileUri ? (
          <AppCard variant="muted">
            <AppText color="error" variant="bodySmall">
              لا يتوفر رابط صالح لعرض الملف.
            </AppText>
          </AppCard>
        ) : null}

        <AppCard variant="muted">
          <Stack gap="sm">
            <AppText variant="title">الوصف</AppText>
            <AppText color="secondary" variant="bodySmall">
              {getFileDescription(activeFile) ?? 'لا يوجد وصف متاح لهذا الملف.'}
            </AppText>
          </Stack>
        </AppCard>

        <Stack gap="md">
          <SectionHeader subtitle="بيانات الملف كما يسمح بها الباك إند." title="معلومات الملف" />
          <AppCard>
            <Stack gap="sm">
              <FileMetaRow label="النوع" value={getFileViewerType(activeFile)} />
              <FileMetaRow label="الامتداد" value={getFileExtension(activeFile)?.toUpperCase()} />
              <FileMetaRow label="الحجم" value={formatFileSize(getFileSize(activeFile))} />
              <FileMetaRow label="الصلاحية" value={getVisibilityLabel(activeFile.visibility)} />
              <FileMetaRow label="المجموعة" value={getEntityLabel(activeFile.group)} />
              <FileMetaRow label="المادة" value={getEntityLabel(activeFile.subject)} />
              <FileMetaRow label="تاريخ الإنشاء" value={formatDate(activeFile.created_at)} />
              <FileMetaRow label="آخر تحديث" value={formatDate(activeFile.updated_at)} />
            </Stack>
          </AppCard>
        </Stack>

        <AppCard variant="muted">
          <AppText color="secondary" variant="caption">
            لا يوجد زر تنزيل أو مشاركة. إخفاء التنزيل في الواجهة لا يعني حماية مطلقة للملف؛ صلاحيات
            الوصول يفرضها الباك إند.
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
