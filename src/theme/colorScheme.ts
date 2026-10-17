import { Appearance } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/**
 * The colour scheme is resolved ONCE, synchronously, when this module first loads. The app builds its
 * StyleSheets at module load from `colors.*`, so the scheme has to be known before any screen module is
 * evaluated (this file is imported first in App.tsx and by theme/colors.ts). Changing the preference
 * therefore takes effect after the app restarts.
 */
export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedScheme = 'light' | 'dark';

export const THEME_PREFERENCE_KEY = 'panorama.theme';
export const THEME_PREFERENCES: readonly ThemePreference[] = ['system', 'light', 'dark'];

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark';
}

export function readThemePreference(): ThemePreference {
  try {
    const stored = SecureStore.getItem(THEME_PREFERENCE_KEY);
    return isThemePreference(stored) ? stored : 'system';
  } catch {
    return 'system';
  }
}

export function resolveScheme(preference: ThemePreference): ResolvedScheme {
  if (preference === 'light' || preference === 'dark') {
    return preference;
  }
  try {
    return Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export function saveThemePreference(preference: ThemePreference): void {
  try {
    SecureStore.setItem(THEME_PREFERENCE_KEY, preference);
  } catch {
    // Persistence is best effort; the current session keeps working.
  }
}

export const themePreference: ThemePreference = readThemePreference();
export const resolvedScheme: ResolvedScheme = resolveScheme(themePreference);
// An explicit choice also pins native chrome (dialogs, keyboard, scroll bars) to the same scheme; 'system'
// hands control back to the OS.
try {
  Appearance.setColorScheme(themePreference === 'system' ? null : themePreference);
} catch {
  // Not supported on this platform/runtime; the JS palette is already resolved.
}

export const isDarkScheme = resolvedScheme === 'dark';
