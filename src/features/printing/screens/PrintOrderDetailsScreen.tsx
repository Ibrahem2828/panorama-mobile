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
  LoadingState,
  SectionHeader,
  Stack,
} from '../../../components';
import type { PrintingStackParamList } from '../../../navigation/types';
import { spacing } from '../../../theme';
import {
  PrintOrderStatusBadge,
  PrintOrderSummaryCard,
  PrintingFutureOptionsCard,
} from '../components';
import {
  canCancelPrintOrder,
  formatPrintOrderDate,
  getPrintOrderDisplayTitle,
  getPrintOrderItemFileLabel,
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

  useEffect(() => {
    void loadOrderDetail(orderId);
  }, [loadOrderDetail, orderId]);

  function handleCancel() {
    void cancelOrder(orderId);
  }

  if (isLoadingDetail && !activeOrder) {
    return (
      <AppScreen contentContainerStyle={styles.content} scroll>
        <AppHeader subtitle="تفاصيل الطلب" title="الطباعة" />
        <LoadingState message="جاري تحميل تفاصيل الطلب..." />
      </AppScreen>
    );
  }

  if (!activeOrder) {
    return (
      <AppScreen contentContainerStyle={styles.content} scroll>
        <Stack gap="lg">
          <AppHeader subtitle="تفاصيل الطلب" title="الطباعة" />
          <AppButton onPress={() => navigation.goBack()} title="رجوع" variant="ghost" />
          <ErrorState
            message={errorMessage ?? 'تعذر تحميل تفاصيل طلب الطباعة.'}
            onRetry={() => loadOrderDetail(orderId)}
            title="الطلب غير متاح"
          />
        </Stack>
      </AppScreen>
    );
  }

  return (
    <AppScreen contentContainerStyle={styles.content} scroll>
      <Stack gap="xl">
        <Stack gap="md">
          <AppHeader subtitle="تفاصيل الطلب" title={getPrintOrderDisplayTitle(activeOrder)} />
          <AppButton onPress={() => navigation.goBack()} title="رجوع" variant="ghost" />
        </Stack>

        <AppCard variant="elevated">
          <Stack gap="md">
            <Stack direction="horizontal" gap="md" style={styles.header}>
              <Stack gap="xs" style={styles.titleBlock}>
                <AppText variant="title">{getPrintOrderDisplayTitle(activeOrder)}</AppText>
                <AppText color="secondary" variant="bodySmall">
                  {formatPrintOrderDate(activeOrder.created_at ?? activeOrder.submitted_at) ??
                    'تاريخ الطلب غير متاح'}
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

        <Stack gap="md">
          <SectionHeader subtitle="مصدر الملفات كما أعاده الباك إند" title="عناصر الطلب" />
          {activeOrder.items.length > 0 ? (
            <Stack gap="sm">
              {activeOrder.items.map((item, index) => (
                <AppCard key={String(item.id ?? index)} variant="default">
                  <Stack gap="xs">
                    <AppText variant="bodySmall" weight="600">
                      {getPrintOrderItemFileLabel(item)}
                    </AppText>
                    <AppText color="secondary" variant="caption">
                      {item.copies} نسخة
                      {item.pages_count ? ` - ${item.pages_count} صفحة` : ''}
                    </AppText>
                  </Stack>
                </AppCard>
              ))}
            </Stack>
          ) : (
            <AppCard variant="muted">
              <AppText color="secondary" variant="bodySmall">
                لا توجد عناصر مفصلة في استجابة الباك إند.
              </AppText>
            </AppCard>
          )}
        </Stack>

        {activeOrder.user_notes ? (
          <AppCard variant="muted">
            <Stack gap="xs">
              <AppText variant="title">ملاحظاتك</AppText>
              <AppText color="secondary" variant="bodySmall">
                {activeOrder.user_notes}
              </AppText>
            </Stack>
          </AppCard>
        ) : null}

        {activeOrder.rejection_reason ? (
          <AppCard variant="muted">
            <Stack gap="xs">
              <AppText color="error" variant="title">
                سبب الرفض
              </AppText>
              <AppText color="secondary" variant="bodySmall">
                {activeOrder.rejection_reason}
              </AppText>
            </Stack>
          </AppCard>
        ) : null}

        <PrintingFutureOptionsCard />

        {canCancelPrintOrder(activeOrder) ? (
          <AppButton
            loading={isCancelling}
            onPress={handleCancel}
            title="إلغاء الطلب"
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
