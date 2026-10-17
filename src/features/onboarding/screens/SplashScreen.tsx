import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { images } from '../../../assets/images';
import { AppScreen, AppText, useReduceMotion } from '../../../components';
import { useTranslation } from '../../../i18n';
import { colors, spacing } from '../../../theme';

const LOGO_WIDTH = 260;
const LOGO_RATIO = 499 / 640;

/** Branded launch screen: the logo springs in, the tagline follows, and a soft halo keeps breathing. */
export function SplashScreen() {
  const { t } = useTranslation();
  const reduce = useReduceMotion();
  const logo = useRef(new Animated.Value(0)).current;
  const text = useRef(new Animated.Value(0)).current;
  const halo = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduce) {
      logo.setValue(1);
      text.setValue(1);
      return;
    }
    const intro = Animated.sequence([
      Animated.spring(logo, { toValue: 1, friction: 6, tension: 60, useNativeDriver: true }),
      Animated.timing(text, {
        toValue: 1,
        duration: 380,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(halo, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(halo, {
          toValue: 0,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    intro.start();
    pulse.start();
    return () => {
      intro.stop();
      pulse.stop();
    };
  }, [halo, logo, reduce, text]);

  return (
    <AppScreen
      backgroundColor={colors.background.surface}
      contentContainerStyle={styles.content}
      safeArea
    >
      <View style={styles.center}>
        <View style={styles.logoWrap}>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.halo,
              {
                opacity: halo.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.9] }),
                transform: [
                  { scale: halo.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.08] }) },
                ],
              },
            ]}
          />
          <Animated.Image
            accessibilityIgnoresInvertColors
            accessibilityLabel={t.auth.logoAlt}
            resizeMode="contain"
            source={images.brand.logoFullAr}
            style={{
              width: LOGO_WIDTH,
              height: LOGO_WIDTH * LOGO_RATIO,
              opacity: logo,
              transform: [
                { scale: logo.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) },
              ],
            }}
          />
        </View>
        <Animated.View
          style={[
            styles.textBlock,
            {
              opacity: text,
              transform: [
                { translateY: text.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) },
              ],
            },
          ]}
        >
          <AppText align="center" color="secondary" variant="body">
            {t.onboarding.appTagline}
          </AppText>
        </Animated.View>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, padding: spacing.xl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.xl },
  logoWrap: { alignItems: 'center', justifyContent: 'center' },
  halo: {
    position: 'absolute',
    width: LOGO_WIDTH * 1.15,
    height: LOGO_WIDTH * 1.15,
    borderRadius: LOGO_WIDTH,
    backgroundColor: colors.background.muted,
  },
  textBlock: { alignItems: 'center' },
});
