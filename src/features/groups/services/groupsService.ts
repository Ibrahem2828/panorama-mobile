import {
  groupsService as apiGroupsService,
  normalizeApiError,
  type EmptyResponse,
  type GroupJoinResult as ApiGroupJoinResult,
  type GroupRecord,
  type PaginatedResult,
  type GroupWhatsAppTicket,
} from '../../../api';
import type {
  Group,
  GroupJoinResult,
  GroupMembershipStatus,
  GroupRole,
  Id,
  SendMessagesPermission,
} from '../types';

const NETWORK_MESSAGE = 'تعذر تحميل المجموعات. تحقق من اتصال الإنترنت وحاول مرة أخرى.';
const UNAUTHORIZED_MESSAGE = 'انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى.';
const PERMISSION_MESSAGE = 'لا تملك صلاحية الوصول إلى هذه المجموعات حاليا.';
const GENERIC_MESSAGE = 'تعذر تحميل المجموعات. حاول مرة أخرى.';

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
    has_whatsapp_channel: record.has_whatsapp_channel === true,
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

export function getGroupDisplayName(group: Group): string {
  return toText(group.name) ?? toText(group.title) ?? 'مجموعة بدون اسم';
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

export async function requestWhatsAppAccess(
  groupId: Id,
  authToken: string,
): Promise<GroupWhatsAppTicket> {
  return apiGroupsService.requestGroupWhatsAppTicket(groupId, authToken);
}
