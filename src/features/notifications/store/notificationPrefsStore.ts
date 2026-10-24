import { create } from 'zustand';

import { notificationsService } from '../../../api';
import { useAuthStore } from '../../auth/store';
import {
  channelPatch,
  normalizePreferences,
  normalizeSummary,
  quietHoursPatch,
  type NormalizedPreferences,
  type NormalizedSummary,
  type NotificationCategory,
  type QuietHours,
} from '../services/notificationPrefs';

type PrefsState = {
  prefs: NormalizedPreferences | null;
  summary: NormalizedSummary;
  isLoading: boolean;
  /** The last load or save failed (the screen offers a retry). */
  failed: boolean;
  loadPrefs: () => Promise<void>;
  loadSummary: () => Promise<void>;
  setPush: (value: boolean) => Promise<void>;
  setChannel: (category: NotificationCategory, value: boolean) => Promise<void>;
  setQuietHours: (next: QuietHours) => Promise<void>;
  reset: () => void;
};

const EMPTY_SUMMARY: NormalizedSummary = { total: 0, byCategory: {} };

function token(): string | null {
  return useAuthStore.getState().accessToken;
}

function deviceTimezone(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || undefined;
  } catch {
    return undefined;
  }
}

/**
 * Notification preferences and the unread summary. Saves are optimistic: the switch moves at once and goes back if the
 * server refuses. The foreground banner policy reads `prefs` synchronously from here.
 */
export const useNotificationPrefsStore = create<PrefsState>((set, get) => {
  async function save(
    patch: Record<string, unknown>,
    optimistic: (current: NormalizedPreferences) => NormalizedPreferences,
  ) {
    const accessToken = token();
    const before = get().prefs;

    if (!accessToken || !before) {
      return;
    }

    set({ prefs: optimistic(before), failed: false });

    try {
      const saved = await notificationsService.updateNotificationPreferences(
        patch as never,
        accessToken,
      );

      set({ prefs: normalizePreferences(saved) });
    } catch {
      set({ prefs: before, failed: true });
    }
  }

  return {
    prefs: null,
    summary: EMPTY_SUMMARY,
    isLoading: false,
    failed: false,

    async loadPrefs() {
      const accessToken = token();

      if (!accessToken) {
        return;
      }

      set({ isLoading: true, failed: false });

      try {
        set({
          prefs: normalizePreferences(
            await notificationsService.getNotificationPreferences(accessToken),
          ),
        });
      } catch {
        set({ failed: true });
      } finally {
        set({ isLoading: false });
      }
    },

    async loadSummary() {
      const accessToken = token();

      if (!accessToken) {
        return;
      }

      try {
        set({
          summary: normalizeSummary(await notificationsService.getNotificationSummary(accessToken)),
        });
      } catch {
        // Badges are a convenience: an older backend without the endpoint just shows none.
      }
    },

    setPush: (value) => save({ push_enabled: value }, (current) => ({ ...current, push: value })),

    async setChannel(category, value) {
      const channels = get().prefs?.channels;

      if (!channels) {
        return;
      }

      await save(channelPatch(channels, category, value), (current) => ({
        ...current,
        channels: current.channels ? { ...current.channels, [category]: value } : null,
      }));
    },

    async setQuietHours(next) {
      const patch = quietHoursPatch(next, deviceTimezone());

      if (!patch) {
        set({ failed: true });
        return;
      }

      await save(patch, (current) => ({ ...current, quietHours: next }));
    },

    reset() {
      set({ prefs: null, summary: EMPTY_SUMMARY, isLoading: false, failed: false });
    },
  };
});
