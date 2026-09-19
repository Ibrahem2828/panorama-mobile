import { useEffect, useMemo, useRef, useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Animated,
  Easing,
  Image,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';

import { images } from '../../../assets/images';
import { AppButton, AppScreen, AppText, Stack } from '../../../components';
import { PublicRoutes } from '../../../navigation/routes';
import type { PublicStackParamList } from '../../../navigation/types';
import { colors, radius, spacing } from '../../../theme';
import { markOnboardingSeen } from '../services';
import { useTranslation } from '../../../i18n';

type OnboardingScreenProps = NativeStackScreenProps<PublicStackParamList, 'Onboarding'>;

// Images only; the copy for each slide comes from the catalog at the same index.
const SLIDE_IMAGES = [
  images.onboarding.university,
  images.onboarding.verification,
  images.onboarding.groups,
  images.onboarding.filesPrinting,
] as const;

export function OnboardingScreen({ navigation }: OnboardingScreenProps) {
  const { t } = useTranslation();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);
  const { width } = useWindowDimensions();
  const slides = t.onboarding.slides;
  const activeSlide = slides[activeIndex] ?? slides[0]!;
  const activeImage = SLIDE_IMAGES[activeIndex] ?? SLIDE_IMAGES[0];
  const isFinalSlide = activeIndex === slides.length - 1;
  const imageWidth = useMemo(() => Math.min(Math.max(width - spacing.xxl * 2, 220), 320), [width]);

  // Subtle slide entrance + cross-fade animation (React Native Animated only)
  const slideOpacity = useRef(new Animated.Value(1)).current;
  const slideTranslate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Reset and animate on slide change for smooth transition
    slideOpacity.setValue(0.65);
    slideTranslate.setValue(10);

    Animated.parallel([
      Animated.timing(slideOpacity, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideTranslate, {
        toValue: 0,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [activeIndex]);

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

    setActiveIndex((currentIndex) => Math.min(currentIndex + 1, slides.length - 1));
  }

  return (
    <AppScreen contentContainerStyle={styles.content} scroll>
      <Stack gap="xl" style={styles.root}>
        <View style={styles.skipRow}>
          <Pressable
            accessibilityLabel={t.onboarding.skipLabel}
            accessibilityRole="button"
            disabled={isCompleting}
            onPress={() => {
              void completeOnboarding();
            }}
            style={({ pressed }) => [styles.skipButton, pressed ? styles.pressed : null]}
          >
            <AppText color="brand" variant="button">
              {t.onboarding.skip}
            </AppText>
          </Pressable>
        </View>

        <Animated.View
          style={[
            styles.illustrationFrame,
            {
              opacity: slideOpacity,
              transform: [{ translateX: slideTranslate }],
            },
          ]}
        >
          <Image
            accessibilityIgnoresInvertColors
            accessibilityLabel={activeSlide.imageLabel}
            resizeMode="contain"
            source={activeImage}
            style={[styles.illustration, { width: imageWidth }]}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.textBlock,
            {
              opacity: slideOpacity,
              transform: [{ translateX: slideTranslate }],
            },
          ]}
        >
          <AppText align="center" variant="h1">
            {activeSlide.title}
          </AppText>
          <AppText align="center" color="secondary" variant="body">
            {activeSlide.description}
          </AppText>
        </Animated.View>

        <View accessibilityLabel={t.onboarding.paginationLabel} style={styles.pagination}>
          {slides.map((slide, index) => (
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
            title={t.onboarding.previous}
            variant="ghost"
          />
          <AppButton
            fullWidth
            loading={isCompleting}
            onPress={handleNext}
            style={styles.primaryAction}
            title={isFinalSlide ? t.onboarding.start : t.onboarding.next}
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
