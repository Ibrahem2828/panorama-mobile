import type { ReactNode } from 'react';
import type { GestureResponderEvent, StyleProp, TextStyle, ViewStyle } from 'react-native';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { colors, layout, opacity, radius, spacing } from '../../theme';
import { getFlexDirection } from '../../utils/rtl';
import { AppText } from './AppText';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

type AppButtonProps = {
  title: string;
  onPress?: (event: GestureResponderEvent) => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

const sizeStyles: Record<ButtonSize, ViewStyle> = {
  sm: {
    minHeight: layout.touchTargetMinSize,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  md: {
    minHeight: layout.touchTargetMinSize,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  lg: {
    minHeight: 56,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.lg,
  },
};

const containerByVariant: Record<ButtonVariant, ViewStyle> = {
  primary: {
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand.primary,
  },
  secondary: {
    backgroundColor: colors.brand.secondary,
    borderColor: colors.brand.secondary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderColor: colors.border.strong,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  danger: {
    backgroundColor: colors.semantic.error,
    borderColor: colors.semantic.error,
  },
};

const textColorByVariant: Record<ButtonVariant, string> = {
  primary: colors.text.inverse,
  secondary: colors.text.inverse,
  outline: colors.brand.primary,
  ghost: colors.brand.primary,
  danger: colors.text.inverse,
};

export function AppButton({
  title,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  leftIcon,
  rightIcon,
  accessibilityLabel,
  style,
  textStyle,
}: AppButtonProps) {
  const isDisabled = disabled || loading;
  const contentColor = isDisabled ? colors.text.disabled : textColorByVariant[variant];

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        sizeStyles[size],
        containerByVariant[variant],
        fullWidth ? styles.fullWidth : null,
        isDisabled ? styles.disabled : null,
        pressed && !isDisabled ? styles.pressed : null,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={contentColor} size="small" />
      ) : (
        <>
          {leftIcon ? <View style={styles.iconSlot}>{leftIcon}</View> : null}
          <AppText color="inverse" style={[{ color: contentColor }, textStyle]} variant="button">
            {title}
          </AppText>
          {rightIcon ? <View style={styles.iconSlot}>{rightIcon}</View> : null}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minWidth: layout.touchTargetMinSize,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: getFlexDirection('row'),
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.button,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: opacity.disabled,
  },
  pressed: {
    opacity: opacity.pressed,
  },
  iconSlot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
