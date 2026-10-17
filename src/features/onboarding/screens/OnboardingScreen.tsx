import { useEffect, useMemo, useRef, useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Animated, Easing, PanResponder, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton, AppText, Stack } from '../../../components';
import { PublicRoutes } from '../../../navigation/routes';
import type { PublicStackParamList } from '../../../navigation/types';
import { colors, layout, spacing } from '../../../theme';
import { getIsRTL } from '../../../utils/rtl';
import { useTranslation } from '../../../i18n';
import { OnboardingHero } from '../components/OnboardingHero';
import type { OnboardingScene } from '../components/OnboardingHero';
import { PageIndicator } from '../components/PageIndicator';
import { markOnboardingSeen } from '../services';

type OnboardingScreenProps = NativeStackScreenProps<PublicStackParamList, 'Onboarding'>;

// Scenes only; the copy for each slide comes from the catalog at the same index.
const SCENES: readonly OnboardingScene[] = ['logo', 'verification', 'groups', 'files'];
const SWIPE_DISTANCE = 48;

export function OnboardingScreen({ navigation }: OnboardingScreenProps) {
  const { t } = useTranslation();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);
  const slides = t.onboarding.slides;
  const slideCount = slides.length;
  const activeSlide = slides[activeIndex] ?? slides[0]!;
  const isFinalSlide = activeIndex === slideCount - 1;
  const direction = useRef(1);

  const opacity = useRef(new Animated.Value(1)).current;
  const shift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    opacity.setValue(0);
    // translateX is physical: forward enters from the left under RTL.
    shift.setValue(direction.current * 28 * (getIsRTL() ? -1 : 1));
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(shift, {
        toValue: 0,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [activeIndex, opacity, shift]);

  function go(delta: 1 | -1) {
    direction.current = delta;
    setActiveIndex((index) => Math.min(Math.max(index + delta, 0), slideCount - 1));
  }

  // Swipe: dragging towards the reading start goes forward, like paging a book.
  const goRef = useRef(go);
  goRef.current = go;
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          Math.abs(gesture.dx) > 16 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.5,
        onPanResponderRelease: (_, gesture) => {
          if (Math.abs(gesture.dx) < SWIPE_DISTANCE) return;
          const towardsStart = getIsRTL() ? gesture.dx > 0 : gesture.dx < 0;
          goRef.current(towardsStart ? 1 : -1);
        },
      }),
    [],
  );

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
    go(1);
  }

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.body} {...panResponder.panHandlers}>
        <Animated.View style={[styles.hero, { opacity, transform: [{ translateX: shift }] }]}>
          <View accessibilityLabel={activeSlide.imageLabel} accessible>
            <OnboardingHero scene={SCENES[activeIndex] ?? 'logo'} />
          </View>
        </Animated.View>

        <Animated.View style={[styles.copy, { opacity, transform: [{ translateX: shift }] }]}>
          <AppText align="center" variant="h1">
            {activeSlide.title}
          </AppText>
          <AppText align="center" color="secondary" variant="body">
            {activeSlide.description}
          </AppText>
        </Animated.View>
      </View>

      <Stack gap="md" style={styles.bottom}>
        <PageIndicator
          accessibilityLabel={t.onboarding.paginationLabel}
          activeIndex={activeIndex}
          count={slideCount}
        />
        <AppButton
          fullWidth
          loading={isCompleting}
          onPress={handleNext}
          size="lg"
          title={isFinalSlide ? t.onboarding.start : t.onboarding.next}
        />
        <View style={styles.skipSlot}>
          {isFinalSlide ? null : (
            <Pressable
              accessibilityLabel={t.onboarding.skipLabel}
              accessibilityRole="button"
              disabled={isCompleting}
              onPress={() => void completeOnboarding()}
              style={({ pressed }) => [styles.skip, pressed ? styles.pressed : null]}
            >
              <AppText color="secondary" variant="button">
                {t.onboarding.skip}
              </AppText>
            </Pressable>
          )}
        </View>
      </Stack>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // White, not off-white: the logo artwork has a white background and must not show a box.
  root: {
    flex: 1,
    backgroundColor: colors.background.surface,
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.xl,
    paddingHorizontal: layout.screenHorizontalPadding,
  },
  hero: {
    alignItems: 'center',
  },
  copy: {
    gap: spacing.md,
    paddingHorizontal: spacing.sm,
    minHeight: 150,
  },
  bottom: {
    paddingHorizontal: layout.screenHorizontalPadding,
    paddingBottom: spacing.md,
  },
  skipSlot: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skip: {
    minHeight: 48,
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
});
