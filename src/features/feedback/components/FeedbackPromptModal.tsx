import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { AppButton, AppCard, AppText, AppTextInput, Stack } from '../../../components';
import { colors, spacing } from '../../../theme';
import { useFeedbackStore } from '../store';

export function FeedbackPromptModal() {
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
    <Modal animationType="fade" onRequestClose={() => void dismissPrompt()} transparent visible>
      <View style={styles.backdrop}>
        <AppCard padding="lg" style={styles.card} variant="elevated">
          <Stack gap="lg">
            <Stack gap="xs">
              <AppText align="center" variant="title">
                {prompt.policy.title || 'رأيك يهمنا'}
              </AppText>
              <AppText align="center" color="secondary" variant="body">
                {prompt.policy.question || 'كيف كانت تجربتك؟'}
              </AppText>
            </Stack>
            <View accessibilityRole="radiogroup" style={styles.stars}>
              {[1, 2, 3, 4, 5].map((value) => (
                <Pressable
                  accessibilityLabel={`${value} من 5`}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: rating === value }}
                  key={value}
                  onPress={() => setRating(value)}
                  style={[styles.starButton, rating === value ? styles.starSelected : null]}
                >
                  <AppText style={styles.starText}>★</AppText>
                </Pressable>
              ))}
            </View>
            {prompt.policy.allow_comment ? (
              <AppTextInput
                label="ملاحظة اختيارية"
                maxLength={1000}
                multiline
                onChangeText={setComment}
                placeholder="ما الذي أعجبك؟ وما الذي يحتاج تحسينًا؟"
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
                title="إرسال التقييم"
              />
              <AppButton
                disabled={isSubmitting}
                onPress={() => void dismissPrompt()}
                title="لاحقًا"
                variant="ghost"
              />
            </Stack>
          </Stack>
        </AppCard>
      </View>
    </Modal>
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
  stars: { flexDirection: 'row-reverse', justifyContent: 'center', gap: spacing.sm },
  starButton: {
    minWidth: 46,
    minHeight: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.muted,
  },
  starSelected: { backgroundColor: '#FFF3C4', borderWidth: 1, borderColor: '#F5A524' },
  starText: { fontSize: 28, color: '#F5A524' },
});
