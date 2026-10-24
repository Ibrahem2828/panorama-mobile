import NetInfo from '@react-native-community/netinfo';
import { create } from 'zustand';

import { createApiError, normalizeApiError } from '../../../api';
import { generateIdempotencyKey } from '../../../api/idempotency';
import { UPLOAD_CANCELLED } from '../../../api/upload';
import { useLocaleStore } from '../../../i18n';

import { useAuthStore } from '../../auth/store';
import { groupsService as apiGroupsService } from '../../../api';
import { useGroupsStore } from '../../groups/store';
import type { Group } from '../../groups/types';
import { useChatUnreadStore } from './unreadStore';
import { validateChatAttachment } from '../logic/attachments';
import {
  mergeChatMessages,
  pruneMissingMessages,
  reactionList,
  removeChatMessageById,
} from '../logic/messages';
import {
  createPending,
  findMatchingPending,
  isDefinitiveRejection,
  markFailed,
  markSending,
  removePending,
  setProgress,
} from '../logic/pending';
import {
  canSendMessageToGroup,
  createChatWebSocketClient,
  loadGroupChatMessagesPage,
  nativeChatConnectionEnvironment,
  requestChatSocketTicket,
  sendAttachmentMessage,
  sendTextMessage,
  toSafeChatErrorMessage,
  toSafeSendChatErrorMessage,
  type ChatWebSocketClient,
} from '../services';
import {
  MAX_MESSAGE_LENGTH,
  type ChatAttachment,
  type ChatConnectionStatus,
  type ChatMessage,
  type ChatReactionFrame,
  type ChatReceiptFrame,
  type Id,
  type PendingMessage,
} from '../types';

/** REST catch-up cadence while the live connection is down (foreground only). */
export const FALLBACK_POLL_INTERVAL_MS = 8000;

export type ChatRoomState = {
  /** Server messages, oldest first. */
  messages: ChatMessage[];
  /** Optimistic sends not yet confirmed, oldest first. */
  pending: PendingMessage[];
  /** Next (older) REST page to fetch. */
  nextPage: number;
  hasOlder: boolean;
  hasLoaded: boolean;
  isLoading: boolean;
  isRefreshing: boolean;
  isLoadingOlder: boolean;
  loadOlderFailed: boolean;
  error: string | null;
  /** The server refused this user (not a member / removed). */
  forbidden: boolean;
  /** How far each other member has received / read the chat (live, from receipt frames). */
  peerCursors: Record<number, { delivered: number; read: number }>;
  /** This member muted the chat's notifications. */
  isMuted: boolean;
};

export type SendResult = { ok: true } | { ok: false; error: string };

type ChatState = {
  rooms: Record<string, ChatRoomState>;
  activeGroupId: Id | null;
  connectionStatus: ChatConnectionStatus;
  isOnline: boolean;

  openRoom: (groupId: Id) => void;
  closeRoom: () => void;
  refresh: (groupId: Id) => Promise<void>;
  loadOlder: (groupId: Id) => Promise<void>;
  send: (groupId: Id, input: { text: string; attachment?: ChatAttachment | null }) => SendResult;
  retry: (groupId: Id, localId: string) => void;
  /** Sets (or, with `null`, clears) the member's reaction; the bubble updates at once. */
  react: (groupId: Id, messageId: number, emoji: string | null) => void;
  deleteMessage: (groupId: Id, messageId: number) => Promise<boolean>;
  setMuted: (groupId: Id, muted: boolean) => Promise<void>;
  /** Tells the server (and so every sender) that this device now has / has read everything loaded. */
  reportRead: (groupId: Id) => void;
  discard: (groupId: Id, localId: string) => void;
  reset: () => void;
};

// Read when the action runs so messages follow the current locale.
function chatCatalog() {
  return useLocaleStore.getState().t.chat;
}

function keyOf(groupId: Id): string {
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
  const key = keyOf(groupId);

  if (groupsState.selectedGroup && keyOf(groupsState.selectedGroup.id) === key) {
    return groupsState.selectedGroup;
  }

  return (
    [...groupsState.myGroups, ...groupsState.availableGroups].find(
      (group) => keyOf(group.id) === key,
    ) ?? null
  );
}

function emptyRoom(): ChatRoomState {
  return {
    messages: [],
    pending: [],
    nextPage: 2,
    hasOlder: false,
    hasLoaded: false,
    isLoading: false,
    isRefreshing: false,
    isLoadingOlder: false,
    loadOlderFailed: false,
    error: null,
    forbidden: false,
    peerCursors: {},
    isMuted: false,
  };
}

