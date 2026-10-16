import {
  groupsService as apiGroupsService,
  normalizeApiError,
  type PaginatedResult,
} from '../../../api';
import { isTrustedBackendUrl } from '../../../utils/trustedUrl';
import type { TranslationCatalog } from '../../../i18n';
import { buildMessageFormData } from '../logic/attachments';
import { mergeChatMessages, normalizeChatMessage } from '../logic/messages';
import type { ChatAttachment, ChatMessage, ChatSendPermission, Id } from '../types';

type ChatCatalog = TranslationCatalog['chat'];

/** Messages per REST page (newest first). */
export const MESSAGES_PAGE_SIZE = 30;

const ADMIN_ROLES = new Set(['admin', 'group_admin', 'moderator', 'it_support']);
const APPROVED_MEMBERSHIP_STATUSES = new Set(['approved', 'member']);
const BLOCKED_MEMBERSHIP_STATUSES = new Set(['blocked', 'rejected', 'left', 'none', 'pending']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toText(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }

  return undefined;
}

function isAdminRole(role?: string | null): boolean {
  return Boolean(role && ADMIN_ROLES.has(role));
}

function readMembership(group: Record<string, unknown>) {
  const status = toText(group.current_user_membership_status)?.toLowerCase();
  const role = toText(group.current_user_group_role)?.toLowerCase() ?? null;

  return { status, role, isAdmin: isAdminRole(role) };
}

/**
 * Only approved members (or staff roles) may open a group's chat. A loaded group with no
 * membership status is someone who never joined, so it is NOT a member.
 */
export function canOpenGroupChat(group: unknown): boolean {
  if (!isRecord(group)) {
    return false;
  }

  const { status, isAdmin } = readMembership(group);

  return isAdmin || Boolean(status && APPROVED_MEMBERSHIP_STATUSES.has(status));
}

export function canSendMessageToGroup(
  group: unknown,
  _currentUserId: Id | null | undefined,
  t: ChatCatalog,
): {
  allowed: boolean;
  reason?: string;
  permission: ChatSendPermission;
} {
  if (!isRecord(group)) {
    return { allowed: false, reason: t.permission.undetermined, permission: 'unknown' };
  }

  const { status, isAdmin } = readMembership(group);
  const sendPermission = toText(group.send_messages_permission)?.toLowerCase();
  const isApprovedMember = isAdmin || Boolean(status && APPROVED_MEMBERSHIP_STATUSES.has(status));

  if (!status && !isAdmin) {
    return { allowed: false, reason: t.permission.membersOnly, permission: 'not_member' };
  }

  if (status && BLOCKED_MEMBERSHIP_STATUSES.has(status) && !isAdmin) {
    return {
      allowed: false,
      reason: t.permission.membersOnly,
      permission: status === 'blocked' ? 'blocked' : 'not_member',
    };
  }

  if (sendPermission === 'admins_only') {
    return {
      allowed: isAdmin,
      reason: isAdmin ? undefined : t.permission.adminsOnly,
      permission: 'admins_only',
    };
  }

  if (sendPermission === 'all_members') {
    return {
      allowed: isApprovedMember,
      reason: isApprovedMember ? undefined : t.permission.membersOnly,
      permission: 'members_only',
    };
  }

  return {
    allowed: isApprovedMember,
    reason: isApprovedMember ? undefined : t.permission.readOnly,
    permission: 'unknown',
  };
}

export function toSafeChatErrorMessage(error: unknown, t: ChatCatalog): string {
  const normalizedError = normalizeApiError(error);

  if (normalizedError.code === 'NETWORK_ERROR' || normalizedError.code === 'TIMEOUT') {
    return t.errors.network;
  }

  if (normalizedError.code === 'UNAUTHORIZED') {
    return t.errors.unauthorized;
  }

  if (normalizedError.code === 'FORBIDDEN') {
    return t.errors.permission;
  }

  return t.errors.generic;
}

