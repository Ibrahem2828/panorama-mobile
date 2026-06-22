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
      const title = getFileDisplayTitle(file).toLowerCase();
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
        <AppHeader subtitle="ملفات المجموعة المتاحة للأعضاء" title="ملفات المجموعة" />
        <LoadingState message="جاري تحميل ملفات المجموعة..." />
      </AppScreen>
    );
  }

  if (showInitialError) {
    return (
      <AppScreen contentContainerStyle={styles.content} scroll>
        <AppHeader subtitle="ملفات المجموعة المتاحة للأعضاء" title="ملفات المجموعة" />
        <ErrorState message={errorMessage ?? undefined} onRetry={handleRefresh} />
      </AppScreen>
    );
  }

  return (
    <AppScreen contentContainerStyle={styles.content} scroll>
      <Stack gap="xl">
        <Stack gap="md">
          <AppHeader subtitle="ملفات المجموعة المتاحة للأعضاء" title="ملفات المجموعة" />
          <AppButton
            onPress={() => navigation.goBack()}
            title="رجوع إلى المجموعة"
            variant="ghost"
          />
        </Stack>

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
          subtitle={`عدد الملفات المعروضة: ${filteredGroupFiles.length}`}
          title="القائمة"
        />

        <AppTextInput
          label="بحث محلي"
          onChangeText={setSearch}
          placeholder="ابحث بعنوان الملف أو الوصف"
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
                title="إعادة التحقق"
                variant="outline"
              />
            }
            message="لا توجد ملفات لهذا المجموعة حاليا."
            title="لا توجد ملفات"
            illustrationLabel="رسم يوضح عدم وجود ملفات"
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
            illustrationLabel="رسم يوضح عدم وجود نتائج بحث"
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
