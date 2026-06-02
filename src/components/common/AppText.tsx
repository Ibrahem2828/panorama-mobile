import type { ReactNode } from 'react';
import type { StyleProp, TextProps, TextStyle } from 'react-native';
import { StyleSheet, Text } from 'react-native';

import { colors, typography } from '../../theme';
import { getRTLTextAlign } from '../../utils/rtl';

type AppTextVariant = keyof typeof typography.variants;
type AppTextColor =
  | 'primary'
  | 'secondary'
  | 'muted'
  | 'inverse'
  | 'success'
  | 'warning'
  | 'error'
  | 'brand';

type AppTextProps = TextProps & {
  children: ReactNode;
  variant?: AppTextVariant;
  color?: AppTextColor;
  align?: TextStyle['textAlign'];
  weight?: TextStyle['fontWeight'];
  style?: StyleProp<TextStyle>;
};

const textColors: Record<AppTextColor, string> = {
  primary: colors.text.primary,
  secondary: colors.text.secondary,
  muted: colors.text.muted,
  inverse: colors.text.inverse,
  success: colors.semantic.success,
  warning: colors.semantic.warning,
  error: colors.semantic.error,
  brand: colors.brand.primary,
};

export function AppText({
  children,
  variant = 'body',
  color = 'primary',
  align,
  weight,
  style,
  ...props
}: AppTextProps) {
  return (
    <Text
      {...props}
      style={[
        styles.base,
        typography.variants[variant],
        {
          color: textColors[color],
          textAlign: align ?? getRTLTextAlign(),
        },
        weight ? { fontWeight: weight } : null,
        style,
      ]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    writingDirection: 'rtl',
  },
});
