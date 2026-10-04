import { AppBadge, AppButton, AppCard, AppText, Stack } from '../../../components';
import { useTranslation } from '../../../i18n';

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
  const { t } = useTranslation();
  return (
    <AppCard variant="muted">
      <Stack gap="md">
        <Stack direction="horizontal" gap="md" wrap>
          <Stack gap="xs" style={{ flex: 1, minWidth: 0 }}>
            <AppText variant="title">{t.notifications.centerTitle}</AppText>
            <AppText color="secondary" variant="bodySmall">
              {unreadCount > 0 ? t.notifications.hasUnread : t.notifications.allRead}
            </AppText>
          </Stack>
          <AppBadge
            label={
              unreadCount > 0 ? t.notifications.unreadBadge(unreadCount) : t.notifications.noNew
            }
            size="md"
            variant={unreadCount > 0 ? 'warning' : 'success'}
          />
        </Stack>

        <Stack direction="horizontal" gap="md" wrap>
          <AppButton
            loading={isRefreshing}
            onPress={onRefresh}
            size="sm"
            title={t.common.refresh}
            variant="outline"
          />
          {unreadCount > 0 ? (
            <AppButton
              loading={isMarkingAllRead}
              onPress={onMarkAllRead}
              size="sm"
              title={t.notifications.markAllRead}
              variant="primary"
            />
          ) : null}
        </Stack>
      </Stack>
    </AppCard>
  );
}
