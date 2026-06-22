import { create } from 'zustand';

import { useAuthStore } from '../../auth/store';
import { useGroupsStore } from '../../groups/store';
import type { Group } from '../../groups/types';
import {
  canSendMessageToGroup,
  createChatWebSocketClient,
  loadGroupChatMessages,
  mergeChatMessages,
  sendGroupChatMessage,
  toSafeChatErrorMessage,
  toSafeSendChatErrorMessage,
  type ChatWebSocketClient,
} from '../services';
import type { ChatConnectionStatus, ChatMessage, Id } from '../types';

type ChatState = {
  messagesByGroupId: Record<string, ChatMessage[]>;
  draftByGroupId: Record<string, string>;
  activeGroupId: Id | null;
  connectionStatus: ChatConnectionStatus;
  isLoadingMessages: boolean;
  isRefreshing: boolean;
  isSending: boolean;
  errorMessage: string | null;
  sendErrorMessage: string | null;
  lastLoadedAtByGroupId: Record<string, string>;

  loadMessages: (groupId: Id) => Promise<void>;
  refreshMessages: (groupId: Id) => Promise<void>;
  sendMessage: (groupId: Id) => Promise<void>;
  setDraftMessage: (groupId: Id, message: string) => void;
  addIncomingMessage: (groupId: Id, message: ChatMessage) => void;
  connectGroupChat: (groupId: Id) => void;
  disconnectGroupChat: () => void;
  clearError: () => void;
  clearSendError: () => void;
  reset: () => void;
};

const MISSING_SESSION_MESSAGE = 'انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى.';
const EMPTY_MESSAGE = 'يرجى كتابة رسالة قبل الإرسال.';
const LONG_MESSAGE = 'يجب ألا تتجاوز الرسالة 1000 حرف.';
const PERMISSION_MESSAGE = 'لا يمكنك إرسال رسائل في هذا المجموعة حاليا.';

let chatWebSocketClient: ChatWebSocketClient | null = null;

function getGroupKey(groupId: Id): string {
  return String(groupId);
}

function getAccessToken(): string | null {
  return useAuthStore.getState().accessToken;
}

function getCurrentUserId(): Id | null {
  return useAuthStore.getState().user?.id ?? null;
}

function getKnownGroup(groupId: Id): Group | null {
  const groupsState = useGroupsStore.getState();
  const groupKey = getGroupKey(groupId);

  if (groupsState.selectedGroup && getGroupKey(groupsState.selectedGroup.id) === groupKey) {
    return groupsState.selectedGroup;
  }

  return (
    [...groupsState.myGroups, ...groupsState.availableGroups].find(
      (group) => getGroupKey(group.id) === groupKey,
    ) ?? null
  );
}

const initialChatState = {
  messagesByGroupId: {},
  draftByGroupId: {},
  activeGroupId: null,
  connectionStatus: 'idle' as const,
  isLoadingMessages: false,
  isRefreshing: false,
  isSending: false,
  errorMessage: null,
  sendErrorMessage: null,
  lastLoadedAtByGroupId: {},
};

