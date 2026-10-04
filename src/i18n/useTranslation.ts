import { I18nManager } from 'react-native';

import { useLocaleStore } from './store';
import type { Locale, TranslationCatalog } from './types';

type UseTranslationResult = {
  /** The active catalog. Access strings as `t.settings.title` — typed, no key lookup. */
  t: TranslationCatalog;
  locale: Locale;
  setLocale: (locale: Locale) => Promise<void>;
  /** Reflects the running native layout, not the selected locale; they differ until restart. */
  isRTL: boolean;
  needsRestartForDirection: boolean;
};

export function useTranslation(): UseTranslationResult {
  const t = useLocaleStore((state) => state.t);
  const locale = useLocaleStore((state) => state.locale);
  const setLocale = useLocaleStore((state) => state.setLocale);
  const needsRestartForDirection = useLocaleStore((state) => state.needsRestartForDirection);

  return { t, locale, setLocale, isRTL: I18nManager.isRTL, needsRestartForDirection };
}
