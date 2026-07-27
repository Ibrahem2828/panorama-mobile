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

type Props = NativeStackScreenProps<ProfileStackParamList, 'FeedbackCenter'>;

type KindOption = { value: FeedbackKind; label: string; hint: string };

const KIND_OPTIONS: KindOption[] = [
  { value: 'rating', label: 'تقييم عام', hint: 'قيّم تجربتك مع بانوراما' },
  { value: 'suggestion', label: 'اقتراح', hint: 'شارك فكرة تطوير قابلة للتنفيذ' },
  { value: 'issue', label: 'مشكلة', hint: 'أبلغ عن خلل وظيفي أو بصري' },
  { value: 'complaint', label: 'شكوى', hint: 'صف تجربة لم تكن بالمستوى المتوقع' },
  { value: 'praise', label: 'إشادة', hint: 'أخبرنا بما أعجبك' },
];

export function FeedbackCenterScreen({ navigation }: Props) {
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
      setErrorMessage('أدخل عنوانًا واضحًا وتفاصيل الاقتراح.');
      return;
    }
    if (kind !== 'rating' && !details.trim()) {
      setErrorMessage('اكتب تفاصيل تساعد فريق بانوراما على المراجعة.');
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
      setErrorMessage(toSafeFeedbackErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSuccess) {
    return (
      <AppScreen contentContainerStyle={styles.content} scroll>
        <AppHeader subtitle="مشاركة الرأي" title="ساعدنا على التطوير" />
        <SuccessState
          message="تم تسجيل رأيك بأمان وسيظهر ضمن لوحة متابعة فريق بانوراما."
          title="شكرًا لمساهمتك"
        />
        <Stack gap="md">
          <AppButton
            fullWidth
            onPress={() => navigation.navigate(ProfileRoutes.MyFeedback)}
            title="متابعة مشاركاتي"
          />
          <AppButton
            fullWidth
            onPress={() => {
              setIsSuccess(false);
              setTitle('');
              setDetails('');
              setRating(5);
            }}
            title="إرسال مشاركة أخرى"
            variant="outline"
          />
        </Stack>
      </AppScreen>
    );
  }

  return (
    <AppScreen contentContainerStyle={styles.content} scroll>
      <Stack gap="xl">
        <AppHeader subtitle="تقييم واقتراحات" title="رأيك يصنع النسخة القادمة" />
        <AppButton onPress={() => navigation.goBack()} title="رجوع" variant="ghost" />

        <AppCard variant="muted">
          <Stack gap="xs">
            <AppText variant="title">مشاركة منظمة وقابلة للمتابعة</AppText>
            <AppText color="secondary" variant="bodySmall">
              لا ترسل كلمات مرور أو رموز تحقق أو بيانات حساسة. نستخدم هذه الملاحظات لتحسين الأداء
              والواجهات والميزات.
            </AppText>
          </Stack>
        </AppCard>

        <Stack gap="sm">
          <AppText variant="label">نوع المشاركة</AppText>
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
                    {option.label}
                  </AppText>
                  <AppText color="muted" variant="caption">
                    {option.hint}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </Stack>

        <Stack gap="sm">
          <AppText variant="label">التقييم</AppText>
          <View accessibilityRole="radiogroup" style={styles.stars}>
            {[1, 2, 3, 4, 5].map((value) => (
              <Pressable
                accessibilityLabel={`${value} من 5`}
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
            label="عنوان الاقتراح"
            maxLength={180}
            onChangeText={setTitle}
            placeholder="مثال: تحسين البحث داخل المحاضرات"
            value={title}
          />
        ) : null}

        <AppTextInput
          helperText={`${details.length}/5000`}
          label={kind === 'suggestion' ? 'تفاصيل الاقتراح' : 'تفاصيل المشاركة'}
          maxLength={5000}
          multiline
          onChangeText={setDetails}
          placeholder={selectedOption?.hint ?? ''}
          value={details}
        />

        {errorMessage ? <ErrorState message={errorMessage} /> : null}

        <AppButton
          fullWidth
          loading={isSubmitting}
          onPress={handleSubmit}
          title="إرسال إلى فريق بانوراما"
        />

        <Stack direction="horizontal" gap="sm" wrap>
          <AppButton
            onPress={() => navigation.navigate(ProfileRoutes.MyFeedback)}
            title="مشاركاتي"
            variant="outline"
          />
          <AppButton
            onPress={() => navigation.navigate(ProfileRoutes.PublicSuggestions)}
            title="اقتراحات المجتمع"
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
