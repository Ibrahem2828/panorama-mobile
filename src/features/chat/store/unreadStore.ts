import { create } from 'zustand';

import { groupsService } from '../../../api';
import { useAuthStore } from '../../auth/store';

type UnreadState = {
  /** Unread messages per group id (never counts the member's own messages). */
  byGroup: Record<string, number>;
  load: () => Promise<void>;
  clear: (groupId: string | number) => void;
  reset: () => void;
};

export function totalUnread(byGroup: Record<string, number>): number {
  return Object.values(byGroup).reduce((sum, count) => sum + count, 0);
}

export const useChatUnreadStore = create<UnreadState>((set) => ({
  byGroup: {},

  async load() {
    const accessToken = useAuthStore.getState().accessToken;

    if (!accessToken) {
      return;
    }

    try {
      const { groups } = await groupsService.getChatUnread(accessToken);

      set({
        byGroup: Object.fromEntries(
          groups
            .filter((entry) => entry.unread > 0)
            .map((entry) => [String(entry.group_id), entry.unread]),
        ),
      });
    } catch {
      // Badges are a convenience; the list works without them.
    }
  },

  clear(groupId) {
    set((state) => {
      const key = String(groupId);

      if (!state.byGroup[key]) {
        return state;
      }

      const byGroup = { ...state.byGroup };

      delete byGroup[key];

      return { byGroup };
    });
  },

  reset() {
    set({ byGroup: {} });
  },
}));
