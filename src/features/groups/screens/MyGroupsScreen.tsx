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

type MyGroupsScreenProps = NativeStackScreenProps<GroupsStackParamList, 'MyGroups'>;

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

export function MyGroupsScreen({ navigation }: MyGroupsScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const myGroups = useGroupsStore((state) => state.myGroups);
  const isLoadingMyGroups = useGroupsStore((state) => state.isLoadingMyGroups);
  const isRefreshing = useGroupsStore((state) => state.isRefreshing);
  const errorMessage = useGroupsStore((state) => state.errorMessage);
  const lastLoadedAt = useGroupsStore((state) => state.lastLoadedAt);
  const loadMyGroups = useGroupsStore((state) => state.loadMyGroups);
  const refreshAllGroups = useGroupsStore((state) => state.refreshAllGroups);
  const setSelectedGroup = useGroupsStore((state) => state.setSelectedGroup);
  const normalizedSearchQuery = searchQuery.trim();
  const filteredGroups = useMemo(
    () => myGroups.filter((group) => matchesGroupSearch(group, normalizedSearchQuery)),
    [myGroups, normalizedSearchQuery],
  );
  const showInitialLoading = isLoadingMyGroups && myGroups.length === 0;
  const showInitialError = Boolean(errorMessage && myGroups.length === 0);

  useEffect(() => {
    void loadMyGroups();
  }, [loadMyGroups]);

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
        <AppHeader subtitle="الغروبات المرتبطة بحسابك" title="غروباتي" />
        <LoadingState message="جاري تحميل غروباتك..." />
      </AppScreen>
    );
  }

  if (showInitialError) {
    return (
      <AppScreen contentContainerStyle={styles.content} scroll>
        <AppHeader subtitle="الغروبات المرتبطة بحسابك" title="غروباتي" />
        <ErrorState message={errorMessage ?? undefined} onRetry={handleRefresh} />
      </AppScreen>
    );
  }

  return (
    <AppScreen contentContainerStyle={styles.content} scroll>
      <Stack gap="xl">
        <AppHeader subtitle="الغروبات المرتبطة بحسابك" title="غروباتي" />

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
          subtitle={`عدد الغروبات المحملة: ${myGroups.length}`}
          title="القائمة"
        />

        {myGroups.length > 0 ? (
          <AppTextInput
            label="بحث محلي"
            onChangeText={setSearchQuery}
            placeholder="ابحث باسم الغروب أو وصفه"
            value={searchQuery}
          />
        ) : null}

        {errorMessage ? (
          <ErrorState message={errorMessage} onRetry={handleRefresh} />
        ) : myGroups.length === 0 ? (
          <EmptyState
            action={
              <AppButton
                loading={isRefreshing}
                onPress={handleRefresh}
                title="إعادة التحقق"
                variant="outline"
              />
            }
            message="لم تنضم إلى أي غروب بعد."
            title="لا توجد غروبات"
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
