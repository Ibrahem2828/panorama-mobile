import {
  academicService,
  groupsService as apiGroupsService,
  normalizeApiError,
  runIdempotentAction,
  type EmptyResponse,
  type GroupJoinResult as ApiGroupJoinResult,
  type GroupRecord,
  type PaginatedResult,
} from '../../../api';
import type { AvailableGroupsParams } from '../../../api/services/groups.service';
import type { TranslationCatalog } from '../../../i18n';
import { resolveMembershipState } from './membership';
import type {
  Group,
  GroupJoinResult,
  GroupMembershipStatus,
  GroupRole,
  Id,
  SendMessagesPermission,
  SubjectLabel,
} from '../types';

type GroupsCatalog = TranslationCatalog['groups'];

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

export function getGroupDisplayName(group: Group, t: GroupsCatalog): string {
  return toText(group.name) ?? toText(group.title) ?? t.untitled;
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
  return resolveMembershipState(group).canRequestJoin;
}

export function canLeaveGroup(group: Group): boolean {
  return resolveMembershipState(group).canLeave;
}

export function matchesGroupSearch(
  group: Group,
  query: string,
  t: GroupsCatalog,
  subject?: SubjectLabel | null,
): boolean {
  const needle = query.trim().toLowerCase();

  if (!needle) {
    return true;
  }

  return [getGroupDisplayName(group, t), getGroupDescription(group), subject?.name, subject?.code]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .includes(needle);
}

export function toSafeGroupsErrorMessage(error: unknown, t: GroupsCatalog): string {
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

export const AVAILABLE_GROUPS_PAGE_SIZE = 20;
const MY_GROUPS_PAGE_SIZE = 100;
const MY_GROUPS_MAX_PAGES = 10;
const SUBJECTS_PAGE_SIZE = 100;
const SUBJECTS_MAX_PAGES = 10;

/** One page of the groups the student can request to join; search and subject run on the server. */
export async function loadAvailableGroups(
  authToken: string,
  params: AvailableGroupsParams = {},
): Promise<PaginatedResult<Group>> {
  return normalizeGroupList(
    await apiGroupsService.listAvailableGroups(authToken, {
      pageSize: AVAILABLE_GROUPS_PAGE_SIZE,
      ...params,
      search: params.search?.trim() || undefined,
    }),
  );
}

/** "My groups" is small and membership-bound, so it is read completely (bounded) and searched locally. */
export async function loadMyGroups(authToken: string): Promise<PaginatedResult<Group>> {
  const results: Group[] = [];
  let count = 0;

  for (let page = 1; page <= MY_GROUPS_MAX_PAGES; page += 1) {
    const response = normalizeGroupList(
      await apiGroupsService.listMyGroups(authToken, { page, pageSize: MY_GROUPS_PAGE_SIZE }),
    );

    results.push(...response.results);
    count = response.count;

    if (!response.next || response.results.length === 0) {
      break;
    }
  }

  return { count: Math.max(count, results.length), next: null, previous: null, results };
}

/** Subject names and codes of a faculty, keyed by subject id (groups only carry the id). */
export async function loadSubjectLabels(
  facultyId: Id,
  authToken: string,
): Promise<Record<string, SubjectLabel>> {
  const labels: Record<string, SubjectLabel> = {};

  for (let page = 1; page <= SUBJECTS_MAX_PAGES; page += 1) {
    const response = await academicService.listSubjectsForFaculty(
      facultyId,
      { page, pageSize: SUBJECTS_PAGE_SIZE, ordering: 'name' },
      authToken,
    );

    for (const subject of response.results) {
      const name = toText(subject.name) ?? toText(subject.title);

      if (name) {
        labels[String(subject.id)] = { name, code: toText(subject.code) ?? null };
      }
    }

    if (!response.next || response.results.length === 0) {
      break;
    }
  }

  return labels;
}

export function getGroupSubjectId(group: Group): string | null {
  const subject = group.subject;

  if (typeof subject === 'string' || typeof subject === 'number') {
    return String(subject);
  }

  return isRecord(subject) ? (toText(subject.id) ?? null) : null;
}

export async function loadGroupDetail(groupId: Id, authToken: string): Promise<Group> {
  return normalizeGroup(await apiGroupsService.getGroupDetail(groupId, authToken));
}

export async function requestJoinGroup(groupId: Id, authToken: string): Promise<GroupJoinResult> {
  const response: ApiGroupJoinResult = await runIdempotentAction(
    `group:join:${String(groupId)}`,
    { groupId },
    (idempotencyKey) => apiGroupsService.joinGroup(groupId, authToken, idempotencyKey),
  );
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

export function requestWhatsAppLaunchLink(groupId: Id, authToken: string): Promise<unknown> {
  return apiGroupsService
    .requestGroupWhatsAppLaunch(groupId, authToken)
    .then((response) => response?.app_url);
}
