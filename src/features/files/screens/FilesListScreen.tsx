import { useEffect, useMemo, useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet } from 'react-native';

import { images } from '../../../assets/images';
import {
  AppButton,
  AppHeader,
  AppScreen,
  AppText,
  AppTextInput,
  EmptyState,
  ErrorState,
  LoadingState,
  SectionHeader,
  Stack,
} from '../../../components';
import { SharedRoutes } from '../../../navigation/routes';
import type { HomeStackParamList } from '../../../navigation/types';
import { spacing } from '../../../theme';
import {
  SEARCH_CLEAR_LABEL,
  SEARCH_NO_RESULTS_MESSAGE,
  SEARCH_NO_RESULTS_TITLE,
} from '../../../utils/searchEmptyState';
import { FileCard } from '../components';
import { getFileDescription, getFileDisplayTitle, getFileExtension } from '../services';
import { useFilesStore } from '../store';
import type { FileResource } from '../types';

type FilesListScreenProps = NativeStackScreenProps<HomeStackParamList, 'FilesList'>;

function matchesSearch(file: FileResource, query: string): boolean {
  if (!query) {
    return true;
  }

  const searchableText = [
    getFileDisplayTitle(file),
    getFileDescription(file),
    getFileExtension(file),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return searchableText.includes(query.toLowerCase());
}

export function FilesListScreen({ navigation }: FilesListScreenProps) {
  const files = useFilesStore((state) => state.files);
  const isLoadingFiles = useFilesStore((state) => state.isLoadingFiles);
  const isRefreshing = useFilesStore((state) => state.isRefreshing);
  const errorMessage = useFilesStore((state) => state.errorMessage);
  const lastLoadedAt = useFilesStore((state) => state.lastLoadedAt);
  const loadFiles = useFilesStore((state) => state.loadFiles);
  const refreshFiles = useFilesStore((state) => state.refreshFiles);
  const setSelectedFile = useFilesStore((state) => state.setSelectedFile);
  const [searchQuery, setSearchQuery] = useState('');
  const normalizedSearchQuery = searchQuery.trim();
  const visibleFiles = useMemo(
    () => files.filter((file) => matchesSearch(file, normalizedSearchQuery)),
    [files, normalizedSearchQuery],
  );
  const showInitialLoading = isLoadingFiles && files.length === 0;
  const showInitialError = Boolean(errorMessage && files.length === 0);

  useEffect(() => {
    void loadFiles();
  }, [loadFiles]);

  function handleRefresh() {
    void refreshFiles();
  }

  function handleFilePress(file: FileResource) {
    setSelectedFile(file);
    navigation.navigate(SharedRoutes.FileDetails, { fileId: file.id });
  }

  if (showInitialLoading) {
    return (
      <AppScreen contentContainerStyle={styles.content} scroll>
        <AppHeader subtitle="الملفات المتاحة حسب صلاحيات حسابك" title="الملفات" />
        <LoadingState message="جاري تحميل الملفات..." />
      </AppScreen>
    );
  }

  if (showInitialError) {
    return (
      <AppScreen contentContainerStyle={styles.content} scroll>
        <AppHeader subtitle="الملفات المتاحة حسب صلاحيات حسابك" title="الملفات" />
        <ErrorState message={errorMessage ?? undefined} onRetry={handleRefresh} />
      </AppScreen>
    );
  }

  return (
    <AppScreen contentContainerStyle={styles.content} scroll>
      <Stack gap="xl">
        <AppHeader subtitle="الملفات المتاحة حسب صلاحيات حسابك" title="الملفات" />

        <SectionHeader
          action={
            <AppButton
              loading={isRefreshing}
              onPress={handleRefresh}
              size="sm"
              title="تحديث"
              variant="outline"
            />
          }
          subtitle={`عدد الملفات المحملة: ${files.length}`}
          title="قائمة الملفات"
        />

        <AppTextInput
          label="بحث محلي"
          onChangeText={setSearchQuery}
          placeholder="ابحث باسم الملف أو نوعه"
          value={searchQuery}
        />

        {errorMessage ? (
          <ErrorState message={errorMessage} onRetry={handleRefresh} />
        ) : files.length === 0 ? (
          <EmptyState
            action={
              <AppButton
                loading={isRefreshing}
                onPress={handleRefresh}
                title="إعادة التحقق"
                variant="outline"
              />
            }
            message="لا توجد ملفات متاحة حاليا."
            title="لا توجد ملفات"
            illustrationLabel="رسم يوضح عدم وجود ملفات"
            illustrationSource={images.emptyStates.files}
          />
        ) : visibleFiles.length === 0 ? (
          <EmptyState
            action={
              <AppButton
                onPress={() => setSearchQuery('')}
                title={SEARCH_CLEAR_LABEL}
                variant="outline"
              />
            }
            illustrationLabel="رسم يوضح عدم وجود نتائج بحث"
            illustrationSource={images.illustrations.search}
            message={SEARCH_NO_RESULTS_MESSAGE}
            title={SEARCH_NO_RESULTS_TITLE}
          />
        ) : (
          <Stack gap="md">
            {visibleFiles.map((file) => (
              <FileCard file={file} key={String(file.id)} onPress={() => handleFilePress(file)} />
            ))}
          </Stack>
        )}

        {lastLoadedAt ? (
          <AppText align="center" color="muted" variant="caption">
            آخر تحديث: {new Date(lastLoadedAt).toLocaleTimeString('ar-SY')}
          </AppText>
        ) : null}
      </Stack>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
  },
});
