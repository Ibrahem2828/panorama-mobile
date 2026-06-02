import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '../../theme';
import type { StatusVariant } from '../../types/common';
import { AppText } from './AppText';

type BadgeSize = 'sm' | 'md';

type AppBadgeProps = {
  label: string;
  variant?: StatusVariant;
  size?: BadgeSize;
  style?: StyleProp<ViewStyle>;
};

const badgeColors: Record<StatusVariant, { backgroundColor: string; color: string }> = {
  neutral: {
    backgroundColor: colors.gray[100],
    color: colors.text.secondary,
  },
  success: {
    backgroundColor: colors.semantic.successSoft,
    color: colors.semantic.success,
  },
  warning: {
    backgroundColor: colors.semantic.warningSoft,
    color: colors.semantic.warning,
  },
  error: {
    backgroundColor: colors.semantic.errorSoft,
    color: colors.semantic.error,
  },
  info: {
    backgroundColor: colors.semantic.infoSoft,
    color: colors.semantic.info,
  },
  brand: {
    backgroundColor: colors.brand.primarySoft,
    color: colors.brand.primary,
  },
};

const sizeStyles: Record<BadgeSize, ViewStyle> = {
  sm: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  md: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
};

export function AppBadge({ label, variant = 'neutral', size = 'sm', style }: AppBadgeProps) {
  const selectedColors = badgeColors[variant];

  return (
    <View
      accessibilityRole="text"
      style={[
        styles.base,
        sizeStyles[size],
        { backgroundColor: selectedColors.backgroundColor },
        style,
      ]}
    >
      <AppText
        align="center"
        style={{ color: selectedColors.color }}
        variant="caption"
        weight="600"
      >
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    borderRadius: radius.full,
  },
});
