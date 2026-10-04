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
import {
  loadPublicSuggestions,
  toSafeFeedbackErrorMessage,
  toggleSuggestionVote,
} from '../services';
import type { PublicSuggestion } from '../types';
import { useTranslation } from '../../../i18n';

type Props = NativeStackScreenProps<ProfileStackParamList, 'PublicSuggestions'>;

export function PublicSuggestionsScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const accessToken = useAuthStore((state) => state.accessToken);
  const [items, setItems] = useState<PublicSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [votingId, setVotingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await loadPublicSuggestions(accessToken);
      setItems(response.results);
    } catch (loadError) {
      setError(toSafeFeedbackErrorMessage(loadError, t.feedback));
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleVote(item: PublicSuggestion) {
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
  }

  return (
    <AppScreen contentContainerStyle={styles.content} scroll>
      <Stack gap="xl">
        <AppHeader subtitle={t.feedback.publicList.subtitle} title={t.feedback.publicList.title} />
        <AppButton onPress={() => navigation.goBack()} title={t.common.back} variant="ghost" />
        {isLoading ? <LoadingState message={t.feedback.publicList.loading} /> : null}
        {error ? <ErrorState message={error} onRetry={() => void load()} /> : null}
        {!isLoading && !error && items.length === 0 ? (
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
        ) : null}
        {items.map((item) => (
          <AppCard key={item.id} variant="elevated">
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
              <Stack direction="horizontal" gap="sm" justify="space-between" wrap>
                <AppText color="muted" variant="caption">
                  {t.feedback.publicList.votes(item.votes_count)}
                </AppText>
                <AppButton
                  loading={votingId === item.id}
                  onPress={() => void handleVote(item)}
                  title={item.has_voted ? t.feedback.publicList.unvote : t.feedback.publicList.vote}
                  variant={item.has_voted ? 'secondary' : 'outline'}
                />
              </Stack>
            </Stack>
          </AppCard>
        ))}
      </Stack>
    </AppScreen>
  );
}

const styles = StyleSheet.create({ content: { gap: spacing.xl } });
