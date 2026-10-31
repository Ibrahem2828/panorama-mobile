import { resolveMembershipState } from '../membership';

describe('resolveMembershipState', () => {
  it('never offers a way to join: there is no join capability in the state at all', () => {
    for (const status of [
      undefined,
      'none',
      'pending',
      'approved',
      'rejected',
      'left',
      'blocked',
    ]) {
      expect(resolveMembershipState({ current_user_membership_status: status })).not.toHaveProperty(
        'canRequestJoin',
      );
    }
  });

  it('treats a student without membership as not a member, with no content', () => {
    expect(resolveMembershipState({})).toEqual({
      kind: 'notMember',
      canLeave: false,
      canOpenContent: false,
    });
    expect(resolveMembershipState({ current_user_membership_status: 'none' }).kind).toBe(
      'notMember',
    );
  });

  it('keeps a legacy pending request read-only: no leave, no content', () => {
    expect(resolveMembershipState({ current_user_membership_status: 'pending' })).toEqual({
      kind: 'pending',
      canLeave: false,
      canOpenContent: false,
    });
  });

  it('gives approved members content access and leave', () => {
    expect(resolveMembershipState({ current_user_membership_status: 'approved' })).toEqual({
      kind: 'member',
      canLeave: true,
      canOpenContent: true,
    });
  });

  it('keeps rejected and left groups closed', () => {
    expect(resolveMembershipState({ current_user_membership_status: 'rejected' })).toEqual({
      kind: 'rejected',
      canLeave: false,
      canOpenContent: false,
    });
    expect(resolveMembershipState({ current_user_membership_status: 'left' }).canOpenContent).toBe(
      false,
    );
  });

  it('never lets a blocked student leave or open content', () => {
    expect(
      resolveMembershipState({
        current_user_membership_status: 'blocked',
        current_user_group_role: 'member',
      }),
    ).toEqual({ kind: 'blocked', canLeave: false, canOpenContent: false });
  });

  it('falls back to the role when the status is missing', () => {
    expect(resolveMembershipState({ current_user_group_role: 'moderator' }).kind).toBe('member');
  });
});
