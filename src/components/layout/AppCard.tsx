import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';

import { colors, radius, shadows, spacing } from '../../theme';

type CardVariant = 'default' | 'elevated' | 'outlined' | 'muted';
type CardPadding = 'none' | 'sm' | 'md' | 'lg';

type AppCardProps = {
  children: ReactNode;
  variant?: CardVariant;
  padding?: CardPadding;
  style?: StyleProp<ViewStyle>;
};

const variantStyles: Record<CardVariant, ViewStyle> = {
  default: {
    backgroundColor: colors.background.surface,
    borderColor: colors.border.default,
    borderWidth: 1,
  },
  elevated: {
    ...shadows.card,
    backgroundColor: colors.background.elevated,
    borderColor: colors.border.default,
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

export function AppCard({ children, variant = 'default', padding = 'md', style }: AppCardProps) {
  return (
    <View style={[styles.base, variantStyles[variant], paddingStyles[padding], style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 72,
    borderRadius: radius.card,
  },
});
