import { AppBadge, AppCard, AppText, Stack } from '../../../components';
import { getGroupDisplayName } from '../../groups/services';
import type { Group } from '../../groups/types';
import type { ChatConnectionStatus } from '../types';

type ChatRoomHeaderProps = {
  group: Group | null;
  connectionStatus: ChatConnectionStatus;
};

function getMembershipLabel(status?: string): string {
  switch (status) {
    case 'approved':
    case 'member':
      return 'عضو';
    case 'pending':
      return 'بانتظار الموافقة';
    case 'blocked':
      return 'محظور';
    default:
      return 'غير محدد';
  }
}

export function ChatRoomHeader({ group, connectionStatus }: ChatRoomHeaderProps) {
  return (
    <AppCard padding="lg" variant="elevated">
      <Stack gap="md">
        <Stack gap="xs">
          <AppText variant="title">{group ? getGroupDisplayName(group) : 'محادثة الغروب'}</AppText>
          {group?.members_count !== undefined ? (
            <AppText color="secondary" variant="bodySmall">
              عدد الأعضاء: {group.members_count}
            </AppText>
          ) : null}
        </Stack>
        <Stack direction="horizontal" gap="sm" wrap>
          <AppBadge
            label={getMembershipLabel(group?.current_user_membership_status)}
            variant="info"
          />
          <AppBadge
            label={connectionStatus === 'connected' ? 'WebSocket' : 'REST'}
            variant={connectionStatus === 'connected' ? 'success' : 'neutral'}
          />
        </Stack>
      </Stack>
    </AppCard>
  );
}
