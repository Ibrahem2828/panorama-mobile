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
import { GroupsRoutes } from '../../../navigation/routes';
import type { GroupsStackParamList } from '../../../navigation/types';
import { spacing } from '../../../theme';
import {
  SEARCH_CLEAR_LABEL,
  SEARCH_NO_RESULTS_MESSAGE,
  SEARCH_NO_RESULTS_TITLE,
} from '../../../utils/searchEmptyState';
import { GroupCard } from '../components';
import { getGroupDescription, getGroupDisplayName } from '../services';
import { useGroupsStore } from '../store';
import type { Group } from '../types';

type AvailableGroupsScreenProps = NativeStackScreenProps<GroupsStackParamList, 'AvailableGroups'>;

function matchesGroupSearch(group: Group, query: string): boolean {
  if (!query) {
    return true;
  }

  const searchableText = [getGroupDisplayName(group), getGroupDescription(group)]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return searchableText.includes(query.toLowerCase());
}

export function AvailableGroupsScreen({ navigation }: AvailableGroupsScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const availableGroups = useGroupsStore((state) => state.availableGroups);
  const isLoadingAvailable = useGroupsStore((state) => state.isLoadingAvailable);
  const isRefreshing = useGroupsStore((state) => state.isRefreshing);
  const errorMessage = useGroupsStore((state) => state.errorMessage);
  const lastLoadedAt = useGroupsStore((state) => state.lastLoadedAt);
  const loadAvailableGroups = useGroupsStore((state) => state.loadAvailableGroups);
  const refreshAllGroups = useGroupsStore((state) => state.refreshAllGroups);
  const setSelectedGroup = useGroupsStore((state) => state.setSelectedGroup);
  const normalizedSearchQuery = searchQuery.trim();
  const filteredGroups = useMemo(
    () => availableGroups.filter((group) => matchesGroupSearch(group, normalizedSearchQuery)),
    [availableGroups, normalizedSearchQuery],
  );
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
        <AppHeader subtitle="المجموعات التي يمكنك طلب الانضمام إليها" title="المجموعات المتاحة" />
        <LoadingState message="جاري تحميل المجموعات المتاحة..." />
      </AppScreen>
    );
  }

  if (showInitialError) {
    return (
      <AppScreen contentContainerStyle={styles.content} scroll>
        <AppHeader subtitle="المجموعات التي يمكنك طلب الانضمام إليها" title="المجموعات المتاحة" />
        <ErrorState message={errorMessage ?? undefined} onRetry={handleRefresh} />
      </AppScreen>
    );
  }

  return (
    <AppScreen contentContainerStyle={styles.content} scroll>
      <Stack gap="xl">
        <AppHeader subtitle="المجموعات التي يمكنك طلب الانضمام إليها" title="المجموعات المتاحة" />

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
          subtitle={`عدد المجموعات المحملة: ${availableGroups.length}`}
          title="القائمة"
        />

        {availableGroups.length > 0 ? (
          <AppTextInput
            label="بحث محلي"
            onChangeText={setSearchQuery}
            placeholder="ابحث باسم المجموعة أو وصفها"
            value={searchQuery}
          />
        ) : null}

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
            message="لا توجد مجموعات متاحة حاليا."
            title="لا توجد مجموعات"
            illustrationLabel="رسم يوضح عدم وجود مجموعات"
            illustrationSource={images.emptyStates.groups}
          />
        ) : filteredGroups.length === 0 ? (
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
            {filteredGroups.map((group) => (
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
