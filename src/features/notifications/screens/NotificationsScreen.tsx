import { useCallback, useEffect, useMemo, useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { images } from '../../../assets/images';
import {
  AppButton,
  AppCard,
  AppHeader,
  AppScreen,
  AppText,
  ChoiceChips,
  EmptyState,
  ErrorState,
  LoadingState,
  Stack,
} from '../../../components';
import { useTranslation } from '../../../i18n';
import type { ProfileStackParamList } from '../../../navigation/types';
import { layout, spacing, useBrand } from '../../../theme';
import { formatDate } from '../../../utils/formatDateTime';
import {
  NotificationCard,
  NotificationPreferencesCard,
  NotificationsHeaderActions,
} from '../components';
import {
  groupNotificationsByDay,
  isNotificationExpired,
  isNotificationUnread,
  navigateToNotificationIntent,
  resolveNotificationIntent,
} from '../services';
import { useNotificationsStore } from '../store';
import type { NotificationDay, NotificationListRow, NotificationRecord } from '../types';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Notifications'>;
type Filter = 'all' | 'unread';

function keyExtractor(row: NotificationListRow) {
  return row.key;
}

function Separator() {
  return <View style={styles.separator} />;
}

export function NotificationsScreen({ navigation }: Props) {
  const { t, locale } = useTranslation();
  const brand = useBrand();
  const [filter, setFilter] = useState<Filter>('all');
  const [showExpired, setShowExpired] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const notifications = useNotificationsStore((state) => state.notifications);
  const unreadCount = useNotificationsStore((state) => state.unreadCount);
  const nextPage = useNotificationsStore((state) => state.nextPage);
  const isLoading = useNotificationsStore((state) => state.isLoading);
  const isLoadingMore = useNotificationsStore((state) => state.isLoadingMore);
  const isRefreshing = useNotificationsStore((state) => state.isRefreshing);
  const isMarkingAllRead = useNotificationsStore((state) => state.isMarkingAllRead);
  const errorMessage = useNotificationsStore((state) => state.errorMessage);
  const loadMoreError = useNotificationsStore((state) => state.loadMoreErrorMessage);
  const successMessage = useNotificationsStore((state) => state.successMessage);
  const loadNotifications = useNotificationsStore((state) => state.loadNotifications);
  const loadUnreadCount = useNotificationsStore((state) => state.loadUnreadCount);
  const refreshNotifications = useNotificationsStore((state) => state.refreshNotifications);
  const loadMore = useNotificationsStore((state) => state.loadMore);
  const markAsRead = useNotificationsStore((state) => state.markAsRead);
  const markAllAsRead = useNotificationsStore((state) => state.markAllAsRead);

  useEffect(() => {
    void loadNotifications();
    void loadUnreadCount();
  }, [loadNotifications, loadUnreadCount]);

  const expiredCount = useMemo(
    () => notifications.filter((item) => isNotificationExpired(item)).length,
    [notifications],
  );
  const rows = useMemo(() => {
    const visible = notifications.filter(
      (item) =>
        (showExpired || !isNotificationExpired(item)) &&
        (filter === 'all' || isNotificationUnread(item)),
    );

    return groupNotificationsByDay(visible);
  }, [filter, notifications, showExpired]);

  const handleOpen = useCallback(
    (notification: NotificationRecord) => {
      setHint(null);

      if (isNotificationUnread(notification)) {
        void markAsRead(notification.id);
      }

      // An expired notification stays readable but its destination is no longer offered.
      if (isNotificationExpired(notification)) {
        setHint(t.notifications.expiredNotice);
        return;
      }

      const intent = resolveNotificationIntent(notification);

      if (intent.kind === 'notifications') {
        return;
      }

      if (!navigateToNotificationIntent(intent)) {
        setHint(
          intent.kind === 'verification'
            ? t.notifications.routeMessages.verification
            : t.notifications.routeMessages.none,
        );
      }
    },
    [markAsRead, t],
  );
  const handleRefresh = useCallback(() => {
    setHint(null);
    void refreshNotifications();
  }, [refreshNotifications]);
  const handleEndReached = useCallback(() => void loadMore(), [loadMore]);

  const dayLabel = useCallback(
    (day: NotificationDay) => {
      switch (day.type) {
        case 'today':
          return t.notifications.dayToday;
        case 'yesterday':
          return t.notifications.dayYesterday;
        case 'date':
          return (
            formatDate(`${day.iso}T12:00:00`, locale, {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            }) ?? day.iso
          );
        default:
          return t.notifications.dayUnknown;
      }
    },
    [locale, t],
  );
  const renderItem = useCallback(
    ({ item }: { item: NotificationListRow }) =>
      item.kind === 'header' ? (
        <AppText color="muted" style={styles.dayHeader} variant="label" weight="700">
          {dayLabel(item.day)}
        </AppText>
      ) : (
        <NotificationCard notification={item.notification} onPress={handleOpen} />
      ),
    [dayLabel, handleOpen],
  );
  const filterOptions = useMemo(
    () => [
      { value: 'all' as Filter, label: t.notifications.filterAll },
      { value: 'unread' as Filter, label: t.notifications.filterUnread },
    ],
    [t],
  );

  const header = (
    <Stack gap="lg" style={styles.header}>
      <AppHeader subtitle={t.notifications.subtitle} title={t.notifications.title} />
      <AppButton onPress={() => navigation.goBack()} title={t.common.back} variant="ghost" />
      <NotificationsHeaderActions
        isMarkingAllRead={isMarkingAllRead}
        isRefreshing={isRefreshing}
        onMarkAllRead={() => void markAllAsRead()}
        onRefresh={handleRefresh}
        unreadCount={unreadCount}
      />
      <ChoiceChips
        label={t.notifications.filterLabel}
        onChange={setFilter}
        options={filterOptions}
        value={filter}
      />
      {successMessage ? (
        <AppCard variant="muted">
          <AppText color="success" variant="bodySmall">
            {successMessage}
          </AppText>
        </AppCard>
      ) : null}
      {hint ? (
        <AppCard variant="muted">
          <AppText color="secondary" variant="bodySmall">
            {hint}
          </AppText>
        </AppCard>
      ) : null}
      {errorMessage && notifications.length > 0 ? (
        <ErrorState message={errorMessage} onRetry={handleRefresh} />
      ) : null}
      {expiredCount > 0 ? (
        <Stack align="center" direction="horizontal" gap="sm" justify="space-between">
          <AppText color="muted" style={styles.expiredText} variant="caption">
            {showExpired ? '' : t.notifications.expiredHidden(expiredCount)}
          </AppText>
          <AppButton
            onPress={() => setShowExpired((value) => !value)}
            size="sm"
            title={showExpired ? t.notifications.hideExpired : t.notifications.showExpired}
            variant="ghost"
          />
        </Stack>
      ) : null}
    </Stack>
  );

  if (isLoading && notifications.length === 0) {
    return (
      <AppScreen contentContainerStyle={styles.centerContent} scroll>
        {header}
        <LoadingState message={t.notifications.loading} />
      </AppScreen>
    );
  }

  if (errorMessage && notifications.length === 0) {
    return (
      <AppScreen contentContainerStyle={styles.centerContent} scroll>
        {header}
        <ErrorState message={errorMessage} onRetry={handleRefresh} />
      </AppScreen>
    );
  }

  return (
    <AppScreen horizontalPadding={false}>
      <FlatList
        ItemSeparatorComponent={Separator}
        ListEmptyComponent={
          filter === 'unread' && notifications.length > 0 ? (
            <EmptyState
              message={t.notifications.unreadEmptyMessage}
              title={t.notifications.unreadEmptyTitle}
            />
          ) : (
            <EmptyState
              action={
                <AppButton onPress={handleRefresh} title={t.common.refresh} variant="outline" />
              }
              illustrationLabel={t.notifications.emptyIllustrationAlt}
              illustrationSource={images.emptyStates.notifications}
              message={t.notifications.emptyMessage}
              title={t.notifications.emptyTitle}
            />
          )
        }
        ListFooterComponent={
          <Stack gap="lg" style={styles.footer}>
            {isLoadingMore ? <ActivityIndicator color={brand.primary} /> : null}
            {loadMoreError ? (
              <Stack align="center" gap="sm">
                <AppText align="center" color="error" variant="bodySmall">
                  {loadMoreError}
                </AppText>
                <AppButton
                  onPress={handleEndReached}
                  size="sm"
                  title={t.common.retry}
                  variant="outline"
                />
              </Stack>
            ) : null}
            {!isLoadingMore && !loadMoreError && nextPage !== null ? (
              <AppButton
                onPress={handleEndReached}
                size="sm"
                title={t.notifications.loadMore}
                variant="outline"
              />
            ) : null}
            <NotificationPreferencesCard />
          </Stack>
        }
        ListHeaderComponent={header}
        contentContainerStyle={styles.listContent}
        data={rows}
        initialNumToRender={10}
        keyExtractor={keyExtractor}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            colors={[brand.primary]}
            onRefresh={handleRefresh}
            refreshing={isRefreshing}
            tintColor={brand.primary}
          />
        }
        removeClippedSubviews
        renderItem={renderItem}
        windowSize={7}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  centerContent: { gap: spacing.xl },
  header: { marginBottom: spacing.lg },
  listContent: {
    paddingHorizontal: layout.screenHorizontalPadding,
    paddingTop: layout.screenVerticalPadding,
    paddingBottom: layout.screenVerticalPadding,
    flexGrow: 1,
  },
  separator: { height: spacing.sm },
  dayHeader: { paddingTop: spacing.md },
  expiredText: { flex: 1 },
  footer: { paddingVertical: spacing.lg, alignItems: 'stretch' },
});
