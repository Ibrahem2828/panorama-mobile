import { AppBadge, AppCard, AppText, Stack } from '../../../components';
import { useTranslation, type TranslationCatalog } from '../../../i18n';
import type { GroupRole, SendMessagesPermission } from '../types';

type GroupPermissionCardProps = {
  sendMessagesPermission?: SendMessagesPermission;
  currentUserGroupRole?: GroupRole | null;
};

type PermissionsCatalog = TranslationCatalog['groups']['permissions'];

function getSendPermissionLabel(
  permission: SendMessagesPermission | undefined,
  t: PermissionsCatalog,
) {
  switch (permission) {
    case 'all_members':
      return t.allMembersCanSend;
    case 'admins_only':
      return t.adminsOnly;
    default:
      return t.groupDecides;
  }
}

function getRoleLabel(role: GroupRole | null | undefined, t: PermissionsCatalog) {
  switch (role) {
    case 'member':
      return t.roleMember;
    case 'moderator':
      return t.roleModerator;
    case 'group_admin':
      return t.roleGroupAdmin;
    case 'admin':
      return t.roleAdmin;
    case 'it_support':
      return t.roleSupport;
    case undefined:
    case null:
      return t.roleNone;
    default:
      return role;
  }
}

export function GroupPermissionCard({
  sendMessagesPermission,
  currentUserGroupRole,
}: GroupPermissionCardProps) {
  const { t } = useTranslation();
  const permissions = t.groups.permissions;

  return (
    <AppCard variant="muted">
      <Stack gap="md">
        <AppText variant="title">{permissions.title}</AppText>
        <AppText color="secondary" variant="bodySmall">
          {getSendPermissionLabel(sendMessagesPermission, permissions)}
        </AppText>
        <Stack direction="horizontal" gap="sm" wrap>
          <AppBadge
            label={permissions.yourRole(getRoleLabel(currentUserGroupRole, permissions))}
            variant="neutral"
          />
          {sendMessagesPermission ? (
            <AppBadge label={permissions.sending(sendMessagesPermission)} variant="info" />
          ) : null}
        </Stack>
      </Stack>
    </AppCard>
  );
}
