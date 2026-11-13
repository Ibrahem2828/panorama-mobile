import AsyncStorage from '@react-native-async-storage/async-storage';

import type { PrintOptionHelpItem, PrintOptionHelpResponse } from '../../../api/types';

/**
 * The explanations («i» buttons) of the print options. Help is optional: nothing here may ever throw into the order
 * flow, and an option without help simply shows no button.
 *
 * Topics: print_size, print_colour, print_sides, binding, cover, spiral_wire, and `extra:<section>` for the sectioned
 * paper extras. `key` is the option code; a blank key is the help of the whole topic.
 */

export const PRINT_HELP_TOPICS = {
  size: 'print_size',
  colour: 'print_colour',
  sides: 'print_sides',
  binding: 'binding',
  cover: 'cover',
  spiralWire: 'spiral_wire',
} as const;

/** The topic of a sectioned paper extra, e.g. `extra:paper-type`. */
export function extraHelpTopic(section: string): string {
  return `extra:${section}`;
}

export const PRINT_HELP_STORAGE_KEY = 'panorama_print_option_help_v1';
/** The server lets clients keep the list for five minutes; within this window an opened flow reuses what it has. */
export const PRINT_HELP_REFRESH_MS = 10 * 60 * 1000;

export type PrintHelpCache = {
  updatedAt: string | null;
  items: PrintOptionHelpItem[];
  savedAt: number;
};

export type PrintHelpIndex = {
  /** topic -> all entries of that topic in display order (topic-level first). */
  byTopic: Record<string, PrintOptionHelpItem[]>;
};

export const EMPTY_HELP_INDEX: PrintHelpIndex = { byTopic: {} };

function text(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

/** Keeps only well-formed entries that have something to say (a blank title AND body is never shown). */
export function normalizeHelpItems(raw: unknown): PrintOptionHelpItem[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  const items: PrintOptionHelpItem[] = [];

  raw.forEach((entry) => {
    if (!entry || typeof entry !== 'object') {
      return;
    }

    const record = entry as Record<string, unknown>;
    const topic = text(record.topic).trim();
    const title = text(record.title).trim();
    const body = text(record.body).trim();

    if (!topic || (!title && !body)) {
      return;
    }

    items.push({
      id: Number(record.id) || 0,
      topic,
      key: text(record.key).trim(),
      title,
      body,
      image_url: text(record.image_url).trim() || null,
      image_caption: text(record.image_caption).trim(),
      sort_order: Number(record.sort_order) || 0,
      updated_at: text(record.updated_at),
    });
  });

  return items;
}

export function normalizeHelpResponse(raw: unknown): PrintHelpCache {
  const response = (raw && typeof raw === 'object' ? raw : {}) as Partial<PrintOptionHelpResponse>;

  return {
    updatedAt: typeof response.updated_at === 'string' ? response.updated_at : null,
    items: normalizeHelpItems(response.items),
    savedAt: Date.now(),
  };
}

export function buildHelpIndex(items: readonly PrintOptionHelpItem[]): PrintHelpIndex {
  const byTopic: Record<string, PrintOptionHelpItem[]> = {};

  items.forEach((item) => {
    (byTopic[item.topic] ??= []).push(item);
  });

  Object.values(byTopic).forEach((list) =>
    list.sort((a, b) => {
      // The topic-level entry first, then the server's own order.
      if ((a.key === '') !== (b.key === '')) {
        return a.key === '' ? -1 : 1;
      }

      return a.sort_order - b.sort_order || a.id - b.id;
    }),
  );

  return { byTopic };
}

/** Every entry of a topic (topic-level first); an empty list means there is no help and no button must be drawn. */
export function helpEntries(index: PrintHelpIndex, topic: string): PrintOptionHelpItem[] {
  return index.byTopic[topic] ?? [];
}

export function hasHelp(index: PrintHelpIndex, topic: string): boolean {
  return helpEntries(index, topic).length > 0;
}

/**
 * The entry to open first: the one of the chosen option, else the topic-level one, else (only when the option has
 * nothing) the first entry of the topic. Null when the topic has no help at all.
 */
export function resolveHelp(
  index: PrintHelpIndex,
  topic: string,
  key?: string | null,
): PrintOptionHelpItem | null {
  const entries = helpEntries(index, topic);

  if (entries.length === 0) {
    return null;
  }

  const wanted = (key ?? '').trim();

  return (
    (wanted ? entries.find((entry) => entry.key === wanted) : undefined) ??
    entries.find((entry) => entry.key === '') ??
    entries[0] ??
    null
  );
}

/** Whether a stored list is recent enough that opening another print flow need not ask the server again. */
export function isHelpFresh(lastFetchedAt: number | null, now: number): boolean {
  return (
    lastFetchedAt !== null &&
    now - lastFetchedAt >= 0 &&
    now - lastFetchedAt < PRINT_HELP_REFRESH_MS
  );
}

/** Only http(s) URLs and server-relative paths are loaded as illustrations. */
export function isSafeImageUrl(url: string | null | undefined): url is string {
  return !!url && (/^https?:\/\//iu.test(url) || url.startsWith('/'));
}

export type PrintHelpStorage = {
  read: () => Promise<PrintHelpCache | null>;
  write: (cache: PrintHelpCache) => Promise<void>;
};

export const asyncPrintHelpStorage: PrintHelpStorage = {
  async read() {
    try {
      const stored = await AsyncStorage.getItem(PRINT_HELP_STORAGE_KEY);

      if (!stored) {
        return null;
      }

      const parsed = JSON.parse(stored) as Partial<PrintHelpCache>;

      return {
        updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : null,
        items: normalizeHelpItems(parsed.items),
        savedAt: Number(parsed.savedAt) || 0,
      };
    } catch {
      return null;
    }
  },
  async write(cache) {
    try {
      await AsyncStorage.setItem(PRINT_HELP_STORAGE_KEY, JSON.stringify(cache));
    } catch {
      // Losing the saved copy only costs one more request next time.
    }
  },
};

export type SyncHelpDeps = {
  fetchHelp: () => Promise<unknown>;
  storage: PrintHelpStorage;
};

/**
 * Brings the help list up to date. The saved copy (memory first, then storage) is the fallback for every failure
 * (offline, 4xx, 5xx, a malformed answer), so this never throws. `updated_at` plays the part of the ETag: an
 * unchanged answer keeps the saved entries and is not written again.
 */
export async function syncPrintHelp(
  deps: SyncHelpDeps,
  current: PrintHelpCache | null,
): Promise<{ cache: PrintHelpCache | null; fetched: boolean }> {
  const saved = current ?? (await deps.storage.read());

  try {
    const fresh = normalizeHelpResponse(await deps.fetchHelp());

    if (
      saved &&
      fresh.updatedAt !== null &&
      saved.updatedAt === fresh.updatedAt &&
      saved.items.length === fresh.items.length
    ) {
      return { cache: { ...saved, savedAt: fresh.savedAt }, fetched: true };
    }

    await deps.storage.write(fresh);

    return { cache: fresh, fetched: true };
  } catch {
    return { cache: saved, fetched: false };
  }
}
