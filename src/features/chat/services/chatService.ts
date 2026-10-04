import {
  groupsService as apiGroupsService,
  normalizeApiError,
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

function normalizeMessage(
  message: ApiGroupMessage | ChatMessage | Record<string, unknown>,
  fallbackId: Id,
): ChatMessage {
  return {
    ...message,
    id: toId(message.id) ?? fallbackId,
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

function normalizeList(
  response: PaginatedResult<ApiGroupMessage>,
  groupId: Id,
): PaginatedResult<ChatMessage> {
  return {
    ...response,
    results: response.results.map((message, index) =>
      normalizeMessage(message, `${String(groupId)}-${index}`),
    ),
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

function sortMessages(messages: ChatMessage[]): ChatMessage[] {
  return [...messages].sort((left, right) => {
    const leftTime = left.created_at ? new Date(left.created_at).getTime() : 0;
    const rightTime = right.created_at ? new Date(right.created_at).getTime() : 0;

    return leftTime - rightTime;
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
  return normalizeList(await apiGroupsService.listGroupMessages(groupId, authToken), groupId);
}

export async function sendGroupChatMessage(
  groupId: Id,
  input: SendChatMessageInput,
  authToken: string,
): Promise<ChatMessage> {
  const response = await apiGroupsService.sendGroupMessage(
    groupId,
    {
      type: 'message',
      content: input.message,
    },
    authToken,
  );

  return normalizeMessage(response, `${String(groupId)}-${Date.now()}`);
}
