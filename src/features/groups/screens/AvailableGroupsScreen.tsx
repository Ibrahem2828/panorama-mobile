import { useCallback, useEffect, useMemo, useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import {
  AppButton,
  AppCard,
  AppHeader,
  AppScreen,
  AppText,
  AppTextInput,
  EmptyState,
  ErrorState,
  LoadingState,
  Stack,
} from '../../../components';
import { useTranslation } from '../../../i18n';
import { GroupsRoutes } from '../../../navigation/routes';
import type { GroupsStackParamList } from '../../../navigation/types';
import { layout, spacing, useBrand } from '../../../theme';
import { GroupCard } from '../components';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { getGroupSubjectId } from '../services';
import { useGroupsStore } from '../store';
import type { Group, Id } from '../types';

type AvailableGroupsScreenProps = NativeStackScreenProps<GroupsStackParamList, 'AvailableGroups'>;

const SEARCH_DEBOUNCE_MS = 400;

function toSubjectId(value: unknown): string | null {
  return (typeof value === 'string' && /^\d{1,12}$/u.test(value)) || typeof value === 'number'
    ? String(value)
    : null;
}

export function AvailableGroupsScreen({ navigation, route }: AvailableGroupsScreenProps) {
  const { t } = useTranslation();
  const brand = useBrand();
  const routeSubjectId = toSubjectId(route.params?.subjectId);
  const [subjectId, setSubjectId] = useState<string | null>(routeSubjectId);
  const [searchText, setSearchText] = useState('');
  const search = useDebouncedValue(searchText.trim(), SEARCH_DEBOUNCE_MS);

  const groups = useGroupsStore((state) => state.availableGroups);
  const availableCount = useGroupsStore((state) => state.availableCount);
  const hasMore = useGroupsStore((state) => state.availableHasMore);
  const isLoading = useGroupsStore((state) => state.isLoadingAvailable);
  const isLoadingMore = useGroupsStore((state) => state.isLoadingMoreAvailable);
  const isRefreshing = useGroupsStore((state) => state.isRefreshing);
  const errorMessage = useGroupsStore((state) => state.errorMessage);
  const actionError = useGroupsStore((state) => state.actionError);
  const successMessage = useGroupsStore((state) => state.successMessage);
  const pendingActions = useGroupsStore((state) => state.pendingActions);
  const subjectLabels = useGroupsStore((state) => state.subjectLabels);
  const loadAvailableGroups = useGroupsStore((state) => state.loadAvailableGroups);
  const loadMoreAvailableGroups = useGroupsStore((state) => state.loadMoreAvailableGroups);
  const loadSubjectLabels = useGroupsStore((state) => state.loadSubjectLabels);
  const refreshAllGroups = useGroupsStore((state) => state.refreshAllGroups);
  const joinGroup = useGroupsStore((state) => state.joinGroup);
  const setSelectedGroup = useGroupsStore((state) => state.setSelectedGroup);
  const clearError = useGroupsStore((state) => state.clearError);

  // A new subject from navigation (e.g. the subject details screen) replaces the local one.
  useEffect(() => {
    setSubjectId(routeSubjectId);
  }, [routeSubjectId]);

  useEffect(() => {
    void loadAvailableGroups({ search, subjectId });
  }, [loadAvailableGroups, search, subjectId]);

  useEffect(() => {
    void loadSubjectLabels();
  }, [loadSubjectLabels]);

  useEffect(() => clearError, [clearError]);

  const handleRefresh = useCallback(() => {
    void refreshAllGroups();
  }, [refreshAllGroups]);

  const handleLoadMore = useCallback(() => {
    void loadMoreAvailableGroups();
  }, [loadMoreAvailableGroups]);

  const handleShowAll = useCallback(() => {
    setSubjectId(null);
    navigation.setParams({ subjectId: undefined });
  }, [navigation]);

  const handleClearSearch = useCallback(() => setSearchText(''), []);

  const handleGroupPress = useCallback(
    (group: Group) => {
      setSelectedGroup(group);
      navigation.navigate(GroupsRoutes.GroupDetails, { groupId: group.id });
    },
    [navigation, setSelectedGroup],
  );

  const handleJoin = useCallback(
    (groupId: Id) => {
      void joinGroup(groupId);
    },
    [joinGroup],
  );

  const renderItem = useCallback(
    ({ item }: { item: Group }) => {
      const subjectKey = getGroupSubjectId(item);

      return (
        <GroupCard
          group={item}
          onJoin={handleJoin}
          onPress={handleGroupPress}
          pendingAction={pendingActions[String(item.id)]}
          subject={subjectKey ? subjectLabels[subjectKey] : null}
        />
      );
    },
    [handleGroupPress, handleJoin, pendingActions, subjectLabels],
  );

  const hasFilters = Boolean(search || subjectId);
  const showInitialLoading = isLoading && groups.length === 0;
  const showInitialError = Boolean(errorMessage && groups.length === 0 && !isLoading);

  const listHeader = useMemo(
    () => (
      <Stack gap="md" style={styles.listHeader}>
        {subjectId ? (
          <AppCard variant="muted">
            <Stack gap="sm">
              <AppText color="secondary" variant="bodySmall">
                {t.groups.available2.subjectFilterActive}
              </AppText>
              <AppButton
                onPress={handleShowAll}
                size="sm"
                title={t.groups.available2.showAllGroups}
                variant="outline"
              />
            </Stack>
          </AppCard>
        ) : null}
        {actionError ? (
          <AppText color="error" variant="bodySmall">
            {actionError}
          </AppText>
        ) : null}
        {successMessage ? (
          <AppText color="success" variant="bodySmall">
            {successMessage}
          </AppText>
        ) : null}
        {errorMessage && groups.length > 0 ? (
          <ErrorState message={errorMessage} onRetry={handleRefresh} />
        ) : null}
        {groups.length > 0 ? (
          <AppText color="muted" variant="caption">
            {t.groups.available2.resultsCount(availableCount || groups.length)}
          </AppText>
        ) : null}
      </Stack>
    ),
    [
      actionError,
      availableCount,
      errorMessage,
      groups.length,
      handleRefresh,
      handleShowAll,
      subjectId,
      successMessage,
      t,
    ],
  );

  const listEmpty = showInitialLoading ? (
    <LoadingState message={t.groups.available.loading} />
  ) : showInitialError ? (
    <ErrorState message={errorMessage ?? undefined} onRetry={handleRefresh} />
  ) : hasFilters ? (
    <EmptyState
      action={
        <AppButton
          onPress={subjectId && !search ? handleShowAll : handleClearSearch}
          title={subjectId && !search ? t.groups.available2.showAllGroups : t.common.searchClear}
          variant="outline"
        />
      }
      illustrationLabel={t.common.noSearchResultsAlt}
      artwork="search"
      message={t.common.searchNoResultsMessage}
      title={t.common.searchNoResultsTitle}
    />
  ) : (
    <EmptyState
      action={<AppButton onPress={handleRefresh} title={t.common.refresh} variant="outline" />}
      illustrationLabel={t.groups.list.emptyIllustrationAlt}
      artwork="groups"
      message={t.groups.available.emptyMessage}
      title={t.groups.list.emptyTitle}
    />
  );

  const listFooter = isLoadingMore ? (
    <View style={styles.footer}>
      <ActivityIndicator color={brand.primary} />
      <AppText color="muted" variant="caption">
        {t.groups.available2.loadingMore}
      </AppText>
    </View>
  ) : hasMore && groups.length > 0 ? (
    <View style={styles.footer}>
      <AppButton
        onPress={handleLoadMore}
        size="sm"
        title={t.groups.available2.loadMore}
        variant="outline"
      />
    </View>
  ) : null;

  return (
    <AppScreen>
      <View style={styles.top}>
        <AppHeader subtitle={t.groups.available.subtitle} title={t.groups.available.title} />
        <AppTextInput
          accessibilityLabel={t.groups.available2.searchLabel}
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={setSearchText}
          placeholder={t.groups.list.searchPlaceholder}
          returnKeyType="search"
          value={searchText}
        />
      </View>

      <FlatList
        contentContainerStyle={styles.listContent}
        data={groups}
        ItemSeparatorComponent={Separator}
        keyboardShouldPersistTaps="handled"
        keyExtractor={keyExtractor}
        ListEmptyComponent={listEmpty}
        ListFooterComponent={listFooter}
        ListHeaderComponent={listHeader}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.6}
        refreshControl={
          <RefreshControl
            colors={[brand.primary]}
            onRefresh={handleRefresh}
            refreshing={isRefreshing}
            tintColor={brand.primary}
          />
        }
        removeClippedSubviews
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        style={styles.list}
      />
    </AppScreen>
  );
}

function keyExtractor(item: Group) {
  return String(item.id);
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  top: {
    gap: spacing.md,
    paddingTop: layout.screenVerticalPadding,
  },
  list: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: layout.screenVerticalPadding,
    paddingTop: spacing.md,
  },
  listHeader: {
    marginBottom: spacing.md,
  },
  separator: {
    height: spacing.md,
  },
  footer: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
});
