import { useCallback, useEffect, useMemo, useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';

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
  Stack,
} from '../../../components';
import { useTranslation } from '../../../i18n';
import { GroupsRoutes } from '../../../navigation/routes';
import type { GroupsStackParamList } from '../../../navigation/types';
import { layout, spacing, useBrand } from '../../../theme';
import { GroupCard } from '../components';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { getGroupSubjectId, matchesGroupSearch } from '../services';
import { useGroupsStore } from '../store';
import type { Group } from '../types';

type MyGroupsScreenProps = NativeStackScreenProps<GroupsStackParamList, 'MyGroups'>;

export function MyGroupsScreen({ navigation }: MyGroupsScreenProps) {
  const { t } = useTranslation();
  const brand = useBrand();
  const [searchText, setSearchText] = useState('');
  const search = useDebouncedValue(searchText.trim(), 250);
  const myGroups = useGroupsStore((state) => state.myGroups);
  const isLoading = useGroupsStore((state) => state.isLoadingMyGroups);
  const isRefreshing = useGroupsStore((state) => state.isRefreshing);
  const errorMessage = useGroupsStore((state) => state.errorMessage);
  const actionError = useGroupsStore((state) => state.actionError);
  const successMessage = useGroupsStore((state) => state.successMessage);
  const subjectLabels = useGroupsStore((state) => state.subjectLabels);
  const loadMyGroups = useGroupsStore((state) => state.loadMyGroups);
  const loadSubjectLabels = useGroupsStore((state) => state.loadSubjectLabels);
  const refreshAllGroups = useGroupsStore((state) => state.refreshAllGroups);
  const setSelectedGroup = useGroupsStore((state) => state.setSelectedGroup);
  const clearError = useGroupsStore((state) => state.clearError);

  useEffect(() => {
    void loadMyGroups();
    void loadSubjectLabels();
  }, [loadMyGroups, loadSubjectLabels]);

  useEffect(() => clearError, [clearError]);

  const filteredGroups = useMemo(
    () =>
      myGroups.filter((group) => {
        const subjectKey = getGroupSubjectId(group);

        return matchesGroupSearch(
          group,
          search,
          t.groups,
          subjectKey ? subjectLabels[subjectKey] : null,
        );
      }),
    [myGroups, search, subjectLabels, t.groups],
  );

  const handleRefresh = useCallback(() => {
    void refreshAllGroups();
  }, [refreshAllGroups]);

  const handleGroupPress = useCallback(
    (group: Group) => {
      setSelectedGroup(group);
      navigation.navigate(GroupsRoutes.GroupDetails, { groupId: group.id });
    },
    [navigation, setSelectedGroup],
  );

  const renderItem = useCallback(
    ({ item }: { item: Group }) => {
      const subjectKey = getGroupSubjectId(item);

      return (
        <GroupCard
          group={item}
          onPress={handleGroupPress}
          subject={subjectKey ? subjectLabels[subjectKey] : null}
        />
      );
    },
    [handleGroupPress, subjectLabels],
  );

  const showInitialLoading = isLoading && myGroups.length === 0;
  const showInitialError = Boolean(errorMessage && myGroups.length === 0 && !isLoading);

  const listHeader = (
    <Stack gap="sm" style={styles.listHeader}>
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
      {errorMessage && myGroups.length > 0 ? (
        <ErrorState message={errorMessage} onRetry={handleRefresh} />
      ) : null}
      {myGroups.length > 0 ? (
        <AppText color="muted" variant="caption">
          {t.groups.available2.resultsCount(filteredGroups.length)}
        </AppText>
      ) : null}
    </Stack>
  );

  const listEmpty = showInitialLoading ? (
    <LoadingState message={t.groups.mine.loading} />
  ) : showInitialError ? (
    <ErrorState message={errorMessage ?? undefined} onRetry={handleRefresh} />
  ) : myGroups.length === 0 ? (
    <EmptyState
      action={
        <AppButton
          onPress={() => navigation.navigate(GroupsRoutes.AvailableGroups)}
          title={t.groups.emptyMine.action}
          variant="outline"
        />
      }
      illustrationLabel={t.groups.list.emptyIllustrationAlt}
      illustrationSource={images.emptyStates.groups}
      message={t.groups.mine.emptyMessage}
      title={t.groups.emptyMine.title}
    />
  ) : (
    <EmptyState
      action={
        <AppButton
          onPress={() => setSearchText('')}
          title={t.common.searchClear}
          variant="outline"
        />
      }
      illustrationLabel={t.common.noSearchResultsAlt}
      illustrationSource={images.illustrations.search}
      message={t.common.searchNoResultsMessage}
      title={t.common.searchNoResultsTitle}
    />
  );

  return (
    <AppScreen>
      <View style={styles.top}>
        <AppHeader
          leftAction={
            navigation.canGoBack() ? (
              <AppButton
                onPress={() => navigation.goBack()}
                title={t.common.back}
                variant="ghost"
              />
            ) : undefined
          }
          subtitle={t.groups.mine.subtitle}
          title={t.groups.mine.title}
        />
        {myGroups.length > 0 ? (
          <AppTextInput
            accessibilityLabel={t.groups.available2.searchLabel}
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={setSearchText}
            placeholder={t.groups.list.searchPlaceholder}
            returnKeyType="search"
            value={searchText}
          />
        ) : null}
      </View>

      <FlatList
        contentContainerStyle={styles.listContent}
        data={filteredGroups}
        ItemSeparatorComponent={Separator}
        keyboardShouldPersistTaps="handled"
        keyExtractor={keyExtractor}
        ListEmptyComponent={listEmpty}
        ListHeaderComponent={listHeader}
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
});
