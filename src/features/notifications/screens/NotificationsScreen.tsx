import { useEffect, useState } from 'react';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet } from 'react-native';

import { images } from '../../../assets/images';
import {
  AppButton,
  AppCard,
  AppHeader,
  AppScreen,
  AppText,
  EmptyState,
  ErrorState,
  LoadingState,
  Stack,
} from '../../../components';
import {
  GroupsRoutes,
  PrintingRoutes,
  ProfileRoutes,
  SharedRoutes,
  TabRoutes,
} from '../../../navigation/routes';
import type { AppTabsParamList, ProfileStackParamList } from '../../../navigation/types';
import { spacing } from '../../../theme';
import { NotificationCard, NotificationsHeaderActions } from '../components';
import {
  getNotificationTarget,
  isNotificationUnread,
  resolveNotificationRouteIntent,
} from '../services';
import { useNotificationsStore } from '../store';
import type { NotificationRecord, NotificationRouteIntent } from '../types';

type NotificationsScreenProps = NativeStackScreenProps<ProfileStackParamList, 'Notifications'>;
type AppTabsNavigation = BottomTabNavigationProp<AppTabsParamList>;

function getRouteMessage(intent: NotificationRouteIntent): string | null {
  switch (intent.kind) {
    case 'future':
      return `تم فتح الإشعار. توجيه ${intent.label} سيكتمل في مرحلة لاحقة.`;
    case 'verification':
      return 'تم فتح الإشعار. توجيه التوثيق محفوظ كأساس وسيكتمل حسب قواعد الوصول.';
    case 'none':
      return 'تم فتح الإشعار بدون وجهة مرتبطة.';
    default:
      return null;
  }
}

export function NotificationsScreen({ navigation }: NotificationsScreenProps) {
  const [routeMessage, setRouteMessage] = useState<string | null>(null);
  const tabNavigation = navigation.getParent<AppTabsNavigation>();
  const notifications = useNotificationsStore((state) => state.notifications);
  const unreadCount = useNotificationsStore((state) => state.unreadCount);
  const isLoading = useNotificationsStore((state) => state.isLoading);
  const isLoadingUnreadCount = useNotificationsStore((state) => state.isLoadingUnreadCount);
  const isRefreshing = useNotificationsStore((state) => state.isRefreshing);
  const isMarkingAllRead = useNotificationsStore((state) => state.isMarkingAllRead);
  const errorMessage = useNotificationsStore((state) => state.errorMessage);
  const successMessage = useNotificationsStore((state) => state.successMessage);
  const lastLoadedAt = useNotificationsStore((state) => state.lastLoadedAt);
  const loadNotifications = useNotificationsStore((state) => state.loadNotifications);
  const loadUnreadCount = useNotificationsStore((state) => state.loadUnreadCount);
  const refreshNotifications = useNotificationsStore((state) => state.refreshNotifications);
  const markAsRead = useNotificationsStore((state) => state.markAsRead);
  const markAllAsRead = useNotificationsStore((state) => state.markAllAsRead);

  useEffect(() => {
    void loadNotifications();
    void loadUnreadCount();
  }, [loadNotifications, loadUnreadCount]);

  function navigateFromIntent(intent: NotificationRouteIntent) {
    switch (intent.kind) {
      case 'printingOrder':
        tabNavigation?.navigate(TabRoutes.Printing, {
          screen: PrintingRoutes.PrintOrderDetails,
          params: { orderId: intent.orderId },
        });
        break;
      case 'group':
        tabNavigation?.navigate(TabRoutes.Groups, {
          screen: GroupsRoutes.GroupDetails,
          params: { groupId: intent.groupId },
        });
        break;
      case 'file':
        tabNavigation?.navigate(TabRoutes.Home, {
          screen: SharedRoutes.FileDetails,
          params: { fileId: intent.fileId },
        });
        break;
      case 'supportTicket':
        tabNavigation?.navigate(TabRoutes.Profile, {
          screen: ProfileRoutes.TicketDetails,
          params: { ticketId: intent.ticketId },
        });
        break;
      case 'verification':
        setRouteMessage(getRouteMessage(intent));
        break;
      case 'future':
      case 'none':
        setRouteMessage(getRouteMessage(intent));
        break;
    }
  }

  async function handleNotificationPress(notification: NotificationRecord) {
    setRouteMessage(null);

    if (isNotificationUnread(notification)) {
      await markAsRead(notification.id);
    }

    const target = getNotificationTarget(notification);
    const intent = resolveNotificationRouteIntent(target);

    navigateFromIntent(intent);
  }

  function handleRefresh() {
    setRouteMessage(null);
    void refreshNotifications();
  }

  function handleMarkAllRead() {
    setRouteMessage(null);
    void markAllAsRead();
  }

  const showInitialLoading = isLoading && notifications.length === 0;

  return (
    <AppScreen contentContainerStyle={styles.content} scroll>
      <Stack gap="xl">
        <Stack gap="md">
          <AppHeader subtitle="مركز الإشعارات داخل التطبيق" title="الإشعارات" />
          <AppButton onPress={() => navigation.goBack()} title="رجوع" variant="ghost" />
        </Stack>

        <NotificationsHeaderActions
          isMarkingAllRead={isMarkingAllRead}
          isRefreshing={isRefreshing || isLoadingUnreadCount}
          onMarkAllRead={handleMarkAllRead}
          onRefresh={handleRefresh}
          unreadCount={unreadCount}
        />

        {successMessage ? (
          <AppCard variant="muted">
            <AppText color="success" variant="bodySmall">
              {successMessage}
            </AppText>
          </AppCard>
        ) : null}

        {routeMessage ? (
          <AppCard variant="muted">
            <AppText color="secondary" variant="bodySmall">
              {routeMessage}
            </AppText>
          </AppCard>
        ) : null}

        {errorMessage ? <ErrorState message={errorMessage} onRetry={handleRefresh} /> : null}

        {showInitialLoading ? (
          <LoadingState message="جاري تحميل الإشعارات..." />
        ) : notifications.length > 0 ? (
          <Stack gap="md">
            {notifications.map((notification) => (
              <NotificationCard
                key={String(notification.id)}
                notification={notification}
                onPress={() => {
                  void handleNotificationPress(notification);
                }}
              />
            ))}
          </Stack>
        ) : (
          <EmptyState
            action={
              <AppButton
                loading={isRefreshing}
                onPress={handleRefresh}
                title="إعادة التحقق"
                variant="outline"
              />
            }
            message="ستظهر هنا تحديثات التوثيق والمجموعات والملفات وطلبات الطباعة عند توفرها."
            title="لا توجد إشعارات حاليا"
            illustrationLabel="رسم يوضح عدم وجود إشعارات"
            illustrationSource={images.emptyStates.notifications}
          />
        )}

        {lastLoadedAt ? (
          <AppText align="center" color="muted" variant="caption">
            آخر تحديث: {new Date(lastLoadedAt).toLocaleTimeString('ar-SY')}
          </AppText>
        ) : null}

        <AppText color="muted" variant="caption">
          هذه شاشة إشعارات داخل التطبيق فقط. لا يتم طلب صلاحيات Push ولا تسجيل device tokens في هذه
          المرحلة.
        </AppText>
      </Stack>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
  },
});
