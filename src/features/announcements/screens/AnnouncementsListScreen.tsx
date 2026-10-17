import { useCallback, useEffect } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { images } from '../../../assets/images';
import {
  AppButton,
  AppHeader,
  AppScreen,
  AppText,
  EmptyState,
  ErrorState,
  LoadingState,
  Stack,
} from '../../../components';
import { useTranslation } from '../../../i18n';
import { HomeRoutes } from '../../../navigation/routes';
import type { HomeStackParamList } from '../../../navigation/types';
import { layout, spacing, useBrand } from '../../../theme';
import { AnnouncementListItem } from '../components/AnnouncementListItem';
import { useAnnouncementsStore } from '../store';
import type { AnnouncementItem } from '../types';

type Props = NativeStackScreenProps<HomeStackParamList, 'AnnouncementsList'>;

function keyExtractor(item: AnnouncementItem) {
  return String(item.id);
}

export function AnnouncementsListScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const brand = useBrand();
  const items = useAnnouncementsStore((state) => state.items);
  const total = useAnnouncementsStore((state) => state.total);
  const readIds = useAnnouncementsStore((state) => state.readIds);
  const hasLoaded = useAnnouncementsStore((state) => state.hasLoaded);
  const isLoading = useAnnouncementsStore((state) => state.isLoading);
  const isRefreshing = useAnnouncementsStore((state) => state.isRefreshing);
  const isLoadingMore = useAnnouncementsStore((state) => state.isLoadingMore);
  const nextPage = useAnnouncementsStore((state) => state.nextPage);
  const errorMessage = useAnnouncementsStore((state) => state.errorMessage);
  const loadMoreErrorMessage = useAnnouncementsStore((state) => state.loadMoreErrorMessage);
  const hydrateReadIds = useAnnouncementsStore((state) => state.hydrateReadIds);
  const loadFirstPage = useAnnouncementsStore((state) => state.loadFirstPage);
  const refresh = useAnnouncementsStore((state) => state.refresh);
  const loadMore = useAnnouncementsStore((state) => state.loadMore);

  useEffect(() => {
    void hydrateReadIds();
    void loadFirstPage();
  }, [hydrateReadIds, loadFirstPage]);

  const handleOpen = useCallback(
    (id: AnnouncementItem['id']) => {
      navigation.navigate(HomeRoutes.AnnouncementDetail, { announcementId: id });
    },
    [navigation],
  );

  const handleRefresh = useCallback(() => void refresh(), [refresh]);
  const handleEndReached = useCallback(() => void loadMore(), [loadMore]);

  const renderItem = useCallback(
    ({ item }: { item: AnnouncementItem }) => (
      <AnnouncementListItem
        isUnread={!readIds.includes(String(item.id))}
        item={item}
        onPress={handleOpen}
      />
    ),
    [handleOpen, readIds],
  );

  const header = (
    <Stack gap="md" style={styles.header}>
      <AppHeader
        subtitle={hasLoaded ? t.announcements.total(total) : t.announcements.subtitle}
        title={t.announcements.title}
      />
      <AppButton onPress={() => navigation.goBack()} title={t.common.back} variant="ghost" />
    </Stack>
  );

  if (isLoading && !hasLoaded) {
    return (
      <AppScreen contentContainerStyle={styles.content} scroll>
        {header}
        <LoadingState message={t.announcements.loading} />
      </AppScreen>
    );
  }

  if (errorMessage && !hasLoaded) {
    return (
      <AppScreen contentContainerStyle={styles.content} scroll>
        {header}
        <ErrorState message={errorMessage} onRetry={handleRefresh} />
      </AppScreen>
    );
  }

  return (
    <AppScreen horizontalPadding={false}>
      <FlatList
        ItemSeparatorComponent={Separator}
        ListEmptyComponent={
          <EmptyState
            action={
              <AppButton
                loading={isRefreshing}
                onPress={handleRefresh}
                title={t.common.refresh}
                variant="outline"
              />
            }
            illustrationLabel={t.announcements.emptyIllustrationAlt}
            illustrationSource={images.emptyStates.announcements}
            message={t.announcements.emptyMessage}
            title={t.announcements.emptyTitle}
          />
        }
        ListFooterComponent={
          <View style={styles.footer}>
            {isLoadingMore ? <ActivityIndicator color={brand.primary} /> : null}
            {loadMoreErrorMessage ? (
              <Stack align="center" gap="sm">
                <AppText align="center" color="error" variant="bodySmall">
                  {loadMoreErrorMessage}
                </AppText>
                <AppButton
                  onPress={handleEndReached}
                  size="sm"
                  title={t.common.retry}
                  variant="outline"
                />
              </Stack>
            ) : null}
            {!isLoadingMore && !loadMoreErrorMessage && nextPage !== null ? (
              <AppButton
                onPress={handleEndReached}
                size="sm"
                title={t.announcements.loadMore}
                variant="outline"
              />
            ) : null}
          </View>
        }
        ListHeaderComponent={header}
        contentContainerStyle={styles.listContent}
        data={items}
        initialNumToRender={8}
        keyExtractor={keyExtractor}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.4}
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
        windowSize={7}
      />
    </AppScreen>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  content: { gap: spacing.xl },
  header: { marginBottom: spacing.lg },
  listContent: {
    paddingHorizontal: layout.screenHorizontalPadding,
    paddingTop: layout.screenVerticalPadding,
    paddingBottom: layout.screenVerticalPadding,
    flexGrow: 1,
  },
  separator: { height: spacing.md },
  footer: { paddingVertical: spacing.lg, alignItems: 'center', minHeight: spacing.xxl },
});
