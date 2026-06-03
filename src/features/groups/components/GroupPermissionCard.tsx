import { AppBadge, AppCard, AppText, Stack } from '../../../components';
import type { GroupRole, SendMessagesPermission } from '../types';

type GroupPermissionCardProps = {
  sendMessagesPermission?: SendMessagesPermission;
  currentUserGroupRole?: GroupRole | null;
};

function getSendPermissionLabel(permission?: SendMessagesPermission) {
  switch (permission) {
    case 'all_members':
      return 'كل الأعضاء يمكنهم الإرسال';
    case 'admins_only':
      return 'الإرسال للمشرفين فقط';
    default:
      return 'صلاحيات الإرسال يحددها الغروب';
  }
}

function getRoleLabel(role?: GroupRole | null) {
  switch (role) {
    case 'member':
      return 'عضو';
    case 'moderator':
      return 'مشرف';
    case 'group_admin':
      return 'مدير الغروب';
    case 'admin':
      return 'أدمن';
    case 'it_support':
      return 'دعم تقني';
    case undefined:
    case null:
      return 'لا يوجد دور محدد';
    default:
      return role;
  }
}

export function GroupPermissionCard({
  sendMessagesPermission,
  currentUserGroupRole,
}: GroupPermissionCardProps) {
  return (
    <AppCard variant="muted">
      <Stack gap="md">
        <AppText variant="title">الصلاحيات</AppText>
        <AppText color="secondary" variant="bodySmall">
          {getSendPermissionLabel(sendMessagesPermission)}
        </AppText>
        <Stack direction="horizontal" gap="sm" wrap>
          <AppBadge label={`دورك: ${getRoleLabel(currentUserGroupRole)}`} variant="neutral" />
          {sendMessagesPermission ? (
            <AppBadge label={`إرسال: ${sendMessagesPermission}`} variant="info" />
          ) : null}
        </Stack>
      </Stack>
    </AppCard>
  );
}
