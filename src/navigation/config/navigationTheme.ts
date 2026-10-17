import type { Theme } from '@react-navigation/native';
import { DarkTheme, DefaultTheme } from '@react-navigation/native';

import { colors } from '../../theme';
import { isDarkScheme } from '../../theme/colorScheme';

const base = isDarkScheme ? DarkTheme : DefaultTheme;

export function createNavigationTheme(primary: string): Theme {
  return {
    ...base,
    dark: isDarkScheme,
    colors: {
      ...base.colors,
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
