import { AppCard, AppText, Stack } from '../../../components';
import type { ChatSendPermission } from '../types';
import { useTranslation, type TranslationCatalog } from '../../../i18n';

type ChatPermissionNoticeProps = {
  permission: ChatSendPermission;
  reason?: string;
};

function getPermissionMessage(
  permission: ChatSendPermission,
  reason: string | undefined,
  t: TranslationCatalog,
): string {
  if (reason) {
    return reason;
  }

  switch (permission) {
    case 'not_member':
    case 'members_only':
      return t.chat.permission.membersOnly;
    case 'admins_only':
      return t.chat.permission.adminsOnly;
    case 'blocked':
      return t.chat.permission.blocked;
    case 'unknown':
      return t.chat.permission.readOnly;
    default:
      return t.chat.permission.blocked;
  }
}

export function ChatPermissionNotice({ permission, reason }: ChatPermissionNoticeProps) {
  const { t } = useTranslation();
  return (
    <AppCard variant="muted">
      <Stack gap="xs">
        <AppText variant="title">{t.chat.permission.title}</AppText>
        <AppText color="secondary" variant="bodySmall">
          {getPermissionMessage(permission, reason, t)}
        </AppText>
      </Stack>
    </AppCard>
  );
}
