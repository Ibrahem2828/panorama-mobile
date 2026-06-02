import type { Theme } from '@react-navigation/native';
import { DefaultTheme } from '@react-navigation/native';

import { colors } from '../../theme';

export const navigationTheme: Theme = {
  ...DefaultTheme,
  dark: false,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.brand.primary,
    background: colors.background.primary,
    card: colors.background.surface,
    text: colors.text.primary,
    border: colors.border.default,
    notification: colors.brand.accent,
  },
};
