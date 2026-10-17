import type { Group } from '../types';

export type MembershipKind = 'notMember' | 'pending' | 'member' | 'rejected' | 'blocked' | 'left';

export type MembershipState = {
  kind: MembershipKind;
  /** The student may send a (new) join request. */
  canRequestJoin: boolean;
  canLeave: boolean;
  /** Chat, files and WhatsApp are for approved members only. */
  canOpenContent: boolean;
};

const MEMBER_ROLES = new Set(['member', 'moderator', 'group_admin']);

/** Single source of truth for what a student can do with a group, from the backend membership fields. */
export function resolveMembershipState(
  group: Pick<Group, 'current_user_membership_status' | 'current_user_group_role'>,
): MembershipState {
  const status = group.current_user_membership_status;
  const role = group.current_user_group_role;

  if (status === 'blocked') {
    return { kind: 'blocked', canRequestJoin: false, canLeave: false, canOpenContent: false };
  }

  if (status === 'approved' || (!status && role != null && MEMBER_ROLES.has(role))) {
    return { kind: 'member', canRequestJoin: false, canLeave: true, canOpenContent: true };
  }

  if (status === 'pending') {
    return { kind: 'pending', canRequestJoin: false, canLeave: false, canOpenContent: false };
  }

  if (status === 'rejected') {
    return { kind: 'rejected', canRequestJoin: true, canLeave: false, canOpenContent: false };
  }

  if (status === 'left') {
    return { kind: 'left', canRequestJoin: true, canLeave: false, canOpenContent: false };
  }

  return { kind: 'notMember', canRequestJoin: true, canLeave: false, canOpenContent: false };
}

/** Optimistic status after a join request (the backend answers pending when approval is required). */
export function optimisticJoinStatus(
  group: Pick<Group, 'requires_approval'>,
): 'pending' | 'approved' {
  return group.requires_approval === false ? 'approved' : 'pending';
}