export function toSafeSendChatErrorMessage(error: unknown, t: ChatCatalog): string {
  const normalizedError = normalizeApiError(error);

  switch (normalizedError.code) {
    case 'FORBIDDEN':
      return t.errors.permission;
    case 'UNAUTHORIZED':
      return t.errors.unauthorized;
    case 'RATE_LIMITED':
      return t.errors.rateLimited;
    case 'NETWORK_ERROR':
    case 'TIMEOUT':
      return t.errors.sendNetwork;
    case 'VALIDATION_ERROR':
      return normalizedError.fieldErrors?.attachment ? t.errors.attachmentRejected : t.errors.send;
    default:
      return t.errors.send;
  }
}

export type ChatMessagesPage = {
  /** Oldest first. */
  messages: ChatMessage[];
  hasMore: boolean;
};

function toPage(response: PaginatedResult<unknown>, groupId: Id): ChatMessagesPage {
  const messages = response.results
    .map((message) => normalizeChatMessage(message, groupId))
    .filter((message): message is ChatMessage => message !== null);

  return { messages: mergeChatMessages([], messages), hasMore: Boolean(response.next) };
}

/** Newest-first REST page (page 1 = newest). */
export async function loadGroupChatMessagesPage(
  groupId: Id,
  authToken: string,
  page: number,
): Promise<ChatMessagesPage> {
  return toPage(
    await apiGroupsService.listGroupMessages(groupId, authToken, {
      page,
      pageSize: MESSAGES_PAGE_SIZE,
      ordering: '-created_at',
    }),
    groupId,
  );
}

/** Requests a fresh single-use WebSocket ticket for the group chat. */
export async function requestChatSocketTicket(groupId: Id, authToken: string): Promise<string> {
  const response = await apiGroupsService.requestGroupChatTicket(groupId, authToken);

  if (typeof response?.ticket !== 'string' || !response.ticket) {
    throw new Error('Invalid chat ticket response');
  }

  return response.ticket;
}

/**
 * Sends a text message. Resolves with the persisted message (carrying its server id), or
 * `null` when the response had none; the caller then refreshes instead of inventing an id.
 */
export async function sendTextMessage(
  groupId: Id,
  content: string,
  idempotencyKey: string,
  authToken: string,
): Promise<ChatMessage | null> {
  const response = await apiGroupsService.sendGroupMessage(
    groupId,
    { content },
    authToken,
    idempotencyKey,
  );

  return normalizeChatMessage(response, groupId);
}

export type AttachmentUpload = {
  promise: Promise<ChatMessage | null>;
  abort: () => void;
};

/** Sends an image message (multipart) with progress reporting and a cancel handle. */
export function sendAttachmentMessage(
  groupId: Id,
  input: { content: string; attachment: ChatAttachment },
  idempotencyKey: string,
  authToken: string,
  onProgress: (fraction: number) => void,
): AttachmentUpload {
  const handle = apiGroupsService.sendGroupMessageWithAttachment(
    groupId,
    buildMessageFormData(input),
    authToken,
    { idempotencyKey, onProgress },
  );

  return {
    promise: handle.promise.then((response) => normalizeChatMessage(response, groupId)),
    abort: handle.abort,
  };
}

export const CHAT_ATTACHMENT_PATH_PREFIX = '/api/v1/protected-chat-attachments/';

/** Short-lived, in-app-only URL of one attachment. Rejects anything that is not our backend. */
export async function requestChatAttachmentUrl(
  groupId: Id,
  messageId: number,
  authToken: string,
): Promise<string> {
  const ticket = await apiGroupsService.requestGroupMessageAttachmentTicket(
    groupId,
    messageId,
    authToken,
  );

  if (
    !isTrustedBackendUrl(ticket.preview_url, {
      pathPrefixes: [CHAT_ATTACHMENT_PATH_PREFIX],
      allowHttpInDevelopment: true,
    })
  ) {
    throw new Error('Untrusted attachment URL');
  }

  return ticket.preview_url;
}
