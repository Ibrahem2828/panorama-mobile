import { apiClient } from '../client';
import { endpoints } from '../endpoints';
import type {
  ApiListParams,
  EmptyResponse,
  FileAccessTicket,
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
