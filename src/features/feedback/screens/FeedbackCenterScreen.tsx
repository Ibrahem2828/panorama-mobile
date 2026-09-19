import { useMemo, useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  AppButton,
  AppCard,
  AppHeader,
  AppScreen,
  AppText,
  AppTextInput,
  ErrorState,
  Stack,
  SuccessState,
} from '../../../components';
import { ProfileRoutes } from '../../../navigation/routes';
import type { ProfileStackParamList } from '../../../navigation/types';
import { colors, radius, spacing } from '../../../theme';
import { useAuthStore } from '../../auth/store';
import { submitFeedback, toSafeFeedbackErrorMessage } from '../services';
import type { FeedbackKind } from '../types';
import { useTranslation, type TranslationCatalog } from '../../../i18n';

type Props = NativeStackScreenProps<ProfileStackParamList, 'FeedbackCenter'>;

type KindCatalog = TranslationCatalog['feedback']['kinds'];
type KindOption = { value: FeedbackKind; labelKey: keyof KindCatalog; hintKey: keyof KindCatalog };

const KIND_OPTIONS: KindOption[] = [
  { value: 'rating', labelKey: 'rating' as const, hintKey: 'ratingHint' as const },
  { value: 'suggestion', labelKey: 'suggestion' as const, hintKey: 'suggestionHint' as const },
  { value: 'issue', labelKey: 'issue' as const, hintKey: 'issueHint' as const },
  { value: 'complaint', labelKey: 'complaint' as const, hintKey: 'complaintHint' as const },
  { value: 'praise', labelKey: 'praise' as const, hintKey: 'praiseHint' as const },
];

export function FeedbackCenterScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const accessToken = useAuthStore((state) => state.accessToken);
  const [kind, setKind] = useState<FeedbackKind>('rating');
  const [rating, setRating] = useState<number | null>(5);
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const selectedOption = useMemo(
    () => KIND_OPTIONS.find((option) => option.value === kind) ?? KIND_OPTIONS[0],
    [kind],
  );

  async function handleSubmit() {
    if (!accessToken || isSubmitting) return;
    if (kind === 'suggestion' && (!title.trim() || !details.trim())) {
      setErrorMessage(t.feedback.missingSuggestion);
      return;
    }
    if (kind !== 'rating' && !details.trim()) {
      setErrorMessage(t.feedback.missingDetails);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await submitFeedback(
        {
          kind,
          context: 'app',
          action_key: 'app.general',
          rating: rating ?? undefined,
          title: title.trim() || undefined,
          comment: kind === 'suggestion' ? undefined : details.trim() || undefined,
          suggestion: kind === 'suggestion' ? details.trim() : undefined,
          metadata: { source: 'feedback_center' },
        },
        accessToken,
      );
      setIsSuccess(true);
    } catch (error) {
      setErrorMessage(toSafeFeedbackErrorMessage(error, t.feedback));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSuccess) {
    return (
      <AppScreen contentContainerStyle={styles.content} scroll>
        <AppHeader
          subtitle={t.feedback.thanksHeaderSubtitle}
          title={t.feedback.thanksHeaderTitle}
        />
        <SuccessState message={t.feedback.thanksMessage} title={t.feedback.thanksTitle} />
        <Stack gap="md">
          <AppButton
            fullWidth
            onPress={() => navigation.navigate(ProfileRoutes.MyFeedback)}
            title={t.feedback.trackMine}
          />
          <AppButton
            fullWidth
            onPress={() => {
              setIsSuccess(false);
              setTitle('');
              setDetails('');
              setRating(5);
            }}
            title={t.feedback.sendAnother}
            variant="outline"
          />
        </Stack>
      </AppScreen>
    );
  }

  return (
    <AppScreen contentContainerStyle={styles.content} scroll>
      <Stack gap="xl">
        <AppHeader subtitle={t.feedback.centerSubtitle} title={t.feedback.centerTitle} />
        <AppButton onPress={() => navigation.goBack()} title={t.common.back} variant="ghost" />

        <AppCard variant="muted">
          <Stack gap="xs">
            <AppText variant="title">{t.feedback.privacyTitle}</AppText>
            <AppText color="secondary" variant="bodySmall">
              {t.feedback.privacyNote}
            </AppText>
          </Stack>
        </AppCard>

        <Stack gap="sm">
          <AppText variant="label">{t.feedback.kindLabel}</AppText>
          <View style={styles.kindGrid}>
            {KIND_OPTIONS.map((option) => {
              const selected = option.value === kind;
              return (
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  key={option.value}
                  onPress={() => {
                    setKind(option.value);
                    setErrorMessage(null);
                  }}
                  style={[styles.kindCard, selected ? styles.kindCardSelected : null]}
                >
                  <AppText color={selected ? 'brand' : 'primary'} variant="label">
                    {t.feedback.kinds[option.labelKey]}
                  </AppText>
                  <AppText color="muted" variant="caption">
                    {t.feedback.kinds[option.hintKey]}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </Stack>

        <Stack gap="sm">
          <AppText variant="label">{t.feedback.ratingLabel}</AppText>
          <View accessibilityRole="radiogroup" style={styles.stars}>
            {[1, 2, 3, 4, 5].map((value) => (
              <Pressable
                accessibilityLabel={t.feedback.ratingOf(value)}
                accessibilityRole="radio"
                accessibilityState={{ selected: rating === value }}
                key={value}
                onPress={() => setRating(value)}
                style={[styles.star, rating === value ? styles.starSelected : null]}
              >
                <AppText style={styles.starText}>★</AppText>
              </Pressable>
            ))}
          </View>
        </Stack>

        {kind === 'suggestion' ? (
          <AppTextInput
            label={t.feedback.suggestionTitleLabel}
            maxLength={180}
            onChangeText={setTitle}
            placeholder={t.feedback.suggestionTitlePlaceholder}
            value={title}
          />
        ) : null}

        <AppTextInput
          helperText={`${details.length}/5000`}
          label={
            kind === 'suggestion' ? t.feedback.suggestionDetailsLabel : t.feedback.shareDetailsLabel
          }
          maxLength={5000}
          multiline
          onChangeText={setDetails}
          placeholder={selectedOption ? t.feedback.kinds[selectedOption.hintKey] : ''}
          value={details}
        />

        {errorMessage ? <ErrorState message={errorMessage} /> : null}

        <AppButton
          fullWidth
          loading={isSubmitting}
          onPress={handleSubmit}
          title={t.feedback.submit}
        />

        <Stack direction="horizontal" gap="sm" wrap>
          <AppButton
            onPress={() => navigation.navigate(ProfileRoutes.MyFeedback)}
            title={t.feedback.myFeedback}
            variant="outline"
          />
          <AppButton
            onPress={() => navigation.navigate(ProfileRoutes.PublicSuggestions)}
            title={t.feedback.publicSuggestions}
            variant="outline"
          />
        </Stack>
      </Stack>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.xl },
  kindGrid: { gap: spacing.sm },
  kindCard: {
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radius.card,
    padding: spacing.md,
    gap: spacing.xs,
    backgroundColor: colors.background.surface,
  },
  kindCardSelected: {
    borderColor: colors.brand.primary,
    backgroundColor: colors.background.muted,
  },
  stars: { flexDirection: 'row-reverse', justifyContent: 'center', gap: spacing.sm },
  star: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  starSelected: { borderColor: colors.brand.primary, backgroundColor: colors.background.muted },
  starText: { fontSize: 28, color: colors.semantic.warning },
});
