import { Alert } from 'react-native';

import { AppButton, AppText, Stack } from '../../../components';
import { useTranslation } from '../../../i18n';
import { resolveMembershipState } from '../services';
import type { Group, Id } from '../types';

type GroupMembershipActionsProps = {
  group: Group;
  pendingAction?: 'join' | 'leave';
  onJoin: (groupId: Id) => void;
  onLeave: (groupId: Id) => void;
};

/** Clear join states: request / pending / member (leave, with confirmation) / rejected / blocked. */
export function GroupMembershipActions({
  group,
  pendingAction,
  onJoin,
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
          {t.groups.notices.pending}
        </AppText>
      ) : null}
      {membership.kind === 'rejected' ? (
        <AppText color="warning" variant="bodySmall">
          {t.groups.notices.rejected}
        </AppText>
      ) : null}
      {membership.kind === 'blocked' ? (
        <AppText color="error" variant="bodySmall">
          {t.groups.notices.blocked}
        </AppText>
      ) : null}

      {membership.canRequestJoin ? (
        <AppButton
          fullWidth
          loading={pendingAction === 'join'}
          onPress={() => onJoin(group.id)}
          title={t.groups.details.join}
        />
      ) : null}
      {membership.kind === 'pending' ? (
        <AppButton disabled fullWidth title={t.groups.card.pendingShort} variant="outline" />
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
