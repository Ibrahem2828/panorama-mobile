import { useEffect } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet } from 'react-native';

import {
  AppButton,
  AppHeader,
  AppScreen,
  AppText,
  EmptyState,
  ErrorState,
  LoadingState,
  SectionHeader,
  Stack,
} from '../../../components';
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
        <AppHeader subtitle="ملفات الغروب المتاحة للأعضاء" title="ملفات الغروب" />
        <LoadingState message="جاري تحميل ملفات الغروب..." />
      </AppScreen>
    );
  }

  if (showInitialError) {
    return (
      <AppScreen contentContainerStyle={styles.content} scroll>
        <AppHeader subtitle="ملفات الغروب المتاحة للأعضاء" title="ملفات الغروب" />
        <ErrorState message={errorMessage ?? undefined} onRetry={handleRefresh} />
      </AppScreen>
    );
  }

  return (
    <AppScreen contentContainerStyle={styles.content} scroll>
      <Stack gap="xl">
        <Stack gap="md">
          <AppHeader subtitle="ملفات الغروب المتاحة للأعضاء" title="ملفات الغروب" />
          <AppButton onPress={() => navigation.goBack()} title="رجوع إلى الغروب" variant="ghost" />
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
          subtitle={`عدد الملفات المحملة: ${groupFiles.length}`}
          title="القائمة"
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
            message="لا توجد ملفات لهذا الغروب حاليا."
            title="لا توجد ملفات"
          />
        ) : (
          <Stack gap="md">
            {groupFiles.map((file) => (
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
