import type { ReactNode } from 'react';
import type { GestureResponderEvent, StyleProp, ViewStyle } from 'react-native';
import { Pressable, StyleSheet } from 'react-native';

import { colors, layout, opacity, radius, shadows } from '../../theme';

type IconButtonVariant = 'ghost' | 'surface' | 'primary' | 'danger';
type IconButtonSize = 'sm' | 'md' | 'lg';
type IconButtonShape = 'square' | 'circle';

type AppIconButtonProps = {
  icon: ReactNode;
  accessibilityLabel: string;
  onPress?: (event: GestureResponderEvent) => void;
  disabled?: boolean;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  shape?: IconButtonShape;
  style?: StyleProp<ViewStyle>;
};

const sizeStyles: Record<IconButtonSize, ViewStyle> = {
  sm: {
    width: layout.iconButton.sm,
    height: layout.iconButton.sm,
  },
  md: {
    width: layout.iconButton.md,
    height: layout.iconButton.md,
  },
  lg: {
    width: layout.iconButton.lg,
    height: layout.iconButton.lg,
  },
};

const variantStyles: Record<IconButtonVariant, ViewStyle> = {
  ghost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  surface: {
    ...shadows.xs,
    backgroundColor: colors.background.surface,
    borderColor: colors.border.default,
  },
  primary: {
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand.primary,
  },
  danger: {
    backgroundColor: colors.semantic.error,
    borderColor: colors.semantic.error,
  },
};

export function AppIconButton({
  icon,
  accessibilityLabel,
  onPress,
  disabled = false,
  variant = 'ghost',
  size = 'md',
  shape = 'square',
  style,
}: AppIconButtonProps) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        sizeStyles[size],
        variantStyles[variant],
        shape === 'circle' ? styles.circle : styles.square,
        disabled ? styles.disabled : null,
        pressed && !disabled ? styles.pressed : null,
        style,
      ]}
    >
      {icon}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  square: {
    borderRadius: radius.button,
  },
  circle: {
    borderRadius: radius.full,
  },
  disabled: {
    opacity: opacity.disabled,
  },
  pressed: {
    opacity: opacity.pressed,
  },
});
