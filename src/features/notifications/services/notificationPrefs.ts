/**
 * Notification preference logic (pure). The backend contract: `GET/PATCH /notifications/preferences/` gains
 * `channels` {chat, groups, printing, verification, support} (booleans) and `quiet_hours` {enabled, start, end, timezone}, and
 * `GET /notifications/summary/` returns the unread count per category. Every field may be missing on an older backend, so
 * everything here treats a missing field as "not supported" and the screens hide the matching controls.
 */
import type { NotificationRouteIntent } from '../types';

export const NOTIFICATION_CATEGORIES = [
  'chat',
  'groups',
  'printing',
  'verification',
  'support',
] as const;

export type NotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number];

export type QuietHours = {
  enabled: boolean;
  /** 'HH:MM', 24-hour. */
  start: string;
  end: string;
  timezone?: string;
};

export type NormalizedPreferences = {
  inApp: boolean;
  push: boolean;
  /** null when the server has no per-category channels (the switches are hidden). */
  channels: Record<NotificationCategory, boolean> | null;
  /** null when the server has no quiet hours. */
  quietHours: QuietHours | null;
  /** Chat notifications of every community are muted; null when the server has no such setting (switch hidden). */
  muteCommunities: boolean | null;
};

export const DEFAULT_QUIET_HOURS: QuietHours = { enabled: false, start: '22:00', end: '07:00' };

const TIME = /^([01]\d|2[0-3]):([0-5]\d)$/u;

