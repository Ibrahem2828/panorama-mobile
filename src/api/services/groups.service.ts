import { apiClient } from '../client';
import { endpoints } from '../endpoints';
import type {
  ApiListParams,
  EmptyResponse,
  FileAccessTicket,
  ChatMuteDuration,
  ChatPreferenceItem,
  ChatPreferences,
  ChatPreferencesUpdate,
  GroupChatTicket,
  GroupJoinResult,
  GroupMessage,
  GroupRecord,
  GroupWhatsAppLaunch,
  SendGroupMessageRequest,
} from '../types';
import type { PaginatedResult } from '../pagination';
import { toPaginationQuery } from '../pagination';
import { uploadFormData, type UploadHandle } from '../upload';

export type AvailableGroupsParams = ApiListParams & {
  /** Subject id: only the groups of that subject. */
  subject?: string | number | null;
};

export function listAvailableGroups(
  authToken: string,
  params?: AvailableGroupsParams,
): Promise<PaginatedResult<GroupRecord>> {
  return apiClient.get<PaginatedResult<GroupRecord>>(endpoints.groups.available, {
    authToken,
    query: { ...toPaginationQuery(params), subject: params?.subject ?? undefined },
  });
}

export function listMyGroups(
  authToken: string,
  params?: ApiListParams,
): Promise<PaginatedResult<GroupRecord>> {
  return apiClient.get<PaginatedResult<GroupRecord>>(endpoints.groups.my, {
    authToken,
    query: toPaginationQuery(params),
  });
}

export function getGroupDetail(groupId: string | number, authToken: string): Promise<GroupRecord> {
  return apiClient.get<GroupRecord>(endpoints.groups.detail(groupId), {
    authToken,
  });
}

export function joinGroup(
  groupId: string | number,
  authToken: string,
  idempotencyKey?: string,
): Promise<GroupJoinResult> {
  return apiClient.post<GroupJoinResult, EmptyResponse>(
    endpoints.groups.join(groupId),
    {},
    { authToken, idempotencyKey },
  );
}

export function leaveGroup(groupId: string | number, authToken: string): Promise<EmptyResponse> {
  return apiClient.post<EmptyResponse, EmptyResponse>(
    endpoints.groups.leave(groupId),
    {},
    { authToken },
  );
}

export function listGroupMessages(
  groupId: string | number,
  authToken: string,
  params?: ApiListParams,
): Promise<PaginatedResult<GroupMessage>> {
  return apiClient.get<PaginatedResult<GroupMessage>>(endpoints.groups.messages(groupId), {
    authToken,
    query: toPaginationQuery(params),
  });
}

export function sendGroupMessage(
  groupId: string | number,
  input: SendGroupMessageRequest,
  authToken: string,
  idempotencyKey?: string,
): Promise<GroupMessage> {
  return apiClient.post<GroupMessage, SendGroupMessageRequest>(
    endpoints.groups.messages(groupId),
    input,
    { authToken, idempotencyKey },
  );
}

/**
 * Posts a message with an image/file attachment (multipart) and reports upload progress.
 * The returned handle can abort the upload.
 */
export function sendGroupMessageWithAttachment(
  groupId: string | number,
  formData: FormData,
  authToken: string,
  options: { idempotencyKey?: string; onProgress?: (fraction: number) => void } = {},
): UploadHandle<GroupMessage> {
  return uploadFormData<GroupMessage>(endpoints.groups.messages(groupId), formData, {
    authToken,
    idempotencyKey: options.idempotencyKey,
    onProgress: options.onProgress,
  });
}

/** Issues a short-lived, in-app-only URL for one chat attachment. */
export function requestGroupMessageAttachmentTicket(
  groupId: string | number,
  messageId: string | number,
  authToken: string,
): Promise<FileAccessTicket> {
  return apiClient.post<FileAccessTicket, EmptyResponse>(
    endpoints.groups.messageAttachmentTicket(groupId, messageId),
    {},
    { authToken },
  );
}

