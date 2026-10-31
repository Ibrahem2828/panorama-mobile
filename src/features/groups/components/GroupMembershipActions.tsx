import { Alert } from 'react-native';

import { AppButton, AppText, Stack } from '../../../components';
import { useTranslation } from '../../../i18n';
import { resolveMembershipState } from '../services';
import type { Group, Id } from '../types';

type GroupMembershipActionsProps = {
  group: Group;
  pendingAction?: 'leave';
  onLeave: (groupId: Id) => void;
};

/**
 * Read-only membership states plus leaving (with confirmation). There is deliberately no join action: students join
 * their subjects' groups automatically when a subject-registration request is approved.
 */
export function GroupMembershipActions({
  group,
  pendingAction,
  onLeave,
}: GroupMembershipActionsProps) {
  const { t } = useTranslation();
  const membership = resolveMembershipState(group);

  function confirmLeave() {
    Alert.alert(t.groups.leaveConfirm.title, t.groups.leaveConfirm.message, [
      { text: t.common.cancel, style: 'cancel' },
      {
        text: t.groups.leaveConfirm.confirm,
        style: 'destructive',
        onPress: () => onLeave(group.id),
      },
    ]);
  }

  return (
    <Stack gap="md">
      {membership.kind === 'pending' ? (
        <AppText color="warning" variant="bodySmall">
          {t.groups.notices.legacyPending}
        </AppText>
      ) : null}
      {membership.kind === 'blocked' ? (
        <AppText color="error" variant="bodySmall">
          {t.groups.notices.blocked}
        </AppText>
      ) : null}
      {membership.canLeave ? (
        <AppButton
          fullWidth
          loading={pendingAction === 'leave'}
          onPress={confirmLeave}
          title={t.groups.details.leave}
          variant="dangerOutline"
        />
      ) : null}
    </Stack>
  );
}
