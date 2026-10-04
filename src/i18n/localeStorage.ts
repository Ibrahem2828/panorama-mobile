import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';

import { LOCALES, type Locale } from './types';

export const LOCALE_STORAGE_KEY = 'panorama_locale_v1';

export const DEFAULT_LOCALE: Locale = 'ar';

function isLocale(value: string | null): value is Locale {
  return value !== null && (LOCALES as readonly string[]).includes(value);
}

/**
 * The device language, used only until the user makes an explicit choice. Guarded because
 * the native module is unavailable in some contexts and a missing locale must not stop
 * the app from starting in Arabic.
 */
export function getDeviceLocale(): Locale {
  try {
    const languageCode = getLocales()[0]?.languageCode ?? null;
    return isLocale(languageCode) ? languageCode : DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}

export async function readStoredLocale(): Promise<Locale | null> {
  try {
    const stored = await AsyncStorage.getItem(LOCALE_STORAGE_KEY);
    return isLocale(stored) ? stored : null;
  } catch {
    return null;
  }
}

export async function storeLocale(locale: Locale): Promise<void> {
  try {
    await AsyncStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // A failed write only costs the preference on next launch; it must not block the UI.
  }
}