/**
 * Issues a one-time WebSocket handshake ticket. Tickets cannot be replayed, so every
 * (re)connect must request a fresh one.
 */
export function requestGroupChatTicket(
  groupId: string | number,
  authToken: string,
): Promise<GroupChatTicket> {
  return apiClient.post<GroupChatTicket, EmptyResponse>(
    endpoints.groups.chatTicket(groupId),
    {},
    { authToken },
  );
}

/**
 * Asks the server for a one-off `whatsapp://` deep link (members only). The https invite link is
 * never returned, so it can never be shown, logged or opened in a browser.
 */
export function requestGroupWhatsAppLaunch(
  groupId: string | number,
  authToken: string,
): Promise<GroupWhatsAppLaunch> {
  return apiClient.post<GroupWhatsAppLaunch, EmptyResponse>(
    endpoints.groups.whatsappLaunch(groupId),
    {},
    { authToken },
  );
}

/** Tells the server how far this device has received / read the chat (drives the senders' ticks). */
export function postChatReceipts(
  groupId: string | number,
  cursors: { delivered_up_to?: number; read_up_to?: number },
  authToken: string,
): Promise<{ delivered_up_to: number; read_up_to: number }> {
  return apiClient.post<{ delivered_up_to: number; read_up_to: number }, typeof cursors>(
    endpoints.groups.chatReceipts(groupId),
    cursors,
    { authToken },
  );
}

/** Sets (or, with `null`, clears) the caller's single emoji reaction on a message. */
export function setMessageReaction(
  groupId: string | number,
  messageId: string | number,
  emoji: string | null,
  authToken: string,
): Promise<{ message_id: number; my_reaction: string | null; counts: Record<string, number> }> {
  type Reply = { message_id: number; my_reaction: string | null; counts: Record<string, number> };

  return emoji === null
    ? apiClient.delete<Reply>(endpoints.groups.messageReaction(groupId, messageId), { authToken })
    : apiClient.put<Reply, { emoji: string }>(
        endpoints.groups.messageReaction(groupId, messageId),
        { emoji },
        { authToken },
      );
}

export function deleteGroupMessage(
  groupId: string | number,
  messageId: string | number,
  authToken: string,
): Promise<EmptyResponse> {
  return apiClient.delete<EmptyResponse>(endpoints.groups.messageDelete(groupId, messageId), {
    authToken,
  });
}

export function getChatPreferences(
  groupId: string | number,
  authToken: string,
): Promise<ChatPreferences> {
  return apiClient.get<ChatPreferences>(endpoints.groups.chatPreferences(groupId), { authToken });
}

/** Body of the mute PUT: `mute_for` only goes with `is_muted: true` (the old `{ is_muted }` body still works). */
export function chatMuteBody(isMuted: boolean, muteFor?: ChatMuteDuration): ChatPreferencesUpdate {
  return isMuted && muteFor ? { is_muted: true, mute_for: muteFor } : { is_muted: isMuted };
}

export function setChatMuted(
  groupId: string | number,
  isMuted: boolean,
  authToken: string,
  muteFor?: ChatMuteDuration,
): Promise<ChatPreferences> {
  return apiClient.put<ChatPreferences, ChatPreferencesUpdate>(
    endpoints.groups.chatPreferences(groupId),
    chatMuteBody(isMuted, muteFor),
    { authToken },
  );
}

/** Mute state of every chat the user belongs to (cacheable for offline reading). */
export function getAllChatPreferences(authToken: string): Promise<ChatPreferenceItem[]> {
  return apiClient.get<ChatPreferenceItem[]>(endpoints.groups.chatPreferencesAll, { authToken });
}

export function getChatUnread(
  authToken: string,
): Promise<{ groups: { group_id: number; unread: number }[] }> {
  return apiClient.get<{ groups: { group_id: number; unread: number }[] }>(
    endpoints.groups.chatUnread,
    { authToken },
  );
}
