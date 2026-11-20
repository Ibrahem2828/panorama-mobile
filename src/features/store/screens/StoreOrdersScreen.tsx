import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { classifyApiError } from '../../../api/errorKind';
import type { StoreOrderSummary } from '../../../api';
import {
  AppButton,
  AppHeader,
  AppScreen,
  AppText,
  BrandRefreshControl,
  EmptyState,
  ErrorState,
  Icon,
  SkeletonList,
} from '../../../components';
import { useTranslation } from '../../../i18n';
import { useNetworkStore } from '../../../offline/networkStore';
import { StoreRoutes } from '../../../navigation/routes';
import type { StoreStackParamList } from '../../../navigation/types';
import { colors, layout, radius, spacing, useBrand } from '../../../theme';
import { isolateLtr } from '../../../utils/rtl';
import { StoreChip } from '../components/StoreChip';
import { StoreStatusBadge } from '../components/StoreStatusBadge';
import {
  STORE_ORDER_STATUSES,
  formatStoreDateTime,
  formatStoreMoney,
  storeStatusPresentation,
} from '../services';
import { useStoreStore } from '../store';

type Props = NativeStackScreenProps<StoreStackParamList, 'StoreOrders'>;

function OrderRow({
  order,
  onPress,
}: {
  order: StoreOrderSummary;
  onPress: (order: StoreOrderSummary) => void;
}) {
  const { t, locale } = useTranslation();
  const brand = useBrand();
  const copy = t.store.orders;
  const when = formatStoreDateTime(order.created_at, locale);
  const status = storeStatusPresentation(order.status, copy.status, t.common.unknown);

  return (
    <Pressable
      accessibilityLabel={`${copy.openOrder(order.code)}، ${status.label}`}
      accessibilityRole="button"
      android_ripple={{ color: brand.primarySoft }}
      onPress={() => onPress(order)}
      style={styles.row}
    >
      <View style={[styles.rowIcon, { backgroundColor: brand.primarySoft }]}>
        <Icon color={brand.primary} name="bag" size={22} />
      </View>
      <View style={styles.rowBody}>
        <View style={styles.rowTop}>
          <AppText variant="subtitle" weight="700">
            {isolateLtr(order.code)}
          </AppText>
          <StoreStatusBadge status={order.status} />
        </View>
        <AppText color="secondary" variant="caption">
          {[when, copy.itemsCount(order.items_count)].filter(Boolean).join(' · ')}
        </AppText>
        <AppText color="brand" variant="bodySmall" weight="700">
          {formatStoreMoney(order.total, order.currency) ?? order.total}
        </AppText>
      </View>
    </Pressable>
  );
}

export function StoreOrdersScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const brand = useBrand();
  const isOnline = useNetworkStore((state) => state.isOnline);
  const orders = useStoreStore((state) => state.orders);
  const count = useStoreStore((state) => state.ordersCount);
  const status = useStoreStore((state) => state.ordersStatus);
  const hasLoaded = useStoreStore((state) => state.hasLoadedOrders);
  const isLoading = useStoreStore((state) => state.isLoadingOrders);
  const isLoadingMore = useStoreStore((state) => state.isLoadingMoreOrders);
  const error = useStoreStore((state) => state.ordersError);
  const nextPage = useStoreStore((state) => state.nextOrdersPage);
  const version = useStoreStore((state) => state.ordersVersion);
  const loadOrders = useStoreStore((state) => state.loadOrders);
  const loadMore = useStoreStore((state) => state.loadMoreOrders);
  const copy = t.store.orders;
  const lastVersion = useRef(version);

  // Comes back into view (or a status push / foreground refresh bumped the version): re-read quietly.
  useFocusEffect(
    useCallback(() => {
      void loadOrders({ silent: useStoreStore.getState().hasLoadedOrders });
    }, [loadOrders]),
  );
  useEffect(() => {
    if (version !== lastVersion.current) {
      lastVersion.current = version;
      void loadOrders({ silent: true });
    }
  }, [loadOrders, version]);

  const filters = useMemo(
    () => [
      { value: '', label: copy.filterAll },
      ...STORE_ORDER_STATUSES.map((value) => ({
        value: value as string,
        label: storeStatusPresentation(value, copy.status, t.common.unknown).label,
      })),
    ],
    [copy, t.common.unknown],
  );

  const open = useCallback(
    (order: StoreOrderSummary) =>
      navigation.navigate(StoreRoutes.StoreOrderDetails, { orderId: order.id }),
    [navigation],
  );

  const header = (
    <View style={styles.header}>
      <AppHeader
        onBack={() => navigation.goBack()}
        showBack
        subtitle={hasLoaded ? copy.total(count) : copy.subtitle}
        title={copy.title}
      />
      <ScrollView
        accessibilityLabel={copy.filterLabel}
        contentContainerStyle={styles.chips}
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        {filters.map((filter) => (
          <StoreChip
            key={filter.value || 'all'}
            label={filter.label}
            onPress={() => void loadOrders({ status: filter.value })}
            selected={status === filter.value}
          />
        ))}
      </ScrollView>
    </View>
  );

  const empty = isLoading ? (
    <SkeletonList />
  ) : error ? (
    <ErrorState
      kind={classifyApiError(error, { deviceOnline: isOnline })}
      onRetry={() => void loadOrders()}
      title={copy.errorTitle}
    />
  ) : status ? (
    <EmptyState message={copy.emptyFilteredMessage} title={copy.emptyFilteredTitle} />
  ) : (
    <EmptyState
      action={
        <AppButton onPress={() => navigation.navigate(StoreRoutes.StoreHome)} title={copy.browse} />
      }
      artwork="store"
      message={copy.emptyMessage}
      title={copy.emptyTitle}
    />
  );

  return (
    <AppScreen horizontalPadding={false}>
      <FlatList
        ItemSeparatorComponent={Separator}
        ListEmptyComponent={empty}
        ListFooterComponent={
          <View style={styles.footer}>
            {isLoadingMore ? <ActivityIndicator color={brand.primary} /> : null}
            {nextPage !== null && !isLoadingMore ? (
              <AppButton
                onPress={() => void loadMore()}
                size="sm"
                title={copy.loadMore}
                variant="outline"
              />
            ) : null}
          </View>
        }
        ListHeaderComponent={header}
        contentContainerStyle={styles.listContent}
        data={error && !hasLoaded ? [] : orders}
        keyExtractor={(order) => String(order.id)}
        onEndReached={() => void loadMore()}
        onEndReachedThreshold={0.4}
        refreshControl={
          <BrandRefreshControl onRefresh={() => void loadOrders()} refreshing={false} />
        }
        renderItem={({ item }) => <OrderRow onPress={open} order={item} />}
      />
    </AppScreen>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  header: { gap: spacing.lg, marginBottom: spacing.lg },
  chips: { gap: spacing.sm },
  listContent: {
    paddingHorizontal: layout.screenHorizontalPadding,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    flexGrow: 1,
  },
  separator: { height: spacing.md },
  footer: { minHeight: spacing.xxl, alignItems: 'center', paddingVertical: spacing.md },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.default,
    backgroundColor: colors.background.surface,
  },
  rowIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  rowBody: { flex: 1, gap: 2 },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
});
