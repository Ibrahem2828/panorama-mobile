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
import { useTranslation, type TranslationCatalog } from '../../../i18n';
import { formatTime } from '../../../utils/formatDateTime';
import { SharedRoutes } from '../../../navigation/routes';
import type { HomeStackParamList } from '../../../navigation/types';
import { spacing } from '../../../theme';
import { FileCard } from '../components';
import { getFileDescription, getFileDisplayTitle, getFileExtension } from '../services';
import { useFilesStore } from '../store';
import type { FileResource } from '../types';

type FilesListScreenProps = NativeStackScreenProps<HomeStackParamList, 'FilesList'>;
type FilesCatalog = TranslationCatalog['files'];

function matchesSearch(file: FileResource, query: string, filesCatalog: FilesCatalog): boolean {
  if (!query) {
    return true;
  }

  const searchableText = [
    getFileDisplayTitle(file, filesCatalog),
    getFileDescription(file),
    getFileExtension(file),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return searchableText.includes(query.toLowerCase());
}

export function FilesListScreen({ navigation }: FilesListScreenProps) {
  const { t, locale } = useTranslation();
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
    () => files.filter((file) => matchesSearch(file, normalizedSearchQuery, t.files)),
    [files, normalizedSearchQuery, t.files],
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
        <AppHeader subtitle={t.files.subtitle} title={t.files.title} />
        <LoadingState message={t.files.loading} />
      </AppScreen>
    );
  }

  if (showInitialError) {
    return (
      <AppScreen contentContainerStyle={styles.content} scroll>
        <AppHeader subtitle={t.files.subtitle} title={t.files.title} />
        <ErrorState message={errorMessage ?? undefined} onRetry={handleRefresh} />
      </AppScreen>
    );
  }

  return (
    <AppScreen contentContainerStyle={styles.content} scroll>
      <Stack gap="xl">
        <AppHeader subtitle={t.files.subtitle} title={t.files.title} />

        <SectionHeader
          action={
            <AppButton
              loading={isRefreshing}
              onPress={handleRefresh}
              size="sm"
              title={t.common.refresh}
              variant="outline"
            />
          }
          subtitle={t.files.loadedCount(files.length)}
          title={t.files.listTitle}
        />

        <AppTextInput
          label={t.common.searchLocal}
          onChangeText={setSearchQuery}
          placeholder={t.files.searchPlaceholder}
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
                title={t.common.retryVerify}
                variant="outline"
              />
            }
            message={t.files.emptyMessage}
            title={t.files.emptyTitle}
            illustrationLabel={t.files.emptyIllustrationAlt}
            illustrationSource={images.emptyStates.files}
          />
        ) : visibleFiles.length === 0 ? (
          <EmptyState
            action={
              <AppButton
                onPress={() => setSearchQuery('')}
                title={t.common.searchClear}
                variant="outline"
              />
            }
            illustrationLabel={t.common.noSearchResultsAlt}
            illustrationSource={images.illustrations.search}
            message={t.common.searchNoResultsMessage}
            title={t.common.searchNoResultsTitle}
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
            {t.common.lastUpdatedAt(formatTime(lastLoadedAt, locale) ?? '')}
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
