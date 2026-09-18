import { I18nManager } from 'react-native';
import { create } from 'zustand';

import { DEFAULT_LOCALE, getDeviceLocale, readStoredLocale, storeLocale } from './localeStorage';
import { ar } from './locales/ar';
import { en } from './locales/en';
import type { Locale, TranslationCatalog } from './types';

const CATALOGS: Record<Locale, TranslationCatalog> = { ar, en };

export const LOCALE_DIRECTION: Record<Locale, 'rtl' | 'ltr'> = { ar: 'rtl', en: 'ltr' };

type LocaleState = {
  locale: Locale;
  t: TranslationCatalog;
  /** True once a locale was chosen whose direction differs from the running layout. */
  needsRestartForDirection: boolean;
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  setLocale: (locale: Locale) => Promise<void>;
};

function directionMatchesRuntime(locale: Locale): boolean {
  return (LOCALE_DIRECTION[locale] === 'rtl') === I18nManager.isRTL;
}

export const useLocaleStore = create<LocaleState>((set) => ({
  locale: DEFAULT_LOCALE,
  t: CATALOGS[DEFAULT_LOCALE],
  needsRestartForDirection: false,
  isHydrated: false,

  async hydrate() {
    const locale = (await readStoredLocale()) ?? getDeviceLocale();
    // Applies to the *next* launch: React Native reads direction from the native layer at
    // startup, so forcing it now cannot re-lay-out the running app.
    I18nManager.allowRTL(true);
    I18nManager.forceRTL(LOCALE_DIRECTION[locale] === 'rtl');
    set({
      locale,
      t: CATALOGS[locale],
      isHydrated: true,
      needsRestartForDirection: !directionMatchesRuntime(locale),
    });
  },

  async setLocale(locale) {
    await storeLocale(locale);
    I18nManager.forceRTL(LOCALE_DIRECTION[locale] === 'rtl');
    set({
      locale,
      t: CATALOGS[locale],
      needsRestartForDirection: !directionMatchesRuntime(locale),
    });
  },
}));
