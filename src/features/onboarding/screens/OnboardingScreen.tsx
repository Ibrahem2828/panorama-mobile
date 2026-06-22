import { useMemo, useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Image, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';

import { images } from '../../../assets/images';
import { AppButton, AppScreen, AppText, Stack } from '../../../components';
import { PublicRoutes } from '../../../navigation/routes';
import type { PublicStackParamList } from '../../../navigation/types';
import { colors, radius, spacing } from '../../../theme';
import { markOnboardingSeen } from '../services';

type OnboardingScreenProps = NativeStackScreenProps<PublicStackParamList, 'Onboarding'>;

type OnboardingSlide = {
  image: typeof images.onboarding.university;
  imageLabel: string;
  title: string;
  description: string;
};

const SLIDES = [
  {
    image: images.onboarding.university,
    imageLabel: 'رسم يوضح الحياة الجامعية داخل تطبيق بانوراما',
    title: 'كل حياتك الجامعية في مكان واحد',
    description: 'بانوراما يجمع ملفاتك، موادك، الغروبات، وإعلاناتك الجامعية في تجربة واحدة سهلة.',
  },
  {
    image: images.onboarding.verification,
    imageLabel: 'رسم يوضح توثيق الحساب الجامعي',
    title: 'وثّق حسابك الجامعي بأمان',
    description:
      'ارفع بطاقتك الجامعية ليتم التحقق من بياناتك ومنحك الوصول إلى المواد والخدمات المناسبة لك.',
  },
  {
    image: images.onboarding.groups,
    imageLabel: 'رسم يوضح غروبات المواد الجامعية',
    title: 'انضم إلى غروبات موادك',
    description: 'تابع النقاشات، الإعلانات، والملفات المرتبطة بموادك وجامعتك بسهولة.',
  },
  {
    image: images.onboarding.filesPrinting,
    imageLabel: 'رسم يوضح الملفات وطلبات الطباعة',
    title: 'ملفاتك وطباعتك بخطوات بسيطة',
    description: 'افتح الملفات الجامعية، اطلب طباعتها، وتابع حالة الطلب من التطبيق.',
  },
] as const satisfies readonly OnboardingSlide[];

const FIRST_SLIDE = SLIDES[0];

export function OnboardingScreen({ navigation }: OnboardingScreenProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);
  const { width } = useWindowDimensions();
  const activeSlide = SLIDES[activeIndex] ?? FIRST_SLIDE;
  const isFinalSlide = activeIndex === SLIDES.length - 1;
  const imageWidth = useMemo(() => Math.min(Math.max(width - spacing.xxl * 2, 220), 320), [width]);

  async function completeOnboarding() {
    setIsCompleting(true);

    try {
      await markOnboardingSeen();
    } finally {
      setIsCompleting(false);
      navigation.replace(PublicRoutes.Login);
    }
  }

  function handleNext() {
    if (isFinalSlide) {
      void completeOnboarding();
      return;
    }

    setActiveIndex((currentIndex) => Math.min(currentIndex + 1, SLIDES.length - 1));
  }

  return (
    <AppScreen contentContainerStyle={styles.content} scroll>
      <Stack gap="xl" style={styles.root}>
        <View style={styles.skipRow}>
          <Pressable
            accessibilityLabel="تخطي التعريف بالتطبيق"
            accessibilityRole="button"
            disabled={isCompleting}
            onPress={() => {
              void completeOnboarding();
            }}
            style={({ pressed }) => [styles.skipButton, pressed ? styles.pressed : null]}
          >
            <AppText color="brand" variant="button">
              تخطي
            </AppText>
          </Pressable>
        </View>

        <View style={styles.illustrationFrame}>
          <Image
            accessibilityIgnoresInvertColors
            accessibilityLabel={activeSlide.imageLabel}
            resizeMode="contain"
            source={activeSlide.image}
            style={[styles.illustration, { width: imageWidth }]}
          />
        </View>

        <Stack align="center" gap="md" style={styles.textBlock}>
          <AppText align="center" variant="h1">
            {activeSlide.title}
          </AppText>
          <AppText align="center" color="secondary" variant="body">
            {activeSlide.description}
          </AppText>
        </Stack>

        <View accessibilityLabel="مؤشر صفحات التعريف" style={styles.pagination}>
          {SLIDES.map((slide, index) => (
            <View
              key={slide.title}
              style={[styles.dot, index === activeIndex ? styles.dotActive : null]}
            />
          ))}
        </View>

        <Stack direction="horizontal" gap="md" style={styles.actions}>
          <AppButton
            disabled={activeIndex === 0 || isCompleting}
            onPress={() => setActiveIndex((currentIndex) => Math.max(currentIndex - 1, 0))}
            title="السابق"
            variant="ghost"
          />
          <AppButton
            fullWidth
            loading={isCompleting}
            onPress={handleNext}
            style={styles.primaryAction}
            title={isFinalSlide ? 'ابدأ الآن' : 'التالي'}
          />
        </Stack>
      </Stack>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  root: {
    flex: 1,
    justifyContent: 'center',
  },
  skipRow: {
    alignItems: 'flex-start',
  },
  skipButton: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radius.button,
  },
  pressed: {
    opacity: 0.72,
  },
  illustrationFrame: {
    minHeight: 260,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustration: {
    height: 260,
  },
  textBlock: {
    minHeight: 150,
  },
  pagination: {
    flexDirection: 'row-reverse',
    alignSelf: 'center',
    gap: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border.default,
  },
  dotActive: {
    width: 24,
    backgroundColor: colors.brand.primary,
  },
  actions: {
    alignItems: 'center',
  },
  primaryAction: {
    flex: 1,
  },
});
