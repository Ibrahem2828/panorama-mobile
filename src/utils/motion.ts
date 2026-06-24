import { Animated, Easing } from 'react-native';

/**
 * Lightweight motion presets for Phase B.
 * Use React Native Animated only (no new deps).
 * All durations short and purposeful.
 */

export const MOTION = {
  duration: {
    fast: 120,
    normal: 180,
    slow: 240,
  },
  easing: {
    standard: Easing.out(Easing.cubic),
    entrance: Easing.out(Easing.cubic),
    press: Easing.inOut(Easing.quad),
  },
} as const;

/**
 * Entrance animation: fade + translateY
 */
export function createEntranceAnim(initialTranslate = 12) {
  const opacity = new Animated.Value(0);
  const translateY = new Animated.Value(initialTranslate);

  const animate = (duration: number = MOTION.duration.normal) => {
    opacity.setValue(0);
    translateY.setValue(initialTranslate);
    return Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        easing: MOTION.easing.entrance,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration,
        easing: MOTION.easing.entrance,
        useNativeDriver: true,
      }),
    ]);
  };

  return { opacity, translateY, animate };
}

/**
 * Press scale animation helper (for cards/buttons)
 */
export function createPressScaleAnim() {
  const scale = new Animated.Value(1);

  const onPressIn = () => {
    Animated.timing(scale, {
      toValue: 0.97,
      duration: MOTION.duration.fast,
      easing: MOTION.easing.press,
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = () => {
    Animated.timing(scale, {
      toValue: 1,
      duration: MOTION.duration.fast,
      easing: MOTION.easing.press,
      useNativeDriver: true,
    }).start();
  };

  return { scale, onPressIn, onPressOut };
}

/**
 * Simple fade-in for success/empty/search states
 */
export function createFadeInAnim() {
  const opacity = new Animated.Value(0);

  const animate = (duration: number = MOTION.duration.normal) =>
    Animated.timing(opacity, {
      toValue: 1,
      duration,
      easing: MOTION.easing.entrance,
      useNativeDriver: true,
    });

  return { opacity, animate };
}
