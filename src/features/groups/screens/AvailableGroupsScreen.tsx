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
import { GroupsRoutes } from '../../../navigation/routes';
import type { GroupsStackParamList } from '../../../navigation/types';
import { spacing } from '../../../theme';
import { GroupCard } from '../components';
import { useGroupsStore } from '../store';
import type { Group } from '../types';

type AvailableGroupsScreenProps = NativeStackScreenProps<GroupsStackParamList, 'AvailableGroups'>;

export function AvailableGroupsScreen({ navigation }: AvailableGroupsScreenProps) {
  const availableGroups = useGroupsStore((state) => state.availableGroups);
  const isLoadingAvailable = useGroupsStore((state) => state.isLoadingAvailable);
  const isRefreshing = useGroupsStore((state) => state.isRefreshing);
  const errorMessage = useGroupsStore((state) => state.errorMessage);
  const lastLoadedAt = useGroupsStore((state) => state.lastLoadedAt);
  const loadAvailableGroups = useGroupsStore((state) => state.loadAvailableGroups);
  const refreshAllGroups = useGroupsStore((state) => state.refreshAllGroups);
  const setSelectedGroup = useGroupsStore((state) => state.setSelectedGroup);
  const showInitialLoading = isLoadingAvailable && availableGroups.length === 0;
  const showInitialError = Boolean(errorMessage && availableGroups.length === 0);

  useEffect(() => {
    void loadAvailableGroups();
  }, [loadAvailableGroups]);

  function handleRefresh() {
    void refreshAllGroups();
  }

  function handleGroupPress(group: Group) {
    setSelectedGroup(group);
    navigation.navigate(GroupsRoutes.GroupDetails, { groupId: group.id });
  }

  if (showInitialLoading) {
    return (
      <AppScreen contentContainerStyle={styles.content} scroll>
        <AppHeader subtitle="الغروبات التي يمكنك طلب الانضمام إليها" title="الغروبات المتاحة" />
        <LoadingState message="جاري تحميل الغروبات المتاحة..." />
      </AppScreen>
    );
  }

  if (showInitialError) {
    return (
      <AppScreen contentContainerStyle={styles.content} scroll>
        <AppHeader subtitle="الغروبات التي يمكنك طلب الانضمام إليها" title="الغروبات المتاحة" />
        <ErrorState message={errorMessage ?? undefined} onRetry={handleRefresh} />
      </AppScreen>
    );
  }

  return (
    <AppScreen contentContainerStyle={styles.content} scroll>
      <Stack gap="xl">
        <AppHeader subtitle="الغروبات التي يمكنك طلب الانضمام إليها" title="الغروبات المتاحة" />

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
          subtitle={`عدد الغروبات المحملة: ${availableGroups.length}`}
          title="القائمة"
        />

        {errorMessage ? (
          <ErrorState message={errorMessage} onRetry={handleRefresh} />
        ) : availableGroups.length === 0 ? (
          <EmptyState
            action={
              <AppButton
                loading={isRefreshing}
                onPress={handleRefresh}
                title="إعادة التحقق"
                variant="outline"
              />
            }
            message="لا توجد غروبات متاحة حاليا."
            title="لا توجد غروبات"
          />
        ) : (
          <Stack gap="md">
            {availableGroups.map((group) => (
              <GroupCard
                group={group}
                key={String(group.id)}
                onPress={() => handleGroupPress(group)}
              />
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
