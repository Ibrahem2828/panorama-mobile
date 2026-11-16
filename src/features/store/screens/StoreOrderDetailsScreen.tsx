import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { classifyApiError } from '../../../api/errorKind';
import {
  AppButton,
  AppCard,
  AppHeader,
  AppScreen,
  AppText,
  ErrorState,
  Icon,
  LoadingState,
  useToastStore,
} from '../../../components';
import { useTranslation } from '../../../i18n';
import { useNetworkStore } from '../../../offline/networkStore';
import { StoreRoutes } from '../../../navigation/routes';
import type { StoreStackParamList } from '../../../navigation/types';
import { colors, layout, radius, spacing, useBrand } from '../../../theme';
import { isolateLtr } from '../../../utils/rtl';
import { CancelOrderSheet } from '../components/CancelOrderSheet';
import { OrderProgress } from '../components/OrderProgress';
import { StoreImage } from '../components/StoreImage';
import { StoreStatusBadge } from '../components/StoreStatusBadge';
import {
  canCancelStoreOrder,
  formatStoreDateTime,
  formatStoreMoney,
  formatStoreRounding,
  isStoreOrderActive,
  storeErrorMessage,
  storeStatusPresentation,
  storeTimeline,
} from '../services';
import { useStoreStore } from '../store';

type Props = NativeStackScreenProps<StoreStackParamList, 'StoreOrderDetails'>;

const AUTO_REFRESH_MS = 30_000;

