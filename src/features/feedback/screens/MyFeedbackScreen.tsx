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

type Props = NativeStackScreenProps<ProfileStackParamList, 'MyFeedback'>;

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    new: 'جديد',
    reviewed: 'تمت المراجعة',
    planned: 'ضمن الخطة',
    in_progress: 'قيد التنفيذ',
    resolved: 'مكتمل',
    rejected: 'غير معتمد',
    duplicate: 'مكرر',
  };
  return map[status] ?? status;
}

export function MyFeedbackScreen({ navigation }: Props) {
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
        setError(toSafeFeedbackErrorMessage(loadError));
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
        <AppHeader subtitle="تقييمات واقتراحات" title="مشاركاتي" />
        <AppButton onPress={() => navigation.goBack()} title="رجوع" variant="ghost" />
        {isLoading ? <LoadingState message="جاري تحميل المشاركات..." /> : null}
        {error ? <ErrorState message={error} onRetry={() => void load()} /> : null}
        {!isLoading && !error && items.length === 0 ? (
          <EmptyState
            action={
              <AppButton
                onPress={() => navigation.navigate('FeedbackCenter')}
                title="إضافة مشاركة"
              />
            }
            message="أرسل تقييمًا أو اقتراحًا لتطوير النسخة القادمة."
            title="لا توجد مشاركات بعد"
          />
        ) : null}
        {items.map((item) => (
          <AppCard key={item.id} variant="elevated">
            <Stack gap="sm">
              <Stack direction="horizontal" gap="sm" justify="space-between" wrap>
                <AppText variant="title">{item.title || item.kind}</AppText>
                <AppText color="brand" variant="caption">
                  {statusLabel(item.status)}
                </AppText>
              </Stack>
              {item.rating ? <AppText color="warning">{'★'.repeat(item.rating)}</AppText> : null}
              <AppText color="secondary" variant="bodySmall">
                {item.suggestion || item.comment || 'تم إرسال المشاركة.'}
              </AppText>
              {item.resolution_message ? (
                <AppCard variant="muted">
                  <AppText color="success" variant="bodySmall">
                    رد الفريق: {item.resolution_message}
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
          title="تحديث القائمة"
          variant="outline"
        />
      </Stack>
    </AppScreen>
  );
}

const styles = StyleSheet.create({ content: { gap: spacing.xl } });
