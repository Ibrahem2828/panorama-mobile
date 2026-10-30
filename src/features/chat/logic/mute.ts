/**
 * Chat mute logic (pure). The server returns the effective state (`is_muted`) and, for a timed mute, `muted_until`. A timed
 * mute that has run out counts as unmuted on the device too, so the bell and the list never lie between two refreshes.
 */
import type { ChatMuteDuration, ChatPreferenceItem } from '../../../api/types';

export type ChatMutePref = {
  isMuted: boolean;
  /** ISO time a timed mute ends; null for «دائمًا» (or when not muted). */
  mutedUntil: string | null;
};

export type ChatMuteChoice = ChatMuteDuration | 'unmute';

export type ChatKind = ChatPreferenceItem['kind'];

export type MutedChatItem = {
  groupId: string;
  name: string;
  kind: ChatKind;
  pref: ChatMutePref;
};

export const UNMUTED: ChatMutePref = { isMuted: false, mutedUntil: null };

const DURATION_MS: Record<Exclude<ChatMuteDuration, 'forever'>, number> = {
  '8h': 8 * 60 * 60 * 1000,
  '1w': 7 * 24 * 60 * 60 * 1000,
};

function parseTime(value: string | null | undefined): number | null {
  if (!value) {
    return null;
  }

  const time = Date.parse(value);

  return Number.isNaN(time) ? null : time;
}

/** True while the chat's notifications are off: muted, and either forever or not yet past `mutedUntil`. */
export function isEffectivelyMuted(pref: ChatMutePref | null | undefined, now: number): boolean {
  if (!pref?.isMuted) {
    return false;
  }

  if (!pref.mutedUntil) {
    return true;
  }

  const until = parseTime(pref.mutedUntil);

  // An unreadable end time must not leave a chat silent forever by accident: fall back to the server's flag.
  return until === null ? true : until > now;
}

/** The mute state a choice leads to (used for the optimistic update before the server answers). */
export function prefForChoice(choice: ChatMuteChoice, now: number): ChatMutePref {
  if (choice === 'unmute') {
    return UNMUTED;
  }

  if (choice === 'forever') {
    return { isMuted: true, mutedUntil: null };
  }

  return { isMuted: true, mutedUntil: new Date(now + DURATION_MS[choice]).toISOString() };
}

/** Arguments of the mute PUT for a choice. */
export function choiceToRequest(choice: ChatMuteChoice): {
  isMuted: boolean;
  muteFor?: ChatMuteDuration;
} {
  return choice === 'unmute' ? { isMuted: false } : { isMuted: true, muteFor: choice };
}

export function normalizeMutePref(raw: unknown): ChatMutePref {
  const source = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const until = typeof source.muted_until === 'string' ? source.muted_until : null;

  return { isMuted: source.is_muted === true, mutedUntil: source.is_muted === true ? until : null };
}

/** Reads `GET chat/preferences/` (a plain array; a `results` wrapper is tolerated), dropping malformed rows. */
export function normalizeMutedChats(raw: unknown): MutedChatItem[] {
  const list = Array.isArray(raw)
    ? raw
    : typeof raw === 'object' &&
        raw !== null &&
        Array.isArray((raw as { results?: unknown }).results)
      ? (raw as { results: unknown[] }).results
      : [];
  const items: MutedChatItem[] = [];

  for (const entry of list) {
    if (typeof entry !== 'object' || entry === null) {
      continue;
    }

    const row = entry as Record<string, unknown>;
    const id = row.group_id;

    if (typeof id !== 'number' && typeof id !== 'string') {
      continue;
    }

    items.push({
      groupId: String(id),
      name: typeof row.name === 'string' ? row.name : '',
      kind: row.kind === 'community' ? 'community' : 'subject',
      pref: normalizeMutePref(row),
    });
  }

  return items;
}

/** Strips Arabic diacritics/tatweel and folds case so a search matches however the name was typed. */
function fold(value: string): string {
  return value
    .normalize('NFKC')
    .replace(/[ً-ٰٟـ]/gu, '')
    .replace(/[أإآ]/gu, 'ا')
    .replace(/ى/gu, 'ي')
    .replace(/ة/gu, 'ه')
    .toLowerCase()
    .trim();
}

export type MutedChatSections = {
  communities: MutedChatItem[];
  subjects: MutedChatItem[];
};

/** Splits the list into the two screen sections, optionally filtered by a name search. */
export function sectionMutedChats(items: readonly MutedChatItem[], query = ''): MutedChatSections {
  const needle = fold(query);
  const matches = needle ? items.filter((item) => fold(item.name).includes(needle)) : items;

  return {
    communities: matches.filter((item) => item.kind === 'community'),
    subjects: matches.filter((item) => item.kind !== 'community'),
  };
}

/** The search box appears once the list is long enough to need it. */
export const MUTED_SEARCH_THRESHOLD = 8;

export function shouldShowMutedSearch(count: number): boolean {
  return count > MUTED_SEARCH_THRESHOLD;
}

/** How many ms until a timed mute ends (for scheduling one re-render); null when nothing will change. */
export function msUntilExpiry(pref: ChatMutePref | null | undefined, now: number): number | null {
  if (!pref?.isMuted) {
    return null;
  }

  const until = parseTime(pref.mutedUntil);

  return until !== null && until > now ? until - now : null;
}