// ---- module-level bookkeeping that must not trigger renders --------------------------------

let chatWebSocketClient: ChatWebSocketClient | null = null;
let pollTimer: ReturnType<typeof setInterval> | null = null;
let unsubscribeNetInfo: (() => void) | null = null;
/** Bumped whenever a room is opened/closed so late async results of an old room are ignored. */
let session = 0;
const syncing = new Set<string>();
/** Bumped on local changes so a stale catch-up page cannot prune a message that just arrived. */
const epochs = new Map<string, number>();
/** Ids deleted live; a stale REST page must not resurrect them. */
const deletedIds = new Map<string, Set<number>>();
const uploadAborts = new Map<string, () => void>();
/** Highest message id already reported as read per room, so unchanged state is never re-sent. */
const reportedRead = new Map<string, number>();

function bumpEpoch(groupKey: string) {
  epochs.set(groupKey, (epochs.get(groupKey) ?? 0) + 1);
}

function deletedSet(groupKey: string): Set<number> {
  let set = deletedIds.get(groupKey);

  if (!set) {
    set = new Set();
    deletedIds.set(groupKey, set);
  }

  return set;
}

const initialChatState = {
  rooms: {},
  activeGroupId: null,
  connectionStatus: 'idle' as const,
  isOnline: true,
};

