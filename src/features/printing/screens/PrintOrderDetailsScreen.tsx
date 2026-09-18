import { useEffect } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet } from 'react-native';

import {
  AppButton,
  AppCard,
  AppHeader,
  AppScreen,
  AppText,
  ErrorState,
  Illustration,
  LoadingState,
  SectionHeader,
  Stack,
} from '../../../components';
import { useTranslation } from '../../../i18n';
import type { PrintingStackParamList } from '../../../navigation/types';
import { spacing } from '../../../theme';
import {
  PrintOrderStatusBadge,
  getPrintOrderStatusImage,
  PrintOrderSummaryCard,
  PrintingFutureOptionsCard,
} from '../components';
import {
  canCancelPrintOrder,
  formatPrintOrderDate,
  getPrintOrderDisplayTitle,
  getPrintOrderItemFileLabel,
  getPrintOrderStatusPresentation,
} from '../services';
import { usePrintingStore } from '../store';

type PrintOrderDetailsScreenProps = NativeStackScreenProps<
  PrintingStackParamList,
  'PrintOrderDetails'
>;

function isSameId(left: string | number, right: string | number): boolean {
  return String(left) === String(right);
}

export function PrintOrderDetailsScreen({ navigation, route }: PrintOrderDetailsScreenProps) {
  const { t, locale } = useTranslation();
  const { orderId } = route.params;
  const orders = usePrintingStore((state) => state.orders);
  const selectedOrder = usePrintingStore((state) => state.selectedOrder);
  const isLoadingDetail = usePrintingStore((state) => state.isLoadingDetail);
  const isCancelling = usePrintingStore((state) => state.isCancelling);
  const errorMessage = usePrintingStore((state) => state.errorMessage);
  const successMessage = usePrintingStore((state) => state.successMessage);
  const loadOrderDetail = usePrintingStore((state) => state.loadOrderDetail);
  const cancelOrder = usePrintingStore((state) => state.cancelOrder);
  const cachedOrder = orders.find((order) => isSameId(order.id, orderId)) ?? null;
  const activeOrder =
    selectedOrder && isSameId(selectedOrder.id, orderId) ? selectedOrder : cachedOrder;
  const statusPresentation = activeOrder
    ? getPrintOrderStatusPresentation(activeOrder.status, t.printing, t.common.unknown)
    : null;

  useEffect(() => {
    void loadOrderDetail(orderId);
  }, [loadOrderDetail, orderId]);

  function handleCancel() {
    void cancelOrder(orderId);
  }

  if (isLoadingDetail && !activeOrder) {
    return (
      <AppScreen contentContainerStyle={styles.content} scroll>
        <AppHeader subtitle={t.printing.details.subtitle} title={t.printing.title} />
        <LoadingState message={t.printing.details.loading} />
      </AppScreen>
    );
  }

  if (!activeOrder) {
    return (
      <AppScreen contentContainerStyle={styles.content} scroll>
        <Stack gap="lg">
          <AppHeader subtitle={t.printing.details.subtitle} title={t.printing.title} />
          <AppButton onPress={() => navigation.goBack()} title={t.common.back} variant="ghost" />
          <ErrorState
            message={errorMessage ?? t.printing.details.unavailableMessage}
            onRetry={() => loadOrderDetail(orderId)}
            title={t.printing.details.unavailableTitle}
          />
        </Stack>
      </AppScreen>
    );
  }

  return (
    <AppScreen contentContainerStyle={styles.content} scroll>
      <Stack gap="xl">
        <Stack gap="md">
          <AppHeader
            subtitle={t.printing.details.subtitle}
            title={getPrintOrderDisplayTitle(activeOrder, t.printing)}
          />
          <AppButton onPress={() => navigation.goBack()} title={t.common.back} variant="ghost" />
        </Stack>

        <AppCard variant="elevated">
          <Stack gap="md">
            <Illustration
              accessibilityLabel={t.printing.details.statusIllustrationAlt}
              size="lg"
              source={getPrintOrderStatusImage(activeOrder.status)}
            />
            <Stack direction="horizontal" gap="md" style={styles.header}>
              <Stack gap="xs" style={styles.titleBlock}>
                <AppText variant="title">
                  {getPrintOrderDisplayTitle(activeOrder, t.printing)}
                </AppText>
                {statusPresentation ? (
                  <AppText color="brand" variant="bodySmall" weight="600">
                    {statusPresentation.actionMessage}
                  </AppText>
                ) : null}
                <AppText color="secondary" variant="bodySmall">
                  {formatPrintOrderDate(activeOrder.created_at, locale) ??
                    t.printing.details.noDate}
                </AppText>
              </Stack>
              <PrintOrderStatusBadge status={activeOrder.status} />
            </Stack>
          </Stack>
        </AppCard>

        {successMessage ? (
          <AppCard variant="muted">
            <AppText color="success" variant="bodySmall">
              {successMessage}
            </AppText>
          </AppCard>
        ) : null}
        {errorMessage ? (
          <ErrorState message={errorMessage} onRetry={() => loadOrderDetail(orderId)} />
        ) : null}

        <PrintOrderSummaryCard order={activeOrder} />

        {activeOrder.completed_at || activeOrder.cancelled_at || activeOrder.updated_at ? (
          <AppCard variant="muted">
            <Stack gap="sm">
              <AppText variant="title">{t.printing.details.extraTitle}</AppText>
              {activeOrder.completed_at ? (
                <AppText color="secondary" variant="bodySmall">
                  {t.printing.details.completedAt}{' '}
                  {formatPrintOrderDate(activeOrder.completed_at, locale) ??
                    activeOrder.completed_at}
                </AppText>
              ) : null}
              {activeOrder.cancelled_at ? (
                <AppText color="secondary" variant="bodySmall">
                  {t.printing.details.cancelledAt}{' '}
                  {formatPrintOrderDate(activeOrder.cancelled_at, locale) ??
                    activeOrder.cancelled_at}
                </AppText>
              ) : null}
              {activeOrder.updated_at ? (
                <AppText color="secondary" variant="bodySmall">
                  {t.printing.details.updatedAt}{' '}
                  {formatPrintOrderDate(activeOrder.updated_at, locale) ?? activeOrder.updated_at}
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
          {activeOrder.items.length > 0 ? (
            <Stack gap="sm">
              {activeOrder.items.map((item, index) => (
                <AppCard key={String(item.id ?? index)} variant="default">
                  <Stack gap="xs">
                    <AppText variant="bodySmall" weight="600">
                      {getPrintOrderItemFileLabel(item, t.printing)}
                    </AppText>
                    <AppText color="secondary" variant="caption">
                      {t.printing.order.copies(item.copies)}
                      {item.pages_count ? t.printing.order.pages(item.pages_count) : ''}
                    </AppText>
                  </Stack>
                </AppCard>
              ))}
            </Stack>
          ) : (
            <AppCard variant="muted">
              <AppText color="secondary" variant="bodySmall">
                {t.printing.details.noItems}
              </AppText>
            </AppCard>
          )}
        </Stack>

        {activeOrder.user_notes ? (
          <AppCard variant="muted">
            <Stack gap="xs">
              <AppText variant="title">{t.printing.details.notesTitle}</AppText>
              <AppText color="secondary" variant="bodySmall">
                {activeOrder.user_notes}
              </AppText>
            </Stack>
          </AppCard>
        ) : null}

        {activeOrder.rejected_reason ? (
          <AppCard variant="muted">
            <Stack gap="xs">
              <AppText color="error" variant="title">
                {t.printing.details.rejectionReason}
              </AppText>
              <AppText color="secondary" variant="bodySmall">
                {activeOrder.rejected_reason}
              </AppText>
            </Stack>
          </AppCard>
        ) : null}

        <PrintingFutureOptionsCard />

        {canCancelPrintOrder(activeOrder) ? (
          <AppButton
            loading={isCancelling}
            onPress={handleCancel}
            title={t.printing.details.cancel}
            variant="danger"
          />
        ) : null}
      </Stack>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
  },
  header: {
    alignItems: 'flex-start',
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
  },
});
