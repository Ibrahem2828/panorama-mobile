import { useCallback, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Alert, RefreshControl, ScrollView, StyleSheet } from 'react-native';

import {
  AppBadge,
  AppButton,
  AppCard,
  AppHeader,
  AppScreen,
  AppText,
  ErrorState,
  LoadingState,
  SectionHeader,
  Stack,
} from '../../../components';
import { useTranslation } from '../../../i18n';
import { PrintingRoutes } from '../../../navigation/routes';
import type { PrintingStackParamList } from '../../../navigation/types';
import { colors, layout, spacing, useBrand } from '../../../theme';
import {
  PrintOrderPreview,
  PrintOrderStatusBadge,
  PrintOrderStatusIcon,
  PrintStatusProgress,
  PrintStatusTimeline,
  usePrintOptionLabels,
} from '../components';
import {
  canCancelPrintOrder,
  formatPrintMoney,
  formatPrintOrderDate,
  formatPrintOrderDateTime,
  formatPrintOrderPrice,
  getPrintOrderCopiesCount,
  getPrintOrderItemFileLabel,
  getPrintOrderItemsCount,
  getPrintOrderStatusPresentation,
  isPrintOrderActive,
} from '../services';
import { usePrintingStore } from '../store';
import type { PrintOrder, PrintOrderItem } from '../types';

type Props = NativeStackScreenProps<PrintingStackParamList, 'PrintOrderDetails'>;

const AUTO_REFRESH_MS = 30_000;

function isSameId(left: string | number, right: string | number): boolean {
  return String(left) === String(right);
}

