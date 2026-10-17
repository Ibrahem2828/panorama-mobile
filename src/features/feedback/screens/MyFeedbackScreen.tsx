import { useCallback, useEffect, useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActivityIndicator, Alert, FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import {
  AppBadge,
  AppButton,
  AppCard,
  AppHeader,
  AppScreen,
  AppText,
  EmptyState,
  ErrorState,
  Icon,
  LoadingState,
  Stack,
} from '../../../components';
import { useTranslation, type TranslationCatalog } from '../../../i18n';
import type { ProfileStackParamList } from '../../../navigation/types';
import { colors, layout, spacing, useBrand } from '../../../theme';
import { formatDateTime } from '../../../utils/formatDateTime';
import { useAuthStore } from '../../auth/store';
import {
  loadMyFeedback,
  requestFeedbackPrivacy,
  toSafeFeedbackErrorMessage,
  type FeedbackPrivacyAction,
} from '../services';
import type { FeedbackRecord } from '../types';

type Props = NativeStackScreenProps<ProfileStackParamList, 'MyFeedback'>;
type PrivacyState = Record<number, { hidden?: boolean; deletion?: boolean }>;

function statusLabel(status: string, t: TranslationCatalog): string {
  const map: Record<string, string> = {
    new: t.feedback.mine.statusNew,
    reviewed: t.feedback.mine.statusReviewed,
    planned: t.feedback.mine.statusPlanned,
    in_progress: t.feedback.mine.statusInProgress,
    resolved: t.feedback.mine.statusResolved,
    rejected: t.feedback.mine.statusRejected,
    duplicate: t.feedback.mine.statusDuplicate,
  };
  return map[status] ?? status;
}

function keyExtractor(item: FeedbackRecord) {
  return String(item.id);
}

function Separator() {
  return <View style={styles.separator} />;
}

export function MyFeedbackScreen({ navigation }: Props) {
  const { t, locale } = useTranslation();
  const brand = useBrand();
  const accessToken = useAuthStore((state) => state.accessToken);
  const [items, setItems] = useState<FeedbackRecord[]>([]);
  const [nextPage, setNextPage] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [privacy, setPrivacy] = useState<PrivacyState>({});
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(
    async (refresh = false) => {
      if (!accessToken) return;
      if (refresh) setIsRefreshing(true);
      else setIsLoading(true);
      setError(null);
      try {
        const response = await loadMyFeedback(accessToken, 1);
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
    setError(null);
    try {
      const response = await loadMyFeedback(accessToken, nextPage);
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

  const runPrivacy = useCallback(
    async (item: FeedbackRecord, action: FeedbackPrivacyAction) => {
      if (!accessToken || busyId !== null) return;
      setBusyId(item.id);
      setNotice(null);
      setError(null);
      try {
        await requestFeedbackPrivacy(item.id, action, accessToken);
        setPrivacy((current) => ({
          ...current,
          [item.id]: action === 'delete' ? { hidden: true, deletion: true } : { hidden: true },
        }));
        setNotice(
          action === 'delete'
            ? t.feedback.mine.privacy.deleteDone
            : t.feedback.mine.privacy.hideDone,
        );
      } catch {
        setError(t.feedback.mine.privacy.failed);
      } finally {
        setBusyId(null);
      }
    },
    [accessToken, busyId, t],
  );

  const confirmPrivacy = useCallback(
    (item: FeedbackRecord, action: FeedbackPrivacyAction) => {
      const text = t.feedback.mine.privacy;

      Alert.alert(
        action === 'delete' ? text.deleteTitle : text.hideTitle,
        action === 'delete' ? text.deleteMessage : text.hideMessage,
        [
          { text: text.cancel, style: 'cancel' },
          {
            text: action === 'delete' ? text.deleteConfirm : text.hideConfirm,
            style: action === 'delete' ? 'destructive' : 'default',
            onPress: () => void runPrivacy(item, action),
          },
        ],
      );
    },
    [runPrivacy, t],
  );

  const renderItem = useCallback(
    ({ item }: { item: FeedbackRecord }) => {
      const state = privacy[item.id];

      return (
        <AppCard variant="elevated">
          <Stack gap="sm">
            <Stack direction="horizontal" gap="sm" justify="space-between" wrap>
              <AppText style={styles.itemTitle} variant="title">
                {item.title || item.kind}
              </AppText>
              <AppText color="brand" variant="caption">
                {statusLabel(item.status, t)}
              </AppText>
            </Stack>
            {item.rating ? (
              <Stack direction="horizontal" gap="xs">
                {Array.from({ length: item.rating }, (_, index) => (
                  <Icon color={colors.semantic.warning} filled key={index} name="star" size={16} />
                ))}
              </Stack>
            ) : null}
            <AppText color="secondary" variant="bodySmall">
              {item.suggestion || item.comment || t.feedback.mine.sent}
            </AppText>
            {item.resolution_message ? (
              <AppCard variant="muted">
                <AppText color="success" variant="bodySmall">
                  {t.feedback.mine.teamReply(item.resolution_message)}
                </AppText>
              </AppCard>
            ) : null}
            <Stack direction="horizontal" gap="sm" wrap>
              {state?.hidden ? (
                <AppBadge label={t.feedback.mine.hiddenBadge} variant="neutral" />
              ) : null}
              {state?.deletion ? (
                <AppBadge label={t.feedback.mine.deletionBadge} variant="warning" />
              ) : null}
            </Stack>
            <AppText color="muted" variant="caption">
              {formatDateTime(item.created_at, locale)}
            </AppText>
            {!state?.deletion ? (
              <Stack direction="horizontal" gap="sm" wrap>
                {!state?.hidden ? (
                  <AppButton
                    disabled={busyId !== null}
                    loading={busyId === item.id}
                    onPress={() => confirmPrivacy(item, 'hide')}
                    size="sm"
                    title={t.feedback.mine.privacy.hide}
                    variant="ghost"
                  />
                ) : null}
                <AppButton
                  disabled={busyId !== null}
                  onPress={() => confirmPrivacy(item, 'delete')}
                  size="sm"
                  title={t.feedback.mine.privacy.requestDelete}
                  variant="ghost"
                />
              </Stack>
            ) : null}
          </Stack>
        </AppCard>
      );
    },
    [busyId, confirmPrivacy, locale, privacy, t],
  );

  const header = (
    <Stack gap="lg" style={styles.header}>
      <AppHeader subtitle={t.feedback.mine.subtitle} title={t.feedback.mine.title} />
      {notice ? (
        <AppCard variant="muted">
          <AppText color="success" variant="bodySmall">
            {notice}
          </AppText>
        </AppCard>
      ) : null}
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
        <LoadingState message={t.feedback.mine.loading} />
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
                title={t.feedback.mine.addEntry}
              />
            }
            message={t.feedback.mine.emptyMessage}
            title={t.feedback.mine.emptyTitle}
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
        extraData={privacy}
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
  itemTitle: { flex: 1 },
  footer: { paddingVertical: spacing.lg, alignItems: 'center', minHeight: spacing.xxl },
});
