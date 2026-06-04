import { AppCard, AppText, Stack } from '../../../components';
import type { ChatSendPermission } from '../types';

type ChatPermissionNoticeProps = {
  permission: ChatSendPermission;
  reason?: string;
};

function getPermissionMessage(permission: ChatSendPermission, reason?: string): string {
  if (reason) {
    return reason;
  }

  switch (permission) {
    case 'not_member':
    case 'members_only':
      return 'يجب أن تكون عضوا في الغروب لإرسال الرسائل.';
    case 'admins_only':
      return 'الإرسال متاح للمشرفين فقط في هذا الغروب.';
    case 'blocked':
      return 'لا يمكنك إرسال رسائل في هذا الغروب حاليا.';
    case 'unknown':
      return 'يمكنك قراءة الرسائل فقط حاليا.';
    default:
      return 'لا يمكنك إرسال رسائل في هذا الغروب حاليا.';
  }
}

export function ChatPermissionNotice({ permission, reason }: ChatPermissionNoticeProps) {
  return (
    <AppCard variant="muted">
      <Stack gap="xs">
        <AppText variant="title">إرسال الرسائل غير متاح</AppText>
        <AppText color="secondary" variant="bodySmall">
          {getPermissionMessage(permission, reason)}
        </AppText>
      </Stack>
    </AppCard>
  );
}
