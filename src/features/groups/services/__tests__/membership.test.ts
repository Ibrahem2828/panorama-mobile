import { optimisticJoinStatus, resolveMembershipState } from '../membership';

describe('resolveMembershipState', () => {
  it('lets a student without membership request to join', () => {
    expect(resolveMembershipState({})).toMatchObject({ kind: 'notMember', canRequestJoin: true });
    expect(resolveMembershipState({ current_user_membership_status: 'none' }).canRequestJoin).toBe(
      true,
    );
  });

  it('treats a pending request as waiting: no join, no leave, no content', () => {
    expect(resolveMembershipState({ current_user_membership_status: 'pending' })).toEqual({
      kind: 'pending',
      canRequestJoin: false,
      canLeave: false,
      canOpenContent: false,
    });
  });

  it('gives approved members content access and leave', () => {
    expect(resolveMembershipState({ current_user_membership_status: 'approved' })).toEqual({
      kind: 'member',
      canRequestJoin: false,
      canLeave: true,
      canOpenContent: true,
    });
  });

  it('allows a new request after rejection or leaving', () => {
    expect(resolveMembershipState({ current_user_membership_status: 'rejected' })).toMatchObject({
      kind: 'rejected',
      canRequestJoin: true,
      canOpenContent: false,
    });
    expect(resolveMembershipState({ current_user_membership_status: 'left' }).canRequestJoin).toBe(
      true,
    );
  });

  it('never lets a blocked student join, leave or open content', () => {
    expect(
      resolveMembershipState({
        current_user_membership_status: 'blocked',
        current_user_group_role: 'member',
      }),
    ).toEqual({ kind: 'blocked', canRequestJoin: false, canLeave: false, canOpenContent: false });
  });

  it('falls back to the role when the status is missing', () => {
    expect(resolveMembershipState({ current_user_group_role: 'moderator' }).kind).toBe('member');
  });
});

describe('optimisticJoinStatus', () => {
  it('is pending unless approval is explicitly not required', () => {
    expect(optimisticJoinStatus({})).toBe('pending');
    expect(optimisticJoinStatus({ requires_approval: true })).toBe('pending');
    expect(optimisticJoinStatus({ requires_approval: false })).toBe('approved');
  });
});
