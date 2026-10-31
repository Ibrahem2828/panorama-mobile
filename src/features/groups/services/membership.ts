import type { Group } from '../types';

export type MembershipKind = 'notMember' | 'pending' | 'member' | 'rejected' | 'blocked' | 'left';

export type MembershipState = {
  kind: MembershipKind;
  canLeave: boolean;
  /** Chat, files and WhatsApp are for approved members only. */
  canOpenContent: boolean;
};

const MEMBER_ROLES = new Set(['member', 'moderator', 'group_admin']);

/**
 * What a student can do with a group, from the backend membership fields. Joining is not one of the options: the
 * server adds students to their subjects' groups when a subject-registration request is approved, and a `pending`
 * status can only be a legacy request that is shown read-only.
 */
export function resolveMembershipState(
  group: Pick<Group, 'current_user_membership_status' | 'current_user_group_role'>,
): MembershipState {
  const status = group.current_user_membership_status;
  const role = group.current_user_group_role;

  if (status === 'blocked') {
    return { kind: 'blocked', canLeave: false, canOpenContent: false };
  }

  if (status === 'approved' || (!status && role != null && MEMBER_ROLES.has(role))) {
    return { kind: 'member', canLeave: true, canOpenContent: true };
  }

  if (status === 'pending') {
    return { kind: 'pending', canLeave: false, canOpenContent: false };
  }

  if (status === 'rejected') {
    return { kind: 'rejected', canLeave: false, canOpenContent: false };
  }

  if (status === 'left') {
    return { kind: 'left', canLeave: false, canOpenContent: false };
  }

  return { kind: 'notMember', canLeave: false, canOpenContent: false };
}