export const useChatStore = create<ChatState>((set, get) => {
  function patchRoom(groupKey: string, change: (room: ChatRoomState) => Partial<ChatRoomState>) {
    set((state) => {
      const room = state.rooms[groupKey] ?? emptyRoom();

      return { rooms: { ...state.rooms, [groupKey]: { ...room, ...change(room) } } };
    });
  }

  function markForbidden(groupKey: string) {
    patchRoom(groupKey, () => ({ forbidden: true, isLoading: false, isRefreshing: false }));
    stopRealtime();
    // The membership data the screen reads is stale; refresh it (read-only call).
    void useGroupsStore.getState().loadGroupDetail(groupKey);
  }

  /**
   * Re-reads the newest page: first load, fallback polling, manual refresh and the catch-up
   * after a (re)connect. Safe to call concurrently: one request per room at a time.
   */
  async function syncLatest(groupId: Id, mode: 'initial' | 'poll' | 'manual') {
    const groupKey = keyOf(groupId);
    const accessToken = getAccessToken();

    if (syncing.has(groupKey)) {
      return;
    }

    if (!accessToken) {
      patchRoom(groupKey, () => ({
        isLoading: false,
        isRefreshing: false,
        error: chatCatalog().errors.unauthorized,
      }));
      return;
    }

    syncing.add(groupKey);
    const epochBefore = epochs.get(groupKey) ?? 0;
    const sessionBefore = session;

    try {
      const page = await loadGroupChatMessagesPage(groupId, accessToken, 1);

      if (sessionBefore !== session) {
        return;
      }

      const canPrune = (epochs.get(groupKey) ?? 0) === epochBefore;
      const deleted = deletedSet(groupKey);

      patchRoom(groupKey, (room) => {
        const base = canPrune
          ? pruneMissingMessages(room.messages, page.messages, !page.hasMore)
          : room.messages;
        const isFirstPage = !room.hasLoaded;

        return {
          messages: mergeChatMessages(base, page.messages, deleted),
          hasLoaded: true,
          nextPage: isFirstPage ? 2 : room.nextPage,
          hasOlder: isFirstPage ? page.hasMore : room.hasOlder,
          error: null,
        };
      });
    } catch (error) {
      if (sessionBefore !== session) {
        return;
      }

      if (normalizeApiError(error).code === 'FORBIDDEN') {
        markForbidden(groupKey);
      } else if (mode !== 'poll') {
        patchRoom(groupKey, () => ({ error: toSafeChatErrorMessage(error, chatCatalog()) }));
      }
    } finally {
      syncing.delete(groupKey);

      if (sessionBefore === session) {
        patchRoom(groupKey, () => ({ isLoading: false, isRefreshing: false }));
        get().reportRead(groupId);
      }
    }
  }

  function applyIncoming(groupId: Id, message: ChatMessage) {
    const groupKey = keyOf(groupId);

    if (deletedSet(groupKey).has(message.id)) {
      return;
    }

    bumpEpoch(groupKey);
    patchRoom(groupKey, (room) => {
      const match = findMatchingPending(room.pending, message, getCurrentUserId());

      return {
        messages: mergeChatMessages(room.messages, [message], deletedSet(groupKey)),
        pending: match ? [...removePending(room.pending, match.localId)] : room.pending,
      };
    });
    get().reportRead(groupId);
  }

  function applyDeleted(groupId: Id, messageId: number) {
    const groupKey = keyOf(groupId);

    deletedSet(groupKey).add(messageId);
    bumpEpoch(groupKey);
    patchRoom(groupKey, (room) => ({
      messages: [...removeChatMessageById(room.messages, messageId)],
    }));
  }

  function applyReceipt(groupId: Id, receipt: ChatReceiptFrame) {
    if (String(receipt.user_id) === String(getCurrentUserId())) {
      return;
    }

    patchRoom(keyOf(groupId), (room) => {
      const previous = room.peerCursors[receipt.user_id] ?? { delivered: 0, read: 0 };

      return {
        peerCursors: {
          ...room.peerCursors,
          [receipt.user_id]: {
            delivered: Math.max(previous.delivered, receipt.delivered_up_to, receipt.read_up_to),
            read: Math.max(previous.read, receipt.read_up_to),
          },
        },
      };
    });
  }

  function applyReaction(groupId: Id, frame: ChatReactionFrame) {
    const mine = String(frame.user_id) === String(getCurrentUserId());

    patchRoom(keyOf(groupId), (room) => ({
      messages: room.messages.map((message) =>
        message.id === frame.message_id
          ? {
              ...message,
              reactions: reactionList(frame.counts),
              my_reaction: mine ? frame.emoji : message.my_reaction,
            }
          : message,
      ),
    }));
  }

  function stopPolling() {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  }

  function stopRealtime() {
    stopPolling();
    unsubscribeNetInfo?.();
    unsubscribeNetInfo = null;
    chatWebSocketClient?.disconnect();
    chatWebSocketClient = null;
  }

  function startPolling(groupId: Id) {
    stopPolling();
    // REST only runs while the live connection is not delivering, and only in the foreground.
    pollTimer = setInterval(() => {
      const { connectionStatus, isOnline } = get();

      if (
        connectionStatus !== 'connected' &&
        isOnline &&
        nativeChatConnectionEnvironment.isForeground()
      ) {
        void syncLatest(groupId, 'poll');
      }
    }, FALLBACK_POLL_INTERVAL_MS);
  }

  function connectRealtime(groupId: Id) {
    chatWebSocketClient = createChatWebSocketClient({
      groupId,
      environment: nativeChatConnectionEnvironment,
      // The JWT only ever travels in the Authorization header of this REST call; the
      // socket itself authenticates with the single-use ticket it returns.
      getTicket: async () => {
        const accessToken = getAccessToken();

        if (!accessToken) {
          throw createApiError({ code: 'UNAUTHORIZED', status: 401 });
        }

        return requestChatSocketTicket(groupId, accessToken);
      },
      handlers: {
        onMessage: (message) => applyIncoming(groupId, message),
        onMessageDeleted: (id) => applyDeleted(groupId, id),
        onReceipt: (receipt) => applyReceipt(groupId, receipt),
        onReaction: (frame) => applyReaction(groupId, frame),
        onStatusChange: (status) => {
          set({ connectionStatus: status });

          // Anything sent while the socket was down is never replayed: catch up over REST.
          if (status === 'connected') {
            chatWebSocketClient?.sendFrame({ type: 'presence', active: true });
            void syncLatest(groupId, 'poll');
          }
        },
        onTerminal: (reason) => {
          if (reason === 'permission') {
            markForbidden(keyOf(groupId));
          }
        },
      },
    });

    chatWebSocketClient.connect();
  }

  function observeNetwork(groupId: Id) {
    let wasOnline: boolean | null = null;

    unsubscribeNetInfo = NetInfo.addEventListener((state) => {
      const isOnline = state.isConnected !== false && state.isInternetReachable !== false;

      if (get().isOnline !== isOnline) {
        set({ isOnline });
      }

      if (isOnline && wasOnline === false) {
        void syncLatest(groupId, 'poll');
      }

      wasOnline = isOnline;
    });
  }

  /** Sends (or re-sends) one pending bubble. Never throws; failures become a "failed" state. */
  async function deliver(groupId: Id, localId: string) {
    const groupKey = keyOf(groupId);
    const item = get().rooms[groupKey]?.pending.find((candidate) => candidate.localId === localId);

    if (!item) {
      return;
    }

    const accessToken = getAccessToken();

    if (!accessToken) {
      patchRoom(groupKey, (room) => ({
        pending: markFailed(room.pending, localId, chatCatalog().errors.unauthorized, false),
      }));
      return;
    }

    try {
      let sent: ChatMessage | null;

      if (item.attachment) {
        const upload = sendAttachmentMessage(
          groupId,
          { content: item.content, attachment: item.attachment },
          item.idempotencyKey,
          accessToken,
          (fraction) =>
            patchRoom(groupKey, (room) => ({
              pending: setProgress(room.pending, localId, fraction),
            })),
        );

        uploadAborts.set(localId, upload.abort);
        sent = await upload.promise;
      } else {
        sent = await sendTextMessage(groupId, item.content, item.idempotencyKey, accessToken);
      }

      // Discarded while in flight: the message still reached the server, so show it.
      bumpEpoch(groupKey);
      patchRoom(groupKey, (room) => ({
        pending: [...removePending(room.pending, localId)],
        messages: sent
          ? mergeChatMessages(room.messages, [sent], deletedSet(groupKey))
          : room.messages,
      }));

      if (!sent) {
        // No server id came back; fetch the authoritative copy rather than guess one.
        void syncLatest(groupId, 'poll');
      }
    } catch (error) {
      const normalized = normalizeApiError(error);

      if (normalized.errorCode === UPLOAD_CANCELLED) {
        patchRoom(groupKey, (room) => ({ pending: [...removePending(room.pending, localId)] }));
        return;
      }

      if (normalized.code === 'FORBIDDEN') {
        void useGroupsStore.getState().loadGroupDetail(groupId);
      }

      patchRoom(groupKey, (room) => ({
        pending: markFailed(
          room.pending,
          localId,
          toSafeSendChatErrorMessage(error, chatCatalog()),
          isDefinitiveRejection(normalized.status, normalized.code),
        ),
      }));
    } finally {
      uploadAborts.delete(localId);
    }
  }

  return {
    ...initialChatState,

    openRoom(groupId) {
      stopRealtime();
      session += 1;

      const groupKey = keyOf(groupId);
      const existing = get().rooms[groupKey];
      const showSpinner = !existing?.hasLoaded;

      set((state) => ({
        activeGroupId: groupId,
        connectionStatus: 'idle',
        rooms: {
          ...state.rooms,
          [groupKey]: {
            ...(existing ?? emptyRoom()),
            error: null,
            forbidden: false,
            isLoading: showSpinner,
          },
        },
      }));

      observeNetwork(groupId);
      connectRealtime(groupId);
      startPolling(groupId);
      void syncLatest(groupId, 'initial');
    },

    closeRoom() {
      session += 1;
      stopRealtime();
      set({ activeGroupId: null, connectionStatus: 'disconnected' });
    },

    async refresh(groupId) {
      patchRoom(keyOf(groupId), () => ({ isRefreshing: true, error: null }));
      await syncLatest(groupId, 'manual');
    },

    async loadOlder(groupId) {
      const groupKey = keyOf(groupId);
      const room = get().rooms[groupKey];
      const accessToken = getAccessToken();

      if (!room || !room.hasOlder || room.isLoadingOlder || !accessToken) {
        return;
      }

      const sessionBefore = session;

      patchRoom(groupKey, () => ({ isLoadingOlder: true, loadOlderFailed: false }));

      try {
        const page = await loadGroupChatMessagesPage(groupId, accessToken, room.nextPage);

        if (sessionBefore !== session) {
          return;
        }

        patchRoom(groupKey, (current) => ({
          messages: mergeChatMessages(current.messages, page.messages, deletedSet(groupKey)),
          nextPage: current.nextPage + 1,
          hasOlder: page.hasMore,
          isLoadingOlder: false,
        }));
      } catch (error) {
        if (sessionBefore !== session) {
          return;
        }

        if (normalizeApiError(error).code === 'FORBIDDEN') {
          markForbidden(groupKey);
        }

        patchRoom(groupKey, () => ({ isLoadingOlder: false, loadOlderFailed: true }));
      }
    },

    send(groupId, { text, attachment = null }) {
      const t = chatCatalog();
      const content = text.trim();

      if (!content && !attachment) {
        return { ok: false, error: t.errors.emptyMessage };
      }

      if (content.length > MAX_MESSAGE_LENGTH) {
        return { ok: false, error: t.errors.longMessage };
      }

      if (attachment) {
        const problem = validateChatAttachment(attachment);

        if (problem) {
          return {
            ok: false,
            error:
              problem === 'size'
                ? t.errors.attachmentSize
                : problem === 'empty'
                  ? t.errors.attachmentEmpty
                  : t.errors.attachmentType,
          };
        }
      }

      const group = getKnownGroup(groupId);
      const permission = canSendMessageToGroup(group, getCurrentUserId(), t);

      if (!permission.allowed) {
        return { ok: false, error: permission.reason ?? t.errors.permission };
      }

      const groupKey = keyOf(groupId);
      const item = createPending({
        localId: generateIdempotencyKey(),
        idempotencyKey: generateIdempotencyKey(),
        content,
        attachment,
        now: new Date(),
      });

      bumpEpoch(groupKey);
      patchRoom(groupKey, (room) => ({ pending: [...room.pending, item] }));
      void deliver(groupId, item.localId);

      return { ok: true };
    },

    retry(groupId, localId) {
      const groupKey = keyOf(groupId);
      const item = get().rooms[groupKey]?.pending.find(
        (candidate) => candidate.localId === localId,
      );

      if (!item || item.status !== 'failed') {
        return;
      }

      patchRoom(groupKey, (room) => ({
        pending: markSending(room.pending, localId, generateIdempotencyKey),
      }));
      void deliver(groupId, localId);
    },

    reportRead(groupId) {
      const groupKey = keyOf(groupId);
      const accessToken = getAccessToken();
      const room = get().rooms[groupKey];
      const active = get().activeGroupId;

      if (!accessToken || !room || active === null || keyOf(active) !== groupKey) {
        return;
      }

      const latest = room.messages.reduce((top, message) => Math.max(top, message.id), 0);

      if (latest === 0 || latest <= (reportedRead.get(groupKey) ?? 0)) {
        return;
      }

      reportedRead.set(groupKey, latest);

      const sentOverSocket =
        get().connectionStatus === 'connected' &&
        chatWebSocketClient?.sendFrame({
          type: 'receipt',
          delivered_up_to: latest,
          read_up_to: latest,
        }) === true;

      if (!sentOverSocket) {
        void apiGroupsService
          .postChatReceipts(groupId, { delivered_up_to: latest, read_up_to: latest }, accessToken)
          .catch(() => reportedRead.delete(groupKey));
      }

      useChatUnreadStore.getState().clear(groupId);
    },

    react(groupId, messageId, emoji) {
      const groupKey = keyOf(groupId);
      const accessToken = getAccessToken();

      if (!accessToken) {
        return;
      }

      patchRoom(groupKey, (room) => ({
        messages: room.messages.map((message) => {
          if (message.id !== messageId) {
            return message;
          }

          const counts: Record<string, number> = {};

          for (const entry of message.reactions) {
            counts[entry.emoji] = entry.count;
          }

          if (message.my_reaction) {
            counts[message.my_reaction] = Math.max(0, (counts[message.my_reaction] ?? 1) - 1);
          }

          if (emoji) {
            counts[emoji] = (counts[emoji] ?? 0) + 1;
          }

          const kept = Object.fromEntries(Object.entries(counts).filter(([, count]) => count > 0));

          return { ...message, my_reaction: emoji, reactions: reactionList(kept) };
        }),
      }));

      void apiGroupsService.setMessageReaction(groupId, messageId, emoji, accessToken).catch(() => {
        // The optimistic bubble was wrong: take the server's word.
        void syncLatest(groupId, 'poll');
      });
    },

    async deleteMessage(groupId, messageId) {
      const accessToken = getAccessToken();

      if (!accessToken) {
        return false;
      }

      try {
        await apiGroupsService.deleteGroupMessage(groupId, messageId, accessToken);
        applyDeleted(groupId, messageId);
        return true;
      } catch {
        return false;
      }
    },

    async setMuted(groupId, muted) {
      const groupKey = keyOf(groupId);
      const accessToken = getAccessToken();

      if (!accessToken) {
        return;
      }

      patchRoom(groupKey, () => ({ isMuted: muted }));

      try {
        await apiGroupsService.setChatMuted(groupId, muted, accessToken);
      } catch {
        patchRoom(groupKey, () => ({ isMuted: !muted }));
      }
    },

    discard(groupId, localId) {
      uploadAborts.get(localId)?.();
      patchRoom(keyOf(groupId), (room) => ({ pending: [...removePending(room.pending, localId)] }));
    },

    reset() {
      session += 1;
      stopRealtime();
      uploadAborts.forEach((abort) => abort());
      uploadAborts.clear();
      syncing.clear();
      epochs.clear();
      deletedIds.clear();
      reportedRead.clear();
      set(initialChatState);
    },
  };
});
