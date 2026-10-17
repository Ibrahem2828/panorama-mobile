import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { colors, spacing, useBrand } from '../../../theme';

type PageIndicatorProps = {
  count: number;
  activeIndex: number;
  accessibilityLabel: string;
};

const DOT = 8;
const ACTIVE_WIDTH = 28;

/** Dots whose active one stretches into a pill, animated on every page change. */
export function PageIndicator({ count, activeIndex, accessibilityLabel }: PageIndicatorProps) {
  const brand = useBrand();
  const progress = useRef(
    Array.from({ length: count }, (_, index) => new Animated.Value(index === activeIndex ? 1 : 0)),
  ).current;

  useEffect(() => {
    Animated.parallel(
      progress.map((value, index) =>
        Animated.timing(value, {
          toValue: index === activeIndex ? 1 : 0,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
      ),
    ).start();
  }, [activeIndex, progress]);

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="progressbar"
      style={styles.row}
    >
      {progress.map((value, index) => (
        <Animated.View
          key={index}
          style={[
            styles.dot,
            {
              width: value.interpolate({ inputRange: [0, 1], outputRange: [DOT, ACTIVE_WIDTH] }),
              backgroundColor: value.interpolate({
                inputRange: [0, 1],
                outputRange: [colors.border.default, brand.primary],
              }),
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignSelf: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dot: {
    height: DOT,
    borderRadius: DOT / 2,
  },
});