export function isValidTime(value: unknown): value is string {
  return typeof value === 'string' && TIME.test(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Reads the preferences object the API returned, tolerating missing or malformed optional fields. */
export function normalizePreferences(raw: unknown): NormalizedPreferences {
  const source = isRecord(raw) ? raw : {};
  let channels: NormalizedPreferences['channels'] = null;

  if (isRecord(source.channels)) {
    const data = source.channels;

    channels = Object.fromEntries(
      NOTIFICATION_CATEGORIES.map((category) => [category, data[category] !== false]),
    ) as Record<NotificationCategory, boolean>;
  }

  let quietHours: QuietHours | null = null;

  if (isRecord(source.quiet_hours)) {
    const data = source.quiet_hours;

    quietHours = {
      enabled: data.enabled === true,
      start: isValidTime(data.start) ? data.start : DEFAULT_QUIET_HOURS.start,
      end: isValidTime(data.end) ? data.end : DEFAULT_QUIET_HOURS.end,
      timezone: typeof data.timezone === 'string' && data.timezone ? data.timezone : undefined,
    };
  }

  return {
    inApp: source.in_app_enabled !== false,
    push: source.push_enabled !== false,
    channels,
    quietHours,
    muteCommunities: typeof source.mute_communities === 'boolean' ? source.mute_communities : null,
  };
}

/** PATCH body for the «mute communities» switch. */
export function muteCommunitiesPatch(value: boolean) {
  return { mute_communities: value };
}

/** PATCH body that flips one category; sends the whole channels object so a partial server merge cannot lose the others. */
export function channelPatch(
  current: Record<NotificationCategory, boolean>,
  category: NotificationCategory,
  value: boolean,
) {
  return { channels: { ...current, [category]: value } };
}

/** PATCH body for quiet hours; rejects malformed times so a typo never reaches the server. */
export function quietHoursPatch(next: QuietHours, fallbackTimezone?: string) {
  if (!isValidTime(next.start) || !isValidTime(next.end)) {
    return null;
  }

  return {
    quiet_hours: {
      enabled: next.enabled,
      start: next.start,
      end: next.end,
      ...(next.timezone || fallbackTimezone ? { timezone: next.timezone ?? fallbackTimezone } : {}),
    },
  };
}

function minutes(value: string): number {
  const [hours = '0', mins = '0'] = value.split(':');

  return Number(hours) * 60 + Number(mins);
}

/** Moves an 'HH:MM' time by whole minutes, wrapping around midnight (used by the quiet-hours steppers). */
export function shiftTime(value: string, deltaMinutes: number): string {
  const base = isValidTime(value) ? minutes(value) : 0;
  const shifted = (((base + deltaMinutes) % 1440) + 1440) % 1440;

  return `${String(Math.floor(shifted / 60)).padStart(2, '0')}:${String(shifted % 60).padStart(2, '0')}`;
}

/** Whether `now` (device local time) falls inside the window; a window like 22:00 → 07:00 wraps past midnight. */
export function isWithinQuietHours(now: Date, quiet: QuietHours | null | undefined): boolean {
  if (!quiet?.enabled || !isValidTime(quiet.start) || !isValidTime(quiet.end)) {
    return false;
  }

  const start = minutes(quiet.start);
  const end = minutes(quiet.end);
  const current = now.getHours() * 60 + now.getMinutes();

  if (start === end) {
    return false;
  }

  return start < end ? current >= start && current < end : current >= start || current < end;
}

/** The category a push belongs to, from what the backend puts in its data. Null for categories the user cannot mute. */
export function pushCategory(
  data: Record<string, unknown> | null | undefined,
): NotificationCategory | null {
  const explicit = typeof data?.category === 'string' ? data.category : undefined;
  const kind = typeof data?.kind === 'string' ? data.kind : undefined;
  const type = typeof data?.type === 'string' ? data.type : undefined;
  const value = (explicit ?? kind ?? type ?? '').toLowerCase();

  if ((NOTIFICATION_CATEGORIES as readonly string[]).includes(value)) {
    return value as NotificationCategory;
  }

  switch (value) {
    case 'enrollment':
    case 'group':
      return 'groups';
    case 'print':
    case 'print_order':
      return 'printing';
    default:
      return null;
  }
}

export type BannerPolicy = { show: boolean; sound: boolean; badge: boolean };

/**
 * What to do with a push that arrives while the app is open: nothing for a category the user switched off, for a muted chat
 * or for the chat they are reading; shown but silent during quiet hours; otherwise the normal banner.
 */
export function foregroundBannerPolicy(input: {
  category: NotificationCategory | null;
  prefs: NormalizedPreferences | null;
  now: Date;
  readingThisChat: boolean;
  /** This push belongs to a chat the user muted (timed or forever, or by the communities switch). */
  chatMuted?: boolean;
}): BannerPolicy {
  if (input.readingThisChat || input.chatMuted) {
    return { show: false, sound: false, badge: false };
  }

  if (input.category && input.prefs?.channels && input.prefs.channels[input.category] === false) {
    return { show: false, sound: false, badge: false };
  }

  if (isWithinQuietHours(input.now, input.prefs?.quietHours)) {
    return { show: true, sound: false, badge: true };
  }

  return { show: true, sound: true, badge: true };
}

export type NormalizedSummary = {
  total: number;
  byCategory: Partial<Record<NotificationCategory, number>>;
};

function count(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}

/** Reads `GET /notifications/summary/` in any of the shapes the backend might use. */
export function normalizeSummary(raw: unknown): NormalizedSummary {
  const source = isRecord(raw) ? raw : {};
  const byCategory: NormalizedSummary['byCategory'] = {};
  const map = isRecord(source.by_category)
    ? source.by_category
    : isRecord(source.unread_by_category)
      ? source.unread_by_category
      : isRecord(source.categories) && !Array.isArray(source.categories)
        ? source.categories
        : null;

  if (map) {
    for (const category of NOTIFICATION_CATEGORIES) {
      const entry = map[category];
      const value = isRecord(entry) ? count(entry.unread ?? entry.count) : count(entry);

      if (value > 0) {
        byCategory[category] = value;
      }
    }
  } else if (Array.isArray(source.categories)) {
    for (const entry of source.categories) {
      if (isRecord(entry) && typeof entry.category === 'string') {
        const category = entry.category as NotificationCategory;
        const value = count(entry.unread ?? entry.count);

        if ((NOTIFICATION_CATEGORIES as readonly string[]).includes(category) && value > 0) {
          byCategory[category] = value;
        }
      }
    }
  }

  const summed = Object.values(byCategory).reduce((sum, value) => sum + (value ?? 0), 0);
  const total = count(source.total ?? source.unread ?? source.count) || summed;

  return { total, byCategory };
}

/** Unread numbers shown on the bottom tabs. Anything not owned by a tab lands on Profile (where the inbox lives). */
export function tabBadgeCounts(input: { summary: NormalizedSummary; chatUnread: number }): {
  groups: number;
  printing: number;
  profile: number;
} {
  const { summary } = input;
  const groups =
    Math.max(input.chatUnread, summary.byCategory.chat ?? 0) + (summary.byCategory.groups ?? 0);
  const printing = summary.byCategory.printing ?? 0;
  const owned = (summary.byCategory.chat ?? 0) + (summary.byCategory.groups ?? 0) + printing;
  const profile = Math.max(summary.total - owned, 0);

  return { groups, printing, profile };
}

/** Where a tap on a push goes when the backend sent no usable deep link: by category and ids in the data. */
export function intentFromPushData(
  data: Record<string, unknown> | null | undefined,
): NotificationRouteIntent | null {
  const category = pushCategory(data);
  const id = (key: string) => {
    const value = data?.[key];

    return typeof value === 'number' || (typeof value === 'string' && /^\d+$/u.test(value))
      ? String(value)
      : null;
  };

  switch (category) {
    case 'chat': {
      const groupId = id('group_id');

      return groupId ? { kind: 'groupChat', groupId } : { kind: 'groups' };
    }
    case 'groups':
      return { kind: 'groups' };
    case 'printing': {
      const orderId = id('order_id') ?? id('print_order_id');

      return orderId ? { kind: 'printingOrder', orderId } : { kind: 'printingOrders' };
    }
    case 'verification':
      return { kind: 'verification' };
    case 'support': {
      const ticketId = id('ticket_id');

      return ticketId ? { kind: 'supportTicket', ticketId } : { kind: 'supportList' };
    }
    default:
      return null;
  }
}
