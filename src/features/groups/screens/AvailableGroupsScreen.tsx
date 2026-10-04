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
import { GroupsRoutes } from '../../../navigation/routes';
import type { GroupsStackParamList } from '../../../navigation/types';
import { spacing } from '../../../theme';
import { GroupCard } from '../components';
import { getGroupDescription, getGroupDisplayName } from '../services';
import { useGroupsStore } from '../store';
import type { Group } from '../types';

type AvailableGroupsScreenProps = NativeStackScreenProps<GroupsStackParamList, 'AvailableGroups'>;

function matchesGroupSearch(
  group: Group,
  query: string,
  groupsCatalog: TranslationCatalog['groups'],
): boolean {
  if (!query) {
    return true;
  }

  const searchableText = [getGroupDisplayName(group, groupsCatalog), getGroupDescription(group)]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return searchableText.includes(query.toLowerCase());
}

export function AvailableGroupsScreen({ navigation }: AvailableGroupsScreenProps) {
  const { t, locale } = useTranslation();
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
    () =>
      availableGroups.filter((group) => matchesGroupSearch(group, normalizedSearchQuery, t.groups)),
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
        <AppHeader subtitle={t.groups.available.subtitle} title={t.groups.available.title} />
        <LoadingState message={t.groups.available.loading} />
      </AppScreen>
    );
  }

  if (showInitialError) {
    return (
      <AppScreen contentContainerStyle={styles.content} scroll>
        <AppHeader subtitle={t.groups.available.subtitle} title={t.groups.available.title} />
        <ErrorState message={errorMessage ?? undefined} onRetry={handleRefresh} />
      </AppScreen>
    );
  }

  return (
    <AppScreen contentContainerStyle={styles.content} scroll>
      <Stack gap="xl">
        <AppHeader subtitle={t.groups.available.subtitle} title={t.groups.available.title} />

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
          subtitle={t.groups.list.loadedCount(availableGroups.length)}
          title={t.groups.list.title}
        />

        {availableGroups.length > 0 ? (
          <AppTextInput
            label={t.common.searchLocal}
            onChangeText={setSearchQuery}
            placeholder={t.groups.list.searchPlaceholder}
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
                title={t.common.retryVerify}
                variant="outline"
              />
            }
            message={t.groups.available.emptyMessage}
            title={t.groups.list.emptyTitle}
            illustrationLabel={t.groups.list.emptyIllustrationAlt}
            illustrationSource={images.emptyStates.groups}
          />
        ) : filteredGroups.length === 0 ? (
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
