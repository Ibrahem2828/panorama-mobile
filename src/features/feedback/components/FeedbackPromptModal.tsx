import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  AppButton,
  AppCard,
  AppText,
  AppTextInput,
  EmojiRatingScale,
  Stack,
} from '../../../components';
import { spacing } from '../../../theme';
import { useFeedbackStore } from '../store';
import { useTranslation } from '../../../i18n';
import { AppModal } from '../../../components/overlay';

export function FeedbackPromptModal() {
  const { t } = useTranslation();
  const prompt = useFeedbackStore((state) => state.activePrompt);
  const isSubmitting = useFeedbackStore((state) => state.isSubmitting);
  const errorMessage = useFeedbackStore((state) => state.errorMessage);
  const submitRating = useFeedbackStore((state) => state.submitRating);
  const dismissPrompt = useFeedbackStore((state) => state.dismissPrompt);
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');

  useEffect(() => {
    setRating(null);
    setComment('');
  }, [prompt?.policy.id]);

  if (!prompt) return null;

  return (
    <AppModal animationType="fade" onRequestClose={() => void dismissPrompt()} transparent visible>
      <View style={styles.backdrop}>
        <AppCard padding="lg" style={styles.card} variant="elevated">
          <Stack gap="lg">
            <Stack gap="xs">
              <AppText align="center" variant="title">
                {prompt.policy.title || t.feedback.prompt.title}
              </AppText>
              <AppText align="center" color="secondary" variant="body">
                {prompt.policy.question || t.feedback.prompt.question}
              </AppText>
            </Stack>
            <EmojiRatingScale onChange={setRating} value={rating} />
            {prompt.policy.allow_comment ? (
              <AppTextInput
                label={t.feedback.prompt.noteLabel}
                maxLength={1000}
                multiline
                onChangeText={setComment}
                placeholder={t.feedback.prompt.notePlaceholder}
                value={comment}
              />
            ) : null}
            {errorMessage ? (
              <AppText color="error" variant="bodySmall">
                {errorMessage}
              </AppText>
            ) : null}
            <Stack direction="horizontal" gap="sm" wrap>
              <AppButton
                disabled={!rating || isSubmitting}
                loading={isSubmitting}
                onPress={() => rating && void submitRating(rating, comment)}
                title={t.feedback.prompt.submit}
              />
              <AppButton
                disabled={isSubmitting}
                onPress={() => void dismissPrompt()}
                title={t.feedback.prompt.later}
                variant="ghost"
              />
            </Stack>
          </Stack>
        </AppCard>
      </View>
    </AppModal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: 'rgba(8,13,34,0.62)',
  },
  card: { width: '100%', maxWidth: 520, alignSelf: 'center' },
});
