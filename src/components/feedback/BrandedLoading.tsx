import { useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, Easing, Image, StyleSheet, View } from 'react-native';

import { spacing, useBrand } from '../../theme';
import { AppText } from '../common';
import { useReduceMotion } from '../motion';

const LOGO_WIDTH = 220;
const LOGO_HEIGHT = 172;

type BrandedLoadingProps = {
  message?: string;
  title?: string;
};

/**
 * Full-screen loading with the brand: the Panorama logo for guests and unknown accounts, the student's own faculty logo once
 * the faculty is known (the app remembers the last faculty, so a cold start already shows the right one). The logo breathes
 * gently over a soft halo; with "reduce motion" on it stays still and a small spinner shows progress instead.
 */
export function BrandedLoading({ message, title }: BrandedLoadingProps) {
  const brand = useBrand();
  const reduce = useReduceMotion();
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduce) {
      pulse.setValue(0);
      return undefined;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1300,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1300,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    loop.start();

    return () => loop.stop();
  }, [pulse, reduce]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.045] });
  const haloScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.12] });
  const haloOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0.18] });

  return (
    <View
      accessibilityLabel={message}
      accessibilityLiveRegion="polite"
      accessibilityRole="progressbar"
      style={styles.container}
    >
      <View style={styles.stage}>
        <Animated.View
          style={[
            styles.halo,
            {
              backgroundColor: brand.primarySoft,
              opacity: haloOpacity,
              transform: [{ scale: haloScale }],
            },
          ]}
        />
        <Animated.View style={{ transform: [{ scale }] }}>
          <Image
            accessibilityIgnoresInvertColors
            resizeMode="contain"
            source={brand.logo}
            style={styles.logo}
          />
        </Animated.View>
      </View>
      {title ? (
        <AppText align="center" variant="title">
          {title}
        </AppText>
      ) : null}
      {reduce ? <ActivityIndicator color={brand.primary} size="small" /> : null}
      {message ? (
        <AppText align="center" color="secondary" variant="bodySmall">
          {message}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    padding: spacing.xl,
  },
  stage: {
    width: LOGO_WIDTH + 80,
    height: LOGO_HEIGHT + 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
    width: LOGO_WIDTH,
    height: LOGO_WIDTH,
    borderRadius: LOGO_WIDTH / 2,
  },
  logo: { width: LOGO_WIDTH, height: LOGO_HEIGHT },
});
