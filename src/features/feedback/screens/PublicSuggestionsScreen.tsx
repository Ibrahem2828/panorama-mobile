import { useCallback, useEffect, useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import {
  AppButton,
  AppCard,
  AppHeader,
  AppScreen,
  AppText,
  EmptyState,
  ErrorState,
  SkeletonList,
  Stack,
} from '../../../components';
import { useTranslation } from '../../../i18n';
import type { ProfileStackParamList } from '../../../navigation/types';
import { layout, spacing, useBrand } from '../../../theme';
import { useAuthStore } from '../../auth/store';
import {
  loadPublicSuggestions,
  toSafeFeedbackErrorMessage,
  toggleSuggestionVote,
} from '../services';
import type { PublicSuggestion } from '../types';

type Props = NativeStackScreenProps<ProfileStackParamList, 'PublicSuggestions'>;

function keyExtractor(item: PublicSuggestion) {
  return String(item.id);
}

function Separator() {
  return <View style={styles.separator} />;
}

export function PublicSuggestionsScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const brand = useBrand();
  const accessToken = useAuthStore((state) => state.accessToken);
  const [items, setItems] = useState<PublicSuggestion[]>([]);
  const [nextPage, setNextPage] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [votingId, setVotingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (refresh = false) => {
      if (!accessToken) return;
      if (refresh) setIsRefreshing(true);
      else setIsLoading(true);
      setError(null);
      try {
        const response = await loadPublicSuggestions(accessToken, 1);
        setItems(response.results);
        setNextPage(response.next ? 2 : null);
      } catch (loadError) {
        setError(toSafeFeedbackErrorMessage(loadError, t.feedback));
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [accessToken, t],
  );

  const loadMore = useCallback(async () => {
    if (!accessToken || nextPage === null || isLoadingMore || isLoading || isRefreshing) return;
    setIsLoadingMore(true);
    try {
      const response = await loadPublicSuggestions(accessToken, nextPage);
      setItems((current) => {
        const known = new Set(current.map((entry) => entry.id));
        return [...current, ...response.results.filter((entry) => !known.has(entry.id))];
      });
      setNextPage(response.next ? nextPage + 1 : null);
    } catch (loadError) {
      setError(toSafeFeedbackErrorMessage(loadError, t.feedback));
    } finally {
      setIsLoadingMore(false);
    }
  }, [accessToken, isLoading, isLoadingMore, isRefreshing, nextPage, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleVote = useCallback(
    async (item: PublicSuggestion) => {
      if (!accessToken || votingId !== null) return;
      setVotingId(item.id);
      setError(null);
      try {
        const result = await toggleSuggestionVote(item.id, accessToken);
        setItems((current) =>
          current.map((candidate) =>
            candidate.id === item.id
              ? { ...candidate, has_voted: result.voted, votes_count: result.votes_count }
              : candidate,
          ),
        );
      } catch (voteError) {
        setError(toSafeFeedbackErrorMessage(voteError, t.feedback));
      } finally {
        setVotingId(null);
      }
    },
    [accessToken, t, votingId],
  );

  const renderItem = useCallback(
    ({ item }: { item: PublicSuggestion }) => (
      <AppCard variant="elevated">
        <Stack gap="md">
          <AppText variant="title">{item.title}</AppText>
          <AppText color="secondary" variant="bodySmall">
            {item.suggestion}
          </AppText>
          {item.resolution_message ? (
            <AppText color="success" variant="bodySmall">
              {item.resolution_message}
            </AppText>
          ) : null}
          <Stack align="center" direction="horizontal" gap="sm" justify="space-between" wrap>
            <AppText color="muted" variant="caption">
              {t.feedback.publicList.votes(item.votes_count)}
            </AppText>
            <AppButton
              loading={votingId === item.id}
              onPress={() => void handleVote(item)}
              size="sm"
              title={item.has_voted ? t.feedback.publicList.unvote : t.feedback.publicList.vote}
              variant={item.has_voted ? 'secondary' : 'outline'}
            />
          </Stack>
        </Stack>
      </AppCard>
    ),
    [handleVote, t, votingId],
  );

  const header = (
    <Stack gap="lg" style={styles.header}>
      <AppHeader subtitle={t.feedback.publicList.subtitle} title={t.feedback.publicList.title} />
      {error && items.length > 0 ? (
        <AppText color="error" variant="bodySmall">
          {error}
        </AppText>
      ) : null}
    </Stack>
  );

  if (isLoading && items.length === 0) {
    return (
      <AppScreen contentContainerStyle={styles.centerContent} scroll>
        {header}
        <SkeletonList />
      </AppScreen>
    );
  }

  if (error && items.length === 0) {
    return (
      <AppScreen contentContainerStyle={styles.centerContent} scroll>
        {header}
        <ErrorState message={error} onRetry={() => void load()} />
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
                onPress={() => navigation.navigate('FeedbackCenter')}
                title={t.feedback.publicList.shareIdea}
              />
            }
            message={t.feedback.publicList.emptyMessage}
            title={t.feedback.publicList.emptyTitle}
          />
        }
        ListFooterComponent={
          <View style={styles.footer}>
            {isLoadingMore ? <ActivityIndicator color={brand.primary} /> : null}
            {!isLoadingMore && nextPage !== null ? (
              <AppButton
                onPress={() => void loadMore()}
                size="sm"
                title={t.feedback.mine.loadMore}
                variant="outline"
              />
            ) : null}
          </View>
        }
        ListHeaderComponent={header}
        contentContainerStyle={styles.listContent}
        data={items}
        extraData={votingId}
        keyExtractor={keyExtractor}
        onEndReached={() => void loadMore()}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            colors={[brand.primary]}
            onRefresh={() => void load(true)}
            refreshing={isRefreshing}
            tintColor={brand.primary}
          />
        }
        renderItem={renderItem}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  centerContent: { gap: spacing.xl },
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
