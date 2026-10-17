import { memo, useEffect, useRef } from 'react';
import type { DimensionValue, StyleProp, ViewStyle } from 'react-native';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { useTranslation } from '../../i18n';
import { colors, radius, spacing } from '../../theme';

type SkeletonProps = {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
};

/** Shared pulse so every skeleton on screen breathes in sync (one animation, native driver). */
function usePulse() {
  const opacity = useRef(new Animated.Value(0.55)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.55,
          duration: 700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return opacity;
}

export const Skeleton = memo(function Skeleton({
  width = '100%',
  height = 16,
  borderRadius = radius.sm,
  style,
}: SkeletonProps) {
  const opacity = usePulse();
  return <Animated.View style={[styles.block, { width, height, borderRadius, opacity }, style]} />;
});

type SkeletonListProps = {
  count?: number;
  /** Row shape: a card with avatar + two lines, or a plain tall card. */
  variant?: 'row' | 'card';
  style?: StyleProp<ViewStyle>;
};

const rowIds = [0, 1, 2, 3, 4, 5, 6, 7];

/** Placeholder list shown while the first page of a list screen loads. */
export const SkeletonList = memo(function SkeletonList({
  count = 5,
  variant = 'row',
  style,
}: SkeletonListProps) {
  const { t } = useTranslation();
  return (
    <View
      accessibilityLabel={t.common.loading}
      accessibilityRole="progressbar"
      style={[styles.list, style]}
    >
      {rowIds.slice(0, count).map((id) =>
        variant === 'card' ? (
          <View key={id} style={styles.card}>
            <Skeleton height={20} width="55%" />
            <Skeleton height={14} width="85%" />
            <Skeleton height={14} width="40%" />
          </View>
        ) : (
          <View key={id} style={styles.row}>
            <Skeleton borderRadius={14} height={48} width={48} />
            <View style={styles.rowText}>
              <Skeleton height={16} width="60%" />
              <Skeleton height={12} width="90%" />
            </View>
          </View>
        ),
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  block: {
    backgroundColor: colors.gray[200],
  },
  list: {
    gap: spacing.md,
  },
  card: {
    gap: spacing.sm,
    padding: spacing.card.md,
    borderRadius: radius.card,
    backgroundColor: colors.background.surface,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.card.md,
    borderRadius: radius.card,
    backgroundColor: colors.background.surface,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  rowText: {
    flex: 1,
    gap: spacing.sm,
  },
});
