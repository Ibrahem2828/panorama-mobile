import {
  groupsService as apiGroupsService,
  normalizeApiError,
  type EmptyResponse,
  type GroupJoinResult as ApiGroupJoinResult,
  type GroupRecord,
  type PaginatedResult,
} from '../../../api';
import type {
  Group,
  GroupJoinResult,
  GroupMembershipStatus,
  GroupRole,
  Id,
  SendMessagesPermission,
} from '../types';

const NETWORK_MESSAGE = 'تعذر تحميل الغروبات. تحقق من اتصال الإنترنت وحاول مرة أخرى.';
const UNAUTHORIZED_MESSAGE = 'انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى.';
const PERMISSION_MESSAGE = 'لا تملك صلاحية الوصول إلى هذه الغروبات حاليا.';
const GENERIC_MESSAGE = 'تعذر تحميل الغروبات. حاول مرة أخرى.';

const SAFE_WHATSAPP_PREFIXES = [
  'https://chat.whatsapp.com/',
  'https://wa.me/',
  'whatsapp://',
] as const;

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

function toCount(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function toRelation(value: unknown): Id | Record<string, unknown> | null {
  if (typeof value === 'string' || typeof value === 'number' || isRecord(value)) {
    return value;
  }

  return null;
}

function toNullableText(value: unknown): string | null {
  return toText(value) ?? null;
}

function toGroupMembershipStatus(value: unknown): GroupMembershipStatus | undefined {
  return toText(value);
}

function toGroupRole(value: unknown): GroupRole | null {
  return toText(value) ?? null;
}

function toSendMessagesPermission(value: unknown): SendMessagesPermission | undefined {
  return toText(value);
}

function normalizeGroup(record: GroupRecord): Group {
  return {
    ...record,
    id: record.id,
    name: toText(record.name),
    title: toText(record.title),
    description: toNullableText(record.description),
    image: toNullableText(record.image),
    image_url: toNullableText(record.image_url),
    members_count: toCount(record.members_count),
    current_user_membership_status: toGroupMembershipStatus(record.current_user_membership_status),
    current_user_group_role: toGroupRole(record.current_user_group_role),
    send_messages_permission: toSendMessagesPermission(record.send_messages_permission),
    whatsapp_url: toNullableText(record.whatsapp_url),
    whatsapp_link: toNullableText(record.whatsapp_link),
    external_chat_url: toNullableText(record.external_chat_url),
    external_link: toNullableText(record.external_link),
    university: toRelation(record.university),
    major: toRelation(record.major),
    academic_year: toRelation(record.academic_year),
    semester: toRelation(record.semester),
    subject: toRelation(record.subject),
    created_at: toText(record.created_at),
    updated_at: toText(record.updated_at),
  };
}

function normalizeGroupList(response: PaginatedResult<GroupRecord>): PaginatedResult<Group> {
  return {
    ...response,
    results: response.results.map(normalizeGroup),
  };
}

function trimDetectedLink(value: string): string {
  return value.replace(/[)\].,،؛;!?]+$/u, '');
}

export function isSafeWhatsAppLink(value: string | null | undefined): value is string {
  if (!value) {
    return false;
  }

  return SAFE_WHATSAPP_PREFIXES.some((prefix) => value.startsWith(prefix));
}

function getFirstSafeWhatsAppField(group: Group): string | null {
  const candidates = [
    group.whatsapp_url,
    group.whatsapp_link,
    group.external_chat_url,
    group.external_link,
  ];

  for (const candidate of candidates) {
    if (isSafeWhatsAppLink(candidate)) {
      return candidate;
    }
  }

  return null;
}

export function getGroupWhatsAppLink(group: Group): string | null {
  const fieldLink = getFirstSafeWhatsAppField(group);

  if (fieldLink) {
    return fieldLink;
  }

  const description = group.description;

  if (!description) {
    return null;
  }

  const match = description.match(
    /(?:https:\/\/chat\.whatsapp\.com\/[^\s<]+|https:\/\/wa\.me\/[^\s<]+|whatsapp:\/\/[^\s<]+)/u,
  );
  const detectedLink = match ? trimDetectedLink(match[0]) : null;

  return isSafeWhatsAppLink(detectedLink) ? detectedLink : null;
}

export function getGroupDisplayName(group: Group): string {
  return toText(group.name) ?? toText(group.title) ?? 'غروب بدون اسم';
}

export function getGroupDescription(group: Group): string | null {
  return toText(group.description) ?? null;
}

export function getGroupImageUri(group: Group): string | null {
  const imageUri = toText(group.image_url) ?? toText(group.image);

  if (!imageUri || !/^https?:\/\//u.test(imageUri)) {
    return null;
  }

  return imageUri;
}

export function getEntityLabel(value: unknown): string | null {
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }

  if (!isRecord(value)) {
    return null;
  }

  return (
    toText(value.name) ??
    toText(value.title) ??
    toText(value.label) ??
    toText(value.code) ??
    toText(value.id) ??
    null
  );
}

export function canRequestJoin(group: Group): boolean {
  const status = group.current_user_membership_status;

  return !status || status === 'none' || status === 'rejected' || status === 'left';
}

export function canLeaveGroup(group: Group): boolean {
  const status = group.current_user_membership_status;
  const role = group.current_user_group_role;

  return (
    status === 'approved' || role === 'member' || role === 'moderator' || role === 'group_admin'
  );
}

export function toSafeGroupsErrorMessage(error: unknown): string {
  const normalizedError = normalizeApiError(error);

  if (normalizedError.code === 'NETWORK_ERROR' || normalizedError.code === 'TIMEOUT') {
    return NETWORK_MESSAGE;
  }

  if (normalizedError.code === 'UNAUTHORIZED') {
    return UNAUTHORIZED_MESSAGE;
  }

  if (normalizedError.code === 'FORBIDDEN') {
    return PERMISSION_MESSAGE;
  }

  return normalizedError.message || GENERIC_MESSAGE;
}

export async function loadAvailableGroups(authToken: string): Promise<PaginatedResult<Group>> {
  return normalizeGroupList(await apiGroupsService.listAvailableGroups(authToken));
}

export async function loadMyGroups(authToken: string): Promise<PaginatedResult<Group>> {
  return normalizeGroupList(await apiGroupsService.listMyGroups(authToken));
}

export async function loadGroupDetail(groupId: Id, authToken: string): Promise<Group> {
  return normalizeGroup(await apiGroupsService.getGroupDetail(groupId, authToken));
}

export async function requestJoinGroup(groupId: Id, authToken: string): Promise<GroupJoinResult> {
  const response: ApiGroupJoinResult = await apiGroupsService.joinGroup(groupId, authToken);
  const maybeGroup = response.group;

  return {
    ...response,
    status: toGroupMembershipStatus(response.status),
    group: maybeGroup ? normalizeGroup(maybeGroup) : undefined,
  };
}

export function requestLeaveGroup(groupId: Id, authToken: string): Promise<EmptyResponse> {
  return apiGroupsService.leaveGroup(groupId, authToken);
}
