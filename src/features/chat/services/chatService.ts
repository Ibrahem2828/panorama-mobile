import {
  groupsService as apiGroupsService,
  normalizeApiError,
  runIdempotentAction,
  type GroupMessage as ApiGroupMessage,
  type PaginatedResult,
} from '../../../api';
import type {
  ChatMessage,
  ChatMessageSender,
  ChatSendPermission,
  Id,
  SendChatMessageInput,
} from '../types';
import type { TranslationCatalog } from '../../../i18n';

type ChatCatalog = TranslationCatalog['chat'];

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

  if (typeof value === 'number') {
    return String(value);
  }

  return undefined;
}

function toId(value: unknown): Id | null {
  if (typeof value === 'string' || typeof value === 'number') {
    return value;
  }

  return null;
}

function normalizeSender(value: unknown): Id | ChatMessageSender | null {
  if (typeof value === 'string' || typeof value === 'number') {
    return value;
  }

  if (!isRecord(value)) {
    return null;
  }

  return {
    ...value,
    id: toId(value.id) ?? undefined,
    full_name: toText(value.full_name ?? value.name),
    username: toText(value.username) ?? null,
    email: toText(value.email),
    role: toText(value.role),
  };
}

/**
 * Message identity is the SERVER id. A payload without one is not a persisted message, so
 * it is rejected instead of being given an invented id that could never be de-duplicated.
 */
function normalizeMessage(
  message: ApiGroupMessage | ChatMessage | Record<string, unknown>,
): ChatMessage | null {
  const id = toId(message.id);

  if (id === null) {
    return null;
  }

  return {
    ...message,
    id,
    group: toId(message.group) ?? (isRecord(message.group) ? message.group : null),
    sender: normalizeSender(message.sender),
    sender_name: toText(message.sender_name),
    message: toText(message.message),
    body: toText(message.body),
    content: toText(message.content),
    text: toText(message.text),
    is_own: typeof message.is_own === 'boolean' ? message.is_own : undefined,
    created_at: toText(message.created_at ?? message.createdAt),
    updated_at: toText(message.updated_at),
  };
}

function normalizeList(response: PaginatedResult<ApiGroupMessage>): PaginatedResult<ChatMessage> {
  return {
    ...response,
    results: response.results
      .map((message) => normalizeMessage(message))
      .filter((message): message is ChatMessage => message !== null),
  };
}

function getSenderId(message: ChatMessage): Id | null {
  if (typeof message.sender === 'string' || typeof message.sender === 'number') {
    return message.sender;
  }

  return message.sender?.id ?? null;
}

function isAdminRole(role?: string | null): boolean {
  return Boolean(role && ADMIN_ROLES.has(role));
}

function timeOf(message: ChatMessage): number {
  const time = message.created_at ? new Date(message.created_at).getTime() : Number.NaN;

  return Number.isNaN(time) ? 0 : time;
}

/** Oldest first by created_at; the server id breaks ties so the order is stable. */
function sortMessages(messages: ChatMessage[]): ChatMessage[] {
  return [...messages].sort((left, right) => {
    const byTime = timeOf(left) - timeOf(right);

    if (byTime !== 0) {
      return byTime;
    }

    const leftId = Number(left.id);
    const rightId = Number(right.id);

    if (!Number.isNaN(leftId) && !Number.isNaN(rightId)) {
      return leftId - rightId;
    }

    return String(left.id).localeCompare(String(right.id));
  });
}

export function getChatMessageText(message: ChatMessage, t: ChatCatalog): string {
  return (
    toText(message.content) ??
    toText(message.message) ??
    toText(message.body) ??
    toText(message.text) ??
    t.emptyMessageBody
  );
}

export function getChatMessageSenderName(message: ChatMessage, t: ChatCatalog): string {
  if (message.sender_name) {
    return message.sender_name;
  }

  if (isRecord(message.sender)) {
    return (
      toText(message.sender.full_name) ??
      toText(message.sender.username) ??
      toText(message.sender.email) ??
      t.unnamedSender
    );
  }

  return t.unnamedSender;
}

export function isOwnChatMessage(message: ChatMessage, currentUserId?: Id | null): boolean {
  if (message.is_own === true) {
    return true;
  }

  if (!currentUserId) {
    return false;
  }

  const senderId = getSenderId(message);

  return senderId !== null && String(senderId) === String(currentUserId);
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
    return {
      allowed: false,
      reason: t.permission.undetermined,
      permission: 'unknown',
    };
  }

  const membershipStatus = toText(group.current_user_membership_status)?.toLowerCase();
  const role = toText(group.current_user_group_role)?.toLowerCase() ?? null;
  const sendPermission = toText(group.send_messages_permission)?.toLowerCase();
  const isApprovedMember =
    !membershipStatus || APPROVED_MEMBERSHIP_STATUSES.has(membershipStatus) || isAdminRole(role);

  if (membershipStatus && BLOCKED_MEMBERSHIP_STATUSES.has(membershipStatus)) {
    return {
      allowed: false,
      reason: t.permission.membersOnly,
      permission: membershipStatus === 'blocked' ? 'blocked' : 'not_member',
    };
  }

  if (sendPermission === 'admins_only') {
    return {
      allowed: isAdminRole(role),
      reason: isAdminRole(role) ? undefined : t.permission.adminsOnly,
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

  if (!sendPermission) {
    return {
      allowed: isApprovedMember,
      reason: isApprovedMember ? undefined : t.permission.readOnly,
      permission: 'unknown',
    };
  }

  return {
    allowed: isApprovedMember,
    reason: isApprovedMember ? undefined : t.permission.blocked,
    permission: 'unknown',
  };
}

export function mergeChatMessages(current: ChatMessage[], incoming: ChatMessage[]): ChatMessage[] {
  const byId = new Map<string, ChatMessage>();

  for (const message of [...current, ...incoming]) {
    byId.set(String(message.id), message);
  }

  return sortMessages(Array.from(byId.values()));
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

  return normalizedError.message || t.errors.generic;
}

export function toSafeSendChatErrorMessage(error: unknown, t: ChatCatalog): string {
  const normalizedError = normalizeApiError(error);

  if (normalizedError.code === 'FORBIDDEN') {
    return t.errors.permission;
  }

  return toSafeChatErrorMessage(error, t) || t.errors.send;
}

export async function loadGroupChatMessages(
  groupId: Id,
  authToken: string,
): Promise<PaginatedResult<ChatMessage>> {
  return normalizeList(await apiGroupsService.listGroupMessages(groupId, authToken));
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
 * Sends over REST. Resolves with the persisted message (carrying its server id), or `null`
 * when the response had none; the caller then refreshes instead of inventing an id.
 */
export async function sendGroupChatMessage(
  groupId: Id,
  input: SendChatMessageInput,
  authToken: string,
): Promise<ChatMessage | null> {
  const payload = { type: 'message' as const, content: input.message };
  // One key per "send this message" action: re-sending the same text after a timeout
  // re-uses it so a message that did reach the server is not posted twice.
  const response = await runIdempotentAction(
    `chat:send:${String(groupId)}`,
    payload,
    (idempotencyKey) =>
      apiGroupsService.sendGroupMessage(groupId, payload, authToken, idempotencyKey),
  );

  return normalizeMessage(response);
}
