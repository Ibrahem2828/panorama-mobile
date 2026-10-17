jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { extra: { apiBaseUrl: 'https://api.example.com' } } },
}));

import { ar } from '../../../../i18n/locales/ar';
import { resolveMembershipState } from '../../../groups/services/membership';
import { canOpenGroupChat, canSendMessageToGroup } from '../chatService';

const cases = [
  { current_user_membership_status: 'approved' },
  { current_user_membership_status: 'pending' },
  { current_user_membership_status: 'blocked' },
  { current_user_membership_status: 'left' },
  { current_user_membership_status: 'rejected' },
  { current_user_membership_status: 'pending', current_user_group_role: 'moderator' },
  { current_user_group_role: 'member' },
  { current_user_group_role: 'admin' },
  {},
];

describe('chat membership follows the group membership rule', () => {
  it.each(cases)('canOpenGroupChat matches resolveMembershipState for %j', (group) => {
    expect(canOpenGroupChat(group)).toBe(resolveMembershipState(group).canOpenContent);
  });

  it('accepts a member role without a status and rejects a pending staff role', () => {
    expect(canOpenGroupChat({ current_user_group_role: 'member' })).toBe(true);
    expect(
      canOpenGroupChat({
        current_user_membership_status: 'pending',
        current_user_group_role: 'moderator',
      }),
    ).toBe(false);
  });

  it('does not allow sending for blocked members', () => {
    const result = canSendMessageToGroup(
      { current_user_membership_status: 'blocked' },
      null,
      ar.chat,
    );

    expect(result.allowed).toBe(false);
    expect(result.permission).toBe('blocked');
  });
});
