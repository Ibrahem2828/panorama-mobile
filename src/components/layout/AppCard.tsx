import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, radius, shadows, spacing } from '../../theme';

type CardVariant = 'default' | 'elevated' | 'outlined' | 'muted';
type CardPadding = 'none' | 'sm' | 'md' | 'lg';

type AppCardProps = {
  children: ReactNode;
  variant?: CardVariant;
  padding?: CardPadding;
  style?: StyleProp<ViewStyle>;
  /** Makes the whole card a pressable with ripple feedback. */
  onPress?: () => void;
  accessibilityLabel?: string;
};

const variantStyles: Record<CardVariant, ViewStyle> = {
  default: {
    ...shadows.xs,
    backgroundColor: colors.background.surface,
    borderColor: colors.gray[200],
    borderWidth: 1,
  },
  elevated: {
    ...shadows.card,
    backgroundColor: colors.background.elevated,
    borderColor: colors.gray[200],
    borderWidth: StyleSheet.hairlineWidth,
  },
  outlined: {
    backgroundColor: colors.background.surface,
    borderColor: colors.border.strong,
    borderWidth: 1,
  },
  muted: {
    backgroundColor: colors.background.muted,
    borderColor: colors.background.muted,
    borderWidth: 1,
  },
};

const paddingStyles: Record<CardPadding, ViewStyle> = {
  none: {
    padding: 0,
  },
  sm: {
    padding: spacing.card.sm,
  },
  md: {
    padding: spacing.card.md,
  },
  lg: {
    padding: spacing.card.lg,
  },
};

export function AppCard({
  children,
  variant = 'default',
  padding = 'md',
  style,
  onPress,
  accessibilityLabel,
}: AppCardProps) {
  const cardStyle = [styles.base, variantStyles[variant], paddingStyles[padding], style];

  if (onPress) {
    return (
      <Pressable
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        android_ripple={{ color: 'rgba(16, 24, 40, 0.08)' }}
        onPress={onPress}
        style={({ pressed }) => [cardStyle, pressed ? styles.pressed : null]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    minHeight: 72,
    borderRadius: radius.card,
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.92,
  },
});