export function StoreOrderDetailsScreen({ navigation, route }: Props) {
  const { t, locale } = useTranslation();
  const brand = useBrand();
  const isOnline = useNetworkStore((state) => state.isOnline);
  const showToast = useToastStore((state) => state.show);
  const { orderId } = route.params;
  const order = useStoreStore((state) => state.orderDetails[String(orderId)]);
  const version = useStoreStore((state) => state.ordersVersion);
  const loadOrder = useStoreStore((state) => state.loadOrder);
  const cancelOrder = useStoreStore((state) => state.cancelOrder);
  const [failed, setFailed] = useState<unknown>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelBusy, setCancelBusy] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const lastVersion = useRef(version);
  const copy = t.store.orders.detail;
  const active = order ? isStoreOrderActive(order.status) : true;

  const refresh = useCallback(
    async (silent: boolean) => {
      const ok = await loadOrder(orderId, { silent });
      if (!ok && !useStoreStore.getState().orderDetails[String(orderId)]) {
        setFailed(useStoreStore.getState().ordersError ?? new Error('failed'));
      } else {
        setFailed(null);
      }
    },
    [loadOrder, orderId],
  );

  // Reads the order when the screen opens or comes back into view, then every half minute while it can still change.
  useFocusEffect(
    useCallback(() => {
      void refresh(!!useStoreStore.getState().orderDetails[String(orderId)]);
      if (!active) return undefined;
      const timer = setInterval(() => void refresh(true), AUTO_REFRESH_MS);

      return () => clearInterval(timer);
    }, [active, orderId, refresh]),
  );

  // A status push or the app returning to the foreground bumps the version: fetch the new state right away.
  useEffect(() => {
    if (version !== lastVersion.current) {
      lastVersion.current = version;
      void refresh(true);
    }
  }, [refresh, version]);

  async function confirmCancel(reason: string) {
    setCancelBusy(true);
    setCancelError(null);
    const result = await cancelOrder(orderId, reason);
    setCancelBusy(false);
    if (result.ok) {
      setCancelOpen(false);
      showToast(copy.cancelled);
    } else {
      setCancelError(storeErrorMessage(result.info, t.store));
      // The shop already moved it on: close the sheet and show the real state.
      if (result.info.kind === 'orderNotCancellable') setCancelOpen(false);
    }
  }

  if (!order) {
    return (
      <AppScreen contentContainerStyle={styles.content} scroll>
        <AppHeader onBack={() => navigation.goBack()} showBack title={copy.title} />
        {failed ? (
          <ErrorState
            kind={classifyApiError(failed, { deviceOnline: isOnline })}
            onRetry={() => void refresh(false)}
            title={copy.errorTitle}
          />
        ) : (
          <LoadingState message={t.common.loading} />
        )}
      </AppScreen>
    );
  }

  const presentation = storeStatusPresentation(
    order.status,
    t.store.orders.status,
    t.common.unknown,
  );
  const rounding = formatStoreRounding(order.rounding_adjustment, order.currency);
  const timeline = storeTimeline(order);

  return (
    <AppScreen horizontalPadding={false}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            colors={[brand.primary]}
            onRefresh={() => {
              setRefreshing(true);
              void refresh(false).finally(() => setRefreshing(false));
            }}
            progressBackgroundColor={colors.background.elevated}
            refreshing={refreshing}
            tintColor={brand.primary}
          />
        }
      >
        <AppHeader
          onBack={() => navigation.goBack()}
          showBack
          subtitle={formatStoreDateTime(order.created_at, locale) ?? undefined}
          title={isolateLtr(order.code)}
        />

        <AppCard variant="elevated">
          <View style={styles.statusBlock}>
            <View style={styles.statusRow}>
              <StoreStatusBadge status={order.status} />
              <AppText color="secondary" variant="caption">
                {order.items_count > 0 ? t.store.orders.itemsCount(order.items_count) : ''}
              </AppText>
            </View>
            {presentation.hint ? (
              <AppText accessibilityLiveRegion="polite" color="secondary" variant="bodySmall">
                {presentation.hint}
              </AppText>
            ) : null}
            <OrderProgress order={order} />
          </View>
        </AppCard>

        {order.status === 'cancelled' ? (
          <View style={styles.cancelBox}>
            <Icon color={colors.semantic.error} name="xCircle" size={20} />
            <View style={styles.cancelText}>
              <AppText color="error" variant="bodySmall" weight="700">
                {order.cancelled_by_customer ? copy.cancelledByYou : copy.cancelledByShop}
              </AppText>
              {order.cancel_reason ? (
                <AppText color="secondary" variant="caption">
                  {`${copy.cancelReason}: ${order.cancel_reason}`}
                </AppText>
              ) : null}
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <AppText accessibilityRole="header" variant="title">
            {copy.items}
          </AppText>
          {order.items.map((item) => {
            const unit = formatStoreMoney(item.unit_price, order.currency) ?? item.unit_price;
            const canRate = order.status === 'picked_up' && item.product !== null;

            return (
              <View key={item.id} style={styles.item}>
                <StoreImage borderRadius={radius.md} style={styles.thumb} uri={item.thumb_url} />
                <View style={styles.itemBody}>
                  <AppText numberOfLines={2} variant="bodySmall" weight="700">
                    {item.name}
                  </AppText>
                  {item.brand_name ? (
                    <AppText color="muted" variant="caption">
                      {item.brand_name}
                    </AppText>
                  ) : null}
                  {item.variant_label ? (
                    <AppText color="secondary" variant="caption">
                      {item.variant_label}
                    </AppText>
                  ) : null}
                  <AppText color="secondary" variant="caption">
                    {copy.unitTimes(unit, item.quantity)}
                  </AppText>
                  {canRate ? (
                    <Pressable
                      accessibilityLabel={copy.rateProduct(item.name)}
                      accessibilityRole="button"
                      onPress={() =>
                        navigation.navigate(StoreRoutes.StoreProduct, {
                          productId: item.product as number,
                          name: item.name,
                        })
                      }
                      style={styles.rate}
                    >
                      <Icon color={brand.primary} name="star" size={16} />
                      <AppText color="brand" variant="caption" weight="700">
                        {copy.rateProduct(item.name)}
                      </AppText>
                    </Pressable>
                  ) : null}
                </View>
                <AppText variant="bodySmall" weight="700">
                  {formatStoreMoney(item.line_total, order.currency) ?? item.line_total}
                </AppText>
              </View>
            );
          })}
        </View>

        {order.status === 'picked_up' ? (
          <View style={[styles.rateCard, { backgroundColor: brand.primarySoft }]}>
            <Icon color={brand.primary} name="star" size={22} />
            <View style={styles.cancelText}>
              <AppText color="brand" variant="bodySmall" weight="700">
                {copy.rateTitle}
              </AppText>
              <AppText color="secondary" variant="caption">
                {copy.rateHint}
              </AppText>
            </View>
          </View>
        ) : null}

        <AppCard variant="outlined">
          <View style={styles.summary}>
            <AppText variant="title">{copy.summary}</AppText>
            <View style={styles.sumRow}>
              <AppText color="secondary" variant="bodySmall">
                {copy.subtotal}
              </AppText>
              <AppText variant="bodySmall" weight="600">
                {formatStoreMoney(order.subtotal, order.currency) ?? order.subtotal}
              </AppText>
            </View>
            {rounding ? (
              <View style={styles.sumRow}>
                <AppText color="secondary" variant="bodySmall">
                  {copy.rounding}
                </AppText>
                <AppText variant="bodySmall" weight="600">
                  {rounding}
                </AppText>
              </View>
            ) : null}
            <View style={[styles.sumRow, styles.grand]}>
              <AppText variant="title">{copy.total}</AppText>
              <AppText color="brand" variant="h3" weight="700">
                {formatStoreMoney(order.total, order.currency) ?? order.total}
              </AppText>
            </View>
            <AppText color="secondary" variant="caption">
              {copy.payment}
            </AppText>
          </View>
        </AppCard>

        {order.notes ? (
          <View style={styles.section}>
            <AppText variant="label" weight="700">
              {copy.notes}
            </AppText>
            <AppText color="secondary" variant="bodySmall">
              {order.notes}
            </AppText>
          </View>
        ) : null}

        <View style={styles.section}>
          <AppText accessibilityRole="header" variant="title">
            {copy.timeline}
          </AppText>
          {timeline.map((entry, index) => {
            const label = storeStatusPresentation(
              entry.new_status,
              t.store.orders.status,
              t.common.unknown,
            ).label;
            const when = formatStoreDateTime(entry.created_at, locale);

            return (
              <View key={`${entry.new_status}-${entry.created_at}`} style={styles.tlRow}>
                <View style={styles.rail}>
                  <View
                    style={[
                      styles.tlDot,
                      { backgroundColor: index === 0 ? brand.primary : colors.border.strong },
                    ]}
                  />
                  {index < timeline.length - 1 ? <View style={styles.tlLine} /> : null}
                </View>
                <View style={styles.tlBody}>
                  <AppText variant="bodySmall" weight={index === 0 ? '700' : '600'}>
                    {!entry.old_status && entry.new_status === 'pending' ? copy.created : label}
                  </AppText>
                  {when ? (
                    <AppText color="muted" variant="caption">
                      {when}
                    </AppText>
                  ) : null}
                  {entry.note ? (
                    <AppText color="secondary" variant="caption">
                      {entry.note}
                    </AppText>
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>

        {canCancelStoreOrder(order) ? (
          <AppButton
            fullWidth
            onPress={() => {
              setCancelError(null);
              setCancelOpen(true);
            }}
            title={copy.cancel}
            variant="dangerOutline"
          />
        ) : null}
      </ScrollView>
      <CancelOrderSheet
        busy={cancelBusy}
        error={cancelError}
        onClose={() => setCancelOpen(false)}
        onConfirm={(reason) => void confirmCancel(reason)}
        visible={cancelOpen}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingHorizontal: layout.screenHorizontalPadding,
    paddingBottom: spacing.xxl,
  },
  statusBlock: { gap: spacing.md },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  cancelBox: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.semantic.errorSoft,
  },
  cancelText: { flex: 1, gap: 2 },
  section: { gap: spacing.md },
  item: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  thumb: { width: 64, height: 64 },
  itemBody: { flex: 1, gap: 2 },
  rate: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 44 },
  rateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
  },
  summary: { gap: spacing.sm },
  sumRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  grand: {
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.default,
  },
  tlRow: { flexDirection: 'row', gap: spacing.md },
  rail: { width: 14, alignItems: 'center' },
  tlDot: { width: 12, height: 12, borderRadius: 6, marginTop: 4 },
  tlLine: { flex: 1, width: 2, marginTop: 2, backgroundColor: colors.border.default },
  tlBody: { flex: 1, gap: 2, paddingBottom: spacing.md },
});
