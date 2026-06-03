import { AppBadge, AppButton, AppCard, AppText, Stack } from '../../../components';

type NotificationsHeaderActionsProps = {
  unreadCount: number;
  isRefreshing?: boolean;
  isMarkingAllRead?: boolean;
  onRefresh: () => void;
  onMarkAllRead: () => void;
};

export function NotificationsHeaderActions({
  unreadCount,
  isRefreshing = false,
  isMarkingAllRead = false,
  onRefresh,
  onMarkAllRead,
}: NotificationsHeaderActionsProps) {
  return (
    <AppCard variant="muted">
      <Stack gap="md">
        <Stack direction="horizontal" gap="md" wrap>
          <Stack gap="xs" style={{ flex: 1, minWidth: 0 }}>
            <AppText variant="title">مركز الإشعارات</AppText>
            <AppText color="secondary" variant="bodySmall">
              {unreadCount > 0
                ? 'لديك إشعارات غير مقروءة تحتاج متابعة.'
                : 'كل الإشعارات الحالية مقروءة.'}
            </AppText>
          </Stack>
          <AppBadge
            label={unreadCount > 0 ? `${unreadCount} غير مقروء` : 'لا جديد'}
            size="md"
            variant={unreadCount > 0 ? 'warning' : 'success'}
          />
        </Stack>

        <Stack direction="horizontal" gap="md" wrap>
          <AppButton
            loading={isRefreshing}
            onPress={onRefresh}
            size="sm"
            title="تحديث"
            variant="outline"
          />
          {unreadCount > 0 ? (
            <AppButton
              loading={isMarkingAllRead}
              onPress={onMarkAllRead}
              size="sm"
              title="تعليم الكل كمقروء"
              variant="primary"
            />
          ) : null}
        </Stack>
      </Stack>
    </AppCard>
  );
}
