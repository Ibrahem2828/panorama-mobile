import type { TextInputProps } from 'react-native';

import { isDarkScheme } from './colorScheme';
import { colors } from './colors';

/**
 * Props every TextInput spreads so the keyboard, caret and selection follow the colour scheme.
 * (Placeholder colours come from `colors.text.muted`, which is scheme-aware.)
 */
export const inputThemeProps: Pick<
  TextInputProps,
  'keyboardAppearance' | 'selectionColor' | 'cursorColor' | 'placeholderTextColor'
> = {
  keyboardAppearance: isDarkScheme ? 'dark' : 'light',
  placeholderTextColor: colors.text.muted,
  ...(isDarkScheme
    ? { selectionColor: colors.brand.primary, cursorColor: colors.brand.primary }
    : {}),
};
