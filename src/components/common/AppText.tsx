import type { ReactNode } from 'react';
import type { StyleProp, TextProps, TextStyle } from 'react-native';
import { StyleSheet, Text } from 'react-native';

import { colors, fontFamilyForWeight, typography, useBrand } from '../../theme';
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

const textColors: Record<Exclude<AppTextColor, 'brand'>, string> = {
  primary: colors.text.primary,
  secondary: colors.text.secondary,
  muted: colors.text.muted,
  inverse: colors.text.inverse,
  success: colors.semantic.success,
  warning: colors.semantic.warning,
  error: colors.semantic.error,
};

function finalWeight(
  variant: AppTextVariant,
  weight: TextStyle['fontWeight'],
  style: StyleProp<TextStyle>,
): TextStyle['fontWeight'] {
  const flat = StyleSheet.flatten(style);
  return flat?.fontWeight ?? weight ?? typography.variants[variant].fontWeight;
}

export function AppText({
  children,
  variant = 'body',
  color = 'primary',
  align,
  weight,
  style,
  ...props
}: AppTextProps) {
  const brand = useBrand();
  return (
    <Text
      {...props}
      style={[
        styles.base,
        typography.variants[variant],
        {
          color: color === 'brand' ? brand.primary : textColors[color],
          textAlign: align ?? getRTLTextAlign(),
        },
        weight ? { fontWeight: weight } : null,
        style,
        // Last: the bundled Kufi family is picked from the final weight, and fontWeight is cleared so Android never fakes bold.
        {
          fontFamily: fontFamilyForWeight(finalWeight(variant, weight, style)),
          fontWeight: 'normal',
        },
      ]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {},
});
