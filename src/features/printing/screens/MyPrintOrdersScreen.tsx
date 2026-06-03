import { useEffect } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet } from 'react-native';

import {
  AppButton,
  AppHeader,
  AppScreen,
  EmptyState,
  ErrorState,
  LoadingState,
  Stack,
} from '../../../components';
import { PrintingRoutes } from '../../../navigation/routes';
import type { PrintingStackParamList } from '../../../navigation/types';
import { spacing } from '../../../theme';
import { PrintOrderCard } from '../components';
import { usePrintingStore } from '../store';

type MyPrintOrdersScreenProps = NativeStackScreenProps<PrintingStackParamList, 'MyPrintOrders'>;

export function MyPrintOrdersScreen({ navigation }: MyPrintOrdersScreenProps) {
  const orders = usePrintingStore((state) => state.orders);
  const isLoadingOrders = usePrintingStore((state) => state.isLoadingOrders);
  const isRefreshing = usePrintingStore((state) => state.isRefreshing);
  const errorMessage = usePrintingStore((state) => state.errorMessage);
  const loadMyOrders = usePrintingStore((state) => state.loadMyOrders);
  const refreshMyOrders = usePrintingStore((state) => state.refreshMyOrders);

  useEffect(() => {
    void loadMyOrders();
  }, [loadMyOrders]);

  return (
    <AppScreen contentContainerStyle={styles.content} scroll>
      <Stack gap="xl">
        <Stack gap="md">
          <AppHeader subtitle="متابعة الحالات" title="طلباتي" />
          <Stack direction="horizontal" gap="md" wrap>
            <AppButton onPress={() => navigation.goBack()} title="رجوع" variant="ghost" />
            <AppButton
              loading={isRefreshing}
              onPress={refreshMyOrders}
              title="تحديث"
              variant="outline"
            />
          </Stack>
        </Stack>

        {errorMessage ? <ErrorState message={errorMessage} onRetry={loadMyOrders} /> : null}

        {isLoadingOrders && orders.length === 0 ? (
          <LoadingState message="جاري تحميل طلبات الطباعة..." />
        ) : orders.length > 0 ? (
          <Stack gap="md">
            {orders.map((order) => (
              <PrintOrderCard
                key={String(order.id)}
                order={order}
                onPress={() =>
                  navigation.navigate(PrintingRoutes.PrintOrderDetails, {
                    orderId: order.id,
                  })
                }
              />
            ))}
          </Stack>
        ) : (
          <EmptyState
            action={
              <AppButton
                onPress={() => navigation.navigate(PrintingRoutes.CreatePrintOrder)}
                title="إنشاء طلب"
              />
            }
            message="أنشئ أول طلب طباعة من ملف متاح لك."
            title="لا توجد طلبات طباعة"
          />
        )}
      </Stack>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
  },
});
