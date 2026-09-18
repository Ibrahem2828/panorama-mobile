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
import { useTranslation } from '../../../i18n';
import { formatTime } from '../../../utils/formatDateTime';
import {
  SEARCH_CLEAR_LABEL,
  SEARCH_NO_RESULTS_MESSAGE,
  SEARCH_NO_RESULTS_TITLE,
} from '../../../utils/searchEmptyState';
import { getFileDisplayTitle, getFileDescription } from '../services';
import { SharedRoutes } from '../../../navigation/routes';
import type { GroupsStackParamList } from '../../../navigation/types';
import { spacing } from '../../../theme';
import { FileCard } from '../components';
import { useFilesStore } from '../store';
import type { FileResource } from '../types';

type GroupFilesScreenProps = NativeStackScreenProps<GroupsStackParamList, 'GroupFiles'>;

const EMPTY_GROUP_FILES: FileResource[] = [];

export function GroupFilesScreen({ navigation, route }: GroupFilesScreenProps) {
  const { t, locale } = useTranslation();
  const { groupId } = route.params;
  const groupKey = String(groupId);
  const groupFiles = useFilesStore(
    (state) => state.groupFilesByGroupId[groupKey] ?? EMPTY_GROUP_FILES,
  );
  const isLoadingGroupFiles = useFilesStore((state) => state.isLoadingGroupFiles);
  const isRefreshing = useFilesStore((state) => state.isRefreshing);
  const errorMessage = useFilesStore((state) => state.errorMessage);
  const lastLoadedAt = useFilesStore((state) => state.lastLoadedAt);
  const loadGroupFiles = useFilesStore((state) => state.loadGroupFiles);
  const refreshGroupFiles = useFilesStore((state) => state.refreshGroupFiles);
  const setSelectedFile = useFilesStore((state) => state.setSelectedFile);
  const [search, setSearch] = useState('');
  const normalizedSearch = search.trim().toLowerCase();
  const filteredGroupFiles = useMemo(() => {
    if (!normalizedSearch) {
      return groupFiles;
    }

    return groupFiles.filter((file) => {
      const title = getFileDisplayTitle(file, t.files).toLowerCase();
      const description = getFileDescription(file)?.toLowerCase() ?? '';

      return title.includes(normalizedSearch) || description.includes(normalizedSearch);
    });
  }, [groupFiles, normalizedSearch]);
  const showInitialLoading = isLoadingGroupFiles && groupFiles.length === 0;
  const showInitialError = Boolean(errorMessage && groupFiles.length === 0);

  useEffect(() => {
    void loadGroupFiles(groupId);
  }, [groupId, loadGroupFiles]);

  function handleRefresh() {
    void refreshGroupFiles(groupId);
  }

  function handleFilePress(file: FileResource) {
    setSelectedFile(file);
    navigation.navigate(SharedRoutes.FileDetails, { fileId: file.id });
  }

  if (showInitialLoading) {
    return (
      <AppScreen contentContainerStyle={styles.content} scroll>
        <AppHeader subtitle={t.files.groupFiles.subtitle} title={t.files.groupFiles.title} />
        <LoadingState message={t.files.groupFiles.loading} />
      </AppScreen>
    );
  }

  if (showInitialError) {
    return (
      <AppScreen contentContainerStyle={styles.content} scroll>
        <AppHeader subtitle={t.files.groupFiles.subtitle} title={t.files.groupFiles.title} />
        <ErrorState message={errorMessage ?? undefined} onRetry={handleRefresh} />
      </AppScreen>
    );
  }

  return (
    <AppScreen contentContainerStyle={styles.content} scroll>
      <Stack gap="xl">
        <Stack gap="md">
          <AppHeader subtitle={t.files.groupFiles.subtitle} title={t.files.groupFiles.title} />
          <AppButton
            onPress={() => navigation.goBack()}
            title={t.files.groupFiles.backToGroup}
            variant="ghost"
          />
        </Stack>

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
          subtitle={t.files.groupFiles.shownCount(filteredGroupFiles.length)}
          title={t.files.groupFiles.listTitle}
        />

        <AppTextInput
          label={t.common.searchLocal}
          onChangeText={setSearch}
          placeholder={t.files.groupFiles.searchPlaceholder}
          value={search}
        />

        {errorMessage ? (
          <ErrorState message={errorMessage} onRetry={handleRefresh} />
        ) : groupFiles.length === 0 ? (
          <EmptyState
            action={
              <AppButton
                loading={isRefreshing}
                onPress={handleRefresh}
                title={t.common.retryVerify}
                variant="outline"
              />
            }
            message={t.files.groupFiles.emptyMessage}
            title={t.files.emptyTitle}
            illustrationLabel={t.files.emptyIllustrationAlt}
            illustrationSource={images.emptyStates.files}
          />
        ) : filteredGroupFiles.length === 0 ? (
          <EmptyState
            action={
              <AppButton
                onPress={() => setSearch('')}
                title={SEARCH_CLEAR_LABEL}
                variant="outline"
              />
            }
            illustrationLabel={t.common.noSearchResultsAlt}
            illustrationSource={images.illustrations.search}
            message={SEARCH_NO_RESULTS_MESSAGE}
            title={SEARCH_NO_RESULTS_TITLE}
          />
        ) : (
          <Stack gap="md">
            {filteredGroupFiles.map((file) => (
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
