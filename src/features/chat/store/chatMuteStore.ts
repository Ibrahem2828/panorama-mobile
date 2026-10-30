import { create } from 'zustand';

import { groupsService } from '../../../api';
import { useToastStore } from '../../../components/feedback/toastStore';
import { useLocaleStore } from '../../../i18n';
import { useAuthStore } from '../../auth/store';
import {
  choiceToRequest,
  isEffectivelyMuted,
  normalizeMutedChats,
  normalizeMutePref,
  prefForChoice,
  type ChatKind,
  type ChatMuteChoice,
  type ChatMutePref,
  type MutedChatItem,
} from '../logic/mute';

type ChatMuteState = {
  /** Mute state per group id, as last loaded or saved (effective on the server at that time). */
  byGroup: Record<string, ChatMutePref>;
  /** Every approved chat with its mute state; null until the list has loaded once. */
  items: MutedChatItem[] | null;
  isLoading: boolean;
  /** The last list load failed (and nothing is cached to show). */
  loadFailed: boolean;

  loadAll: () => Promise<void>;
  loadOne: (groupId: string | number) => Promise<void>;
  /** Optimistic: the bell moves at once, goes back (with a toast) when the server refuses. Resolves to success. */
  setMute: (
    groupId: string | number,
    choice: ChatMuteChoice,
    info?: { name?: string; kind?: ChatKind },
  ) => Promise<boolean>;
  reset: () => void;
};

const initial = { byGroup: {}, items: null, isLoading: false, loadFailed: false } as const;

function token(): string | null {
  return useAuthStore.getState().accessToken;
}

function copy() {
  return useLocaleStore.getState().t.chat.mute;
}

/** Whether the notification handler should hold back a push of this chat (cheap, synchronous, from memory only). */
export function isChatMutedNow(groupId: string | number, now = Date.now()): boolean {
  return isEffectivelyMuted(useChatMuteStore.getState().byGroup[String(groupId)], now);
}

/** Latest request per group wins: an older answer arriving late must not overwrite a newer choice. */
const latest = new Map<string, number>();
let sequence = 0;

export const useChatMuteStore = create<ChatMuteState>((set, get) => {
  function writePref(key: string, pref: ChatMutePref, info?: { name?: string; kind?: ChatKind }) {
    set((state) => {
      const known = state.items?.some((item) => item.groupId === key) ?? false;
      let items = state.items;

      if (items && known) {
        items = items.map((item) => (item.groupId === key ? { ...item, pref } : item));
      } else if (items && info?.name !== undefined && info.kind) {
        items = [...items, { groupId: key, name: info.name, kind: info.kind, pref }];
      }

      return { byGroup: { ...state.byGroup, [key]: pref }, items };
    });
  }

  return {
    ...initial,

    async loadAll() {
      const accessToken = token();

      if (!accessToken) {
        return;
      }

      set({ isLoading: true, loadFailed: false });

      try {
        const items = normalizeMutedChats(await groupsService.getAllChatPreferences(accessToken));

        set((state) => {
          // A choice still in flight is newer than this snapshot: keep the optimistic value for that chat.
          const merged = items.map((item) =>
            latest.has(item.groupId)
              ? { ...item, pref: state.byGroup[item.groupId] ?? item.pref }
              : item,
          );

          return {
            items: merged,
            byGroup: {
              ...state.byGroup,
              ...Object.fromEntries(merged.map((item) => [item.groupId, item.pref])),
            },
          };
        });
      } catch {
        set({ loadFailed: true });
      } finally {
        set({ isLoading: false });
      }
    },

    async loadOne(groupId) {
      const accessToken = token();
      const key = String(groupId);

      if (!accessToken) {
        return;
      }

      try {
        const pref = normalizeMutePref(
          await groupsService.getChatPreferences(groupId, accessToken),
        );

        if (!latest.has(key)) {
          writePref(key, pref);
        }
      } catch {
        // The bell just keeps what it knew; opening the chat must never fail because of this.
      }
    },

    async setMute(groupId, choice, info) {
      const accessToken = token();
      const key = String(groupId);

      if (!accessToken) {
        return false;
      }

      const before = get().byGroup[key] ?? { isMuted: false, mutedUntil: null };
      const ticket = ++sequence;

      latest.set(key, ticket);
      writePref(key, prefForChoice(choice, Date.now()), info);

      try {
        const request = choiceToRequest(choice);
        const saved = await groupsService.setChatMuted(
          groupId,
          request.isMuted,
          accessToken,
          request.muteFor,
        );

        if (latest.get(key) === ticket) {
          latest.delete(key);
          writePref(key, normalizeMutePref(saved));
          useToastStore
            .getState()
            .show(choice === 'unmute' ? copy().toastUnmuted : copy().toastMuted);
        }

        return true;
      } catch {
        if (latest.get(key) === ticket) {
          latest.delete(key);
          writePref(key, before);
          useToastStore.getState().show(copy().saveFailed, { tone: 'error' });
        }

        return false;
      }
    },

    reset() {
      latest.clear();
      set({ ...initial });
    },
  };
});
