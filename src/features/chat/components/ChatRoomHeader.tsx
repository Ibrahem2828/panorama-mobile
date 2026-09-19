import { AppBadge, AppCard, AppText, Stack } from '../../../components';
import { useTranslation, type TranslationCatalog } from '../../../i18n';
import { getGroupDisplayName } from '../../groups/services';
import type { Group } from '../../groups/types';
import type { ChatConnectionStatus } from '../types';

type ChatRoomHeaderProps = {
  group: Group | null;
  connectionStatus: ChatConnectionStatus;
};

function getMembershipLabel(status: string | undefined, t: TranslationCatalog): string {
  switch (status) {
    case 'approved':
    case 'member':
      return t.chat.membership.member;
    case 'pending':
      return t.chat.membership.pending;
    case 'blocked':
      return t.chat.membership.blocked;
    default:
      return t.chat.membership.unknown;
  }
}

export function ChatRoomHeader({ group, connectionStatus }: ChatRoomHeaderProps) {
  const { t } = useTranslation();

  return (
    <AppCard padding="lg" variant="elevated">
      <Stack gap="md">
        <Stack gap="xs">
          <AppText variant="title">
            {group ? getGroupDisplayName(group, t.groups) : t.groups.details.chatTitle}
          </AppText>
          {group?.members_count !== undefined ? (
            <AppText color="secondary" variant="bodySmall">
              {t.chat.membersCount(group.members_count)}
            </AppText>
          ) : null}
        </Stack>
        <Stack direction="horizontal" gap="sm" wrap>
          <AppBadge
            label={getMembershipLabel(group?.current_user_membership_status, t)}
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
