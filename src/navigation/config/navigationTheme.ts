import type { Theme } from '@react-navigation/native';
import { DefaultTheme } from '@react-navigation/native';

import { colors } from '../../theme';

export function createNavigationTheme(primary: string): Theme {
  return {
    ...DefaultTheme,
    dark: false,
    colors: {
      ...DefaultTheme.colors,
      primary,
      background: colors.background.primary,
      card: colors.background.surface,
      text: colors.text.primary,
      border: colors.border.default,
      notification: colors.brand.accent,
    },
  };
}

export const navigationTheme: Theme = createNavigationTheme(colors.brand.primary);
