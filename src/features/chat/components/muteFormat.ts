import type { Locale, TranslationCatalog } from '../../../i18n';
import { formatDateTime } from '../../../utils/formatDateTime';
import { isEffectivelyMuted, type ChatMutePref } from '../logic/mute';

type MuteCopy = TranslationCatalog['chat']['mute'];

/** «الإشعارات مفعّلة» / «مكتومة حتى ...» / «مكتومة دائمًا» for one chat. */
export function muteStatusText(
  pref: ChatMutePref | null | undefined,
  now: number,
  copy: MuteCopy,
  locale: Locale,
): string {
  if (!isEffectivelyMuted(pref, now)) {
    return copy.statusOn;
  }

  const when = pref?.mutedUntil ? formatDateTime(pref.mutedUntil, locale) : null;

  return when ? copy.mutedUntil(when) : copy.mutedForever;
}