export function PrintOrderDetailsScreen({ navigation, route }: Props) {
  const { t, locale } = useTranslation();
  const brand = useBrand();
  const labels = usePrintOptionLabels();
  const { orderId } = route.params;
  const orders = usePrintingStore((state) => state.orders);
  const selectedOrder = usePrintingStore((state) => state.selectedOrder);
  const isLoadingDetail = usePrintingStore((state) => state.isLoadingDetail);
  const isCancelling = usePrintingStore((state) => state.isCancelling);
  const detailError = usePrintingStore((state) => state.detailError);
  const successMessage = usePrintingStore((state) => state.successMessage);
  const loadOrderDetail = usePrintingStore((state) => state.loadOrderDetail);
  const cancelOrder = usePrintingStore((state) => state.cancelOrder);
  const clearMessages = usePrintingStore((state) => state.clearMessages);
  const cachedOrder = orders.find((order) => isSameId(order.id, orderId)) ?? null;
  const activeOrder: PrintOrder | null =
    selectedOrder && isSameId(selectedOrder.id, orderId) ? selectedOrder : cachedOrder;
  const isActive = activeOrder ? isPrintOrderActive(activeOrder.status) : false;

  useEffect(() => {
    clearMessages();
    void loadOrderDetail(orderId);
  }, [clearMessages, loadOrderDetail, orderId]);

  // While the order can still change, keep it fresh quietly in the background.
  useFocusEffect(
    useCallback(() => {
      if (!isActive) {
        return undefined;
      }

      const timer = setInterval(
        () => void loadOrderDetail(orderId, { silent: true }),
        AUTO_REFRESH_MS,
      );

      return () => clearInterval(timer);
    }, [isActive, loadOrderDetail, orderId]),
  );

  const handleRefresh = useCallback(
    () => void loadOrderDetail(orderId),
    [loadOrderDetail, orderId],
  );

  function handleCancel() {
    Alert.alert(t.printing.details.cancelConfirmTitle, t.printing.details.cancelConfirmMessage, [
      { text: t.printing.details.cancelKeep, style: 'cancel' },
      {
        text: t.printing.details.cancelConfirm,
        style: 'destructive',
        onPress: () => void cancelOrder(orderId),
      },
    ]);
  }

  function handleViewItem(item: PrintOrderItem) {
    if (item.id === undefined) {
      return;
    }

    navigation.navigate(PrintingRoutes.PrintItemViewer, {
      itemId: item.id,
      title: getPrintOrderItemFileLabel(item, t.printing),
    });
  }

  if (!activeOrder) {
    return (
      <AppScreen contentContainerStyle={styles.content} scroll>
        <Stack gap="md">
          <AppHeader subtitle={t.printing.details.subtitle} title={t.printing.title} />
        </Stack>
        {detailError ? (
          <ErrorState
            message={detailError}
            onRetry={handleRefresh}
            title={t.printing.details.unavailableTitle}
          />
        ) : (
          <LoadingState message={t.printing.details.loading} />
        )}
      </AppScreen>
    );
  }

  const presentation = getPrintOrderStatusPresentation(
    activeOrder.status,
    t.printing,
    t.common.unknown,
  );
  const price = formatPrintOrderPrice(activeOrder);
  const date = formatPrintOrderDate(activeOrder.created_at, locale);
  const pickup = activeOrder.pickup_location_detail;
  const extraRows = [
    [t.printing.details.completedAt, formatPrintOrderDateTime(activeOrder.completed_at, locale)],
    [t.printing.details.cancelledAt, formatPrintOrderDateTime(activeOrder.cancelled_at, locale)],
    [t.printing.details.updatedAt, formatPrintOrderDateTime(activeOrder.updated_at, locale)],
  ].filter((row): row is [string, string] => row[1] !== null);

  return (
    <AppScreen horizontalPadding={false}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            colors={[brand.primary]}
            progressBackgroundColor={colors.background.elevated}
            onRefresh={handleRefresh}
            refreshing={isLoadingDetail}
            tintColor={brand.primary}
          />
        }
      >
        <Stack gap="xl">
          <Stack gap="md">
            <AppHeader
              subtitle={t.printing.details.subtitle}
              title={t.printing.order.fallbackTitle(String(activeOrder.id))}
            />
          </Stack>

          <AppCard variant="elevated">
            <Stack gap="md">
              <Stack align="center" direction="horizontal" gap="md">
                <PrintOrderStatusIcon size="md" status={activeOrder.status} />
                <Stack gap="xs" style={styles.statusText}>
                  <AppText color="brand" variant="title">
                    {presentation.actionMessage}
                  </AppText>
                  <AppText color="muted" variant="caption">
                    {date ?? t.printing.details.noDate}
                  </AppText>
                </Stack>
                <PrintOrderStatusBadge status={activeOrder.status} />
              </Stack>
              <PrintStatusProgress order={activeOrder} />
              <AppText color="secondary" variant="bodySmall">
                {t.printing.summaryCard.filesAndCopies(
                  getPrintOrderItemsCount(activeOrder),
                  getPrintOrderCopiesCount(activeOrder),
                )}
              </AppText>
              {price ? (
                <AppText color="brand" variant="h3">
                  {price}
                </AppText>
              ) : null}
              {isActive ? (
                <AppText color="muted" variant="caption">
                  {t.printing.details.autoRefresh}
                </AppText>
              ) : null}
            </Stack>
          </AppCard>

          {successMessage ? (
            <AppCard variant="muted">
              <AppText color="success" variant="bodySmall">
                {successMessage}
              </AppText>
            </AppCard>
          ) : null}
          {detailError ? <ErrorState message={detailError} onRetry={handleRefresh} /> : null}

          {activeOrder.rejected_reason ? (
            <AppCard variant="muted">
              <Stack gap="xs">
                <AppText color="error" variant="bodySmall" weight="700">
                  {t.printing.details.rejectionReason}
                </AppText>
                <AppText color="secondary" variant="bodySmall">
                  {activeOrder.rejected_reason}
                </AppText>
              </Stack>
            </AppCard>
          ) : null}

          {pickup ? (
            <AppCard variant={activeOrder.status === 'ready' ? 'outlined' : 'default'}>
              <Stack gap="xs">
                {activeOrder.status === 'ready' ? (
                  <AppText color="brand" variant="bodySmall" weight="700">
                    {t.printing.details.pickupReady}
                  </AppText>
                ) : (
                  <AppText color="muted" variant="caption">
                    {t.printing.details.pickupTitle}
                  </AppText>
                )}
                <AppText variant="bodySmall" weight="600">
                  {pickup.name}
                </AppText>
                {pickup.address ? (
                  <AppText color="secondary" variant="caption">
                    {pickup.address}
                  </AppText>
                ) : null}
                {pickup.instructions ? (
                  <AppText color="muted" variant="caption">
                    {`${t.printing.details.pickupInstructions}: ${pickup.instructions}`}
                  </AppText>
                ) : null}
              </Stack>
            </AppCard>
          ) : null}

          <Stack gap="md">
            <SectionHeader
              subtitle={t.printing.details.itemsSubtitle}
              title={t.printing.details.itemsTitle}
            />
            {activeOrder.items.length === 0 ? (
              <AppCard variant="muted">
                <AppText color="secondary" variant="bodySmall">
                  {t.printing.details.noItems}
                </AppText>
              </AppCard>
            ) : (
              activeOrder.items.map((item, index) => {
                const itemPrice = formatPrintMoney(item.price, activeOrder.currency);
                const fileLabel = getPrintOrderItemFileLabel(item, t.printing);

                return (
                  <AppCard key={String(item.id ?? index)} variant="default">
                    <Stack gap="sm">
                      <AppText variant="bodySmall" weight="700">
                        {fileLabel}
                      </AppText>
                      <AppText color="secondary" variant="caption">
                        {`${t.printing.order.copies(item.copies)}${
                          item.pages_count ? t.printing.order.pages(item.pages_count) : ''
                        }`}
                      </AppText>
                      <PrintOrderPreview
                        item={{
                          paperSize: item.paper_size ?? 'A4',
                          colorMode: item.color_mode ?? 'black_white',
                          sides: item.sides ?? 'one_sided',
                          binding: item.binding ?? 'none',
                          copies: item.copies,
                        }}
                        pages={item.pages_count}
                      />
                      <Stack direction="horizontal" gap="xs" wrap>
                        {(
                          [item.color_mode, item.paper_size, item.sides, item.binding] as Array<
                            string | undefined
                          >
                        )
                          .filter((value): value is string => Boolean(value))
                          .map((value) => (
                            <AppBadge
                              key={value}
                              label={labels[value] ?? value}
                              variant="neutral"
                            />
                          ))}
                      </Stack>
                      {itemPrice ? (
                        <AppText color="brand" variant="caption" weight="600">
                          {`${t.printing.details.itemPrice}: ${itemPrice}`}
                        </AppText>
                      ) : null}
                      {item.id !== undefined ? (
                        <AppButton
                          accessibilityLabel={t.printing.details.viewFileLabel(fileLabel)}
                          onPress={() => handleViewItem(item)}
                          size="sm"
                          title={t.printing.details.viewFile}
                          variant="outline"
                        />
                      ) : null}
                    </Stack>
                  </AppCard>
                );
              })
            )}
          </Stack>

          {activeOrder.user_notes ? (
            <AppCard variant="muted">
              <Stack gap="xs">
                <AppText variant="bodySmall" weight="700">
                  {t.printing.details.notesTitle}
                </AppText>
                <AppText color="secondary" variant="bodySmall">
                  {activeOrder.user_notes}
                </AppText>
              </Stack>
            </AppCard>
          ) : null}

          <Stack gap="md">
            <SectionHeader title={t.printing.details.timelineTitle} />
            <PrintStatusTimeline order={activeOrder} />
          </Stack>

          {extraRows.length > 0 ? (
            <AppCard variant="muted">
              <Stack gap="sm">
                <AppText variant="bodySmall" weight="700">
                  {t.printing.details.extraTitle}
                </AppText>
                {extraRows.map(([label, value]) => (
                  <Stack direction="horizontal" gap="md" justify="space-between" key={label}>
                    <AppText color="muted" variant="caption">
                      {label}
                    </AppText>
                    <AppText variant="caption">{value}</AppText>
                  </Stack>
                ))}
              </Stack>
            </AppCard>
          ) : null}

          {canCancelPrintOrder(activeOrder) ? (
            <AppButton
              loading={isCancelling}
              onPress={handleCancel}
              title={t.printing.details.cancel}
              variant="danger"
            />
          ) : null}
        </Stack>
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.xl },
  scrollContent: {
    paddingHorizontal: layout.screenHorizontalPadding,
    paddingTop: layout.screenVerticalPadding,
    paddingBottom: layout.screenVerticalPadding,
  },
  statusText: { flex: 1, minWidth: 0 },
});