export const useChatStore = create<ChatState>((set, get) => {
  function requireToken(options?: { field?: 'errorMessage' | 'sendErrorMessage' }): string | null {
    const accessToken = getAccessToken();
    const field = options?.field ?? 'errorMessage';

    if (!accessToken) {
      set({
        [field]: MISSING_SESSION_MESSAGE,
        isLoadingMessages: false,
        isRefreshing: false,
        isSending: false,
      });
      return null;
    }

    return accessToken;
  }

  async function reloadMessages(groupId: Id, authToken: string) {
    const response = await loadGroupChatMessages(groupId, authToken);
    const groupKey = getGroupKey(groupId);

    set((state) => ({
      messagesByGroupId: {
        ...state.messagesByGroupId,
        [groupKey]: mergeChatMessages(state.messagesByGroupId[groupKey] ?? [], response.results),
      },
      lastLoadedAtByGroupId: {
        ...state.lastLoadedAtByGroupId,
        [groupKey]: new Date().toISOString(),
      },
    }));
  }

  return {
    ...initialChatState,

    async loadMessages(groupId) {
      if (get().isLoadingMessages) {
        return;
      }

      const accessToken = requireToken();

      if (!accessToken) {
        return;
      }

      set({ activeGroupId: groupId, isLoadingMessages: true, errorMessage: null });

      try {
        await reloadMessages(groupId, accessToken);
        set({ isLoadingMessages: false });
      } catch (error) {
        set({
          isLoadingMessages: false,
          errorMessage: toSafeChatErrorMessage(error),
        });
      }
    },

    async refreshMessages(groupId) {
      if (get().isRefreshing) {
        return;
      }

      const accessToken = requireToken();

      if (!accessToken) {
        return;
      }

      set({ isRefreshing: true, errorMessage: null });

      try {
        await reloadMessages(groupId, accessToken);
        set({ isRefreshing: false });
      } catch (error) {
        set({
          isRefreshing: false,
          errorMessage: toSafeChatErrorMessage(error),
        });
      }
    },

    async sendMessage(groupId) {
      if (get().isSending) {
        return;
      }

      const groupKey = getGroupKey(groupId);
      const message = (get().draftByGroupId[groupKey] ?? '').trim();

      if (!message) {
        set({ sendErrorMessage: EMPTY_MESSAGE });
        return;
      }

      if (message.length > 1000) {
        set({ sendErrorMessage: LONG_MESSAGE });
        return;
      }

      const group = getKnownGroup(groupId);
      const permission = group
        ? canSendMessageToGroup(group, getCurrentUserId())
        : { allowed: true, permission: 'unknown' as const };

      if (!permission.allowed) {
        set({ sendErrorMessage: permission.reason ?? PERMISSION_MESSAGE });
        return;
      }

      const accessToken = requireToken({ field: 'sendErrorMessage' });

      if (!accessToken) {
        return;
      }

      set({ isSending: true, sendErrorMessage: null });

      try {
        const sentMessage = await sendGroupChatMessage(groupId, { message }, accessToken);

        set((state) => ({
          messagesByGroupId: {
            ...state.messagesByGroupId,
            [groupKey]: mergeChatMessages(state.messagesByGroupId[groupKey] ?? [], [sentMessage]),
          },
          draftByGroupId: {
            ...state.draftByGroupId,
            [groupKey]: '',
          },
          isSending: false,
        }));
      } catch (error) {
        set({
          isSending: false,
          sendErrorMessage: toSafeSendChatErrorMessage(error),
        });
      }
    },

    setDraftMessage(groupId, message) {
      const groupKey = getGroupKey(groupId);

      set((state) => ({
        draftByGroupId: {
          ...state.draftByGroupId,
          [groupKey]: message,
        },
        errorMessage: null,
        sendErrorMessage: null,
      }));
    },

    addIncomingMessage(groupId, message) {
      const groupKey = getGroupKey(groupId);

      set((state) => ({
        messagesByGroupId: {
          ...state.messagesByGroupId,
          [groupKey]: mergeChatMessages(state.messagesByGroupId[groupKey] ?? [], [message]),
        },
      }));
    },

    connectGroupChat(groupId) {
      const accessToken = getAccessToken();

      if (!accessToken) {
        set({ connectionStatus: 'idle' });
        return;
      }

      if (chatWebSocketClient) {
        chatWebSocketClient.disconnect();
      }

      chatWebSocketClient = createChatWebSocketClient({
        groupId,
        authToken: accessToken,
        handlers: {
          onMessage: (message) => get().addIncomingMessage(groupId, message),
          onStatusChange: (status) => set({ connectionStatus: status }),
          onError: (message) => set({ errorMessage: message }),
        },
      });

      chatWebSocketClient.connect();
    },

    disconnectGroupChat() {
      if (chatWebSocketClient) {
        chatWebSocketClient.disconnect();
        chatWebSocketClient = null;
      }

      set({ connectionStatus: 'disconnected' });
    },

    clearError() {
      set({ errorMessage: null });
    },

    clearSendError() {
      set({ sendErrorMessage: null });
    },

    reset() {
      if (chatWebSocketClient) {
        chatWebSocketClient.disconnect();
        chatWebSocketClient = null;
      }

      set(initialChatState);
    },
  };
});
