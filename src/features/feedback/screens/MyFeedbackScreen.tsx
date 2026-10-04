import { useCallback, useEffect, useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet } from 'react-native';

import {
  AppButton,
  AppCard,
  AppHeader,
  AppScreen,
  AppText,
  EmptyState,
  ErrorState,
  LoadingState,
  Stack,
} from '../../../components';
import type { ProfileStackParamList } from '../../../navigation/types';
import { spacing } from '../../../theme';
import { useAuthStore } from '../../auth/store';
import { loadMyFeedback, toSafeFeedbackErrorMessage } from '../services';
import type { FeedbackRecord } from '../types';
import { useTranslation, type TranslationCatalog } from '../../../i18n';

type Props = NativeStackScreenProps<ProfileStackParamList, 'MyFeedback'>;

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

export function MyFeedbackScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const accessToken = useAuthStore((state) => state.accessToken);
  const [items, setItems] = useState<FeedbackRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (refresh = false) => {
      if (!accessToken) return;
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);
      try {
        const response = await loadMyFeedback(accessToken);
        setItems(response.results);
      } catch (loadError) {
        setError(toSafeFeedbackErrorMessage(loadError, t.feedback));
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [accessToken],
  );

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <AppScreen
      contentContainerStyle={styles.content}
      scroll
      // AppScreen intentionally centralizes scroll behavior; pull-to-refresh is represented by a retry button.
    >
      <Stack gap="xl">
        <AppHeader subtitle={t.feedback.mine.subtitle} title={t.feedback.mine.title} />
        <AppButton onPress={() => navigation.goBack()} title={t.common.back} variant="ghost" />
        {isLoading ? <LoadingState message={t.feedback.mine.loading} /> : null}
        {error ? <ErrorState message={error} onRetry={() => void load()} /> : null}
        {!isLoading && !error && items.length === 0 ? (
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
        ) : null}
        {items.map((item) => (
          <AppCard key={item.id} variant="elevated">
            <Stack gap="sm">
              <Stack direction="horizontal" gap="sm" justify="space-between" wrap>
                <AppText variant="title">{item.title || item.kind}</AppText>
                <AppText color="brand" variant="caption">
                  {statusLabel(item.status, t)}
                </AppText>
              </Stack>
              {item.rating ? <AppText color="warning">{'★'.repeat(item.rating)}</AppText> : null}
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
              <AppText color="muted" variant="caption">
                {new Date(item.created_at).toLocaleString('ar-SY')}
              </AppText>
            </Stack>
          </AppCard>
        ))}
        <AppButton
          loading={isRefreshing}
          onPress={() => void load(true)}
          title={t.feedback.mine.refresh}
          variant="outline"
        />
      </Stack>
    </AppScreen>
  );
}

const styles = StyleSheet.create({ content: { gap: spacing.xl } });
