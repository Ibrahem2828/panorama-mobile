import { useEffect } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet } from 'react-native';

import { images } from '../../../assets/images';
import {
  AppButton,
  AppHeader,
  AppScreen,
  EmptyState,
  ErrorState,
  LoadingState,
  Stack,
} from '../../../components';
import { useTranslation } from '../../../i18n';
import { PrintingRoutes } from '../../../navigation/routes';
import type { PrintingStackParamList } from '../../../navigation/types';
import { spacing } from '../../../theme';
import { PrintOrderCard } from '../components';
import { usePrintingStore } from '../store';

type MyPrintOrdersScreenProps = NativeStackScreenProps<PrintingStackParamList, 'MyPrintOrders'>;

export function MyPrintOrdersScreen({ navigation }: MyPrintOrdersScreenProps) {
  const { t } = useTranslation();
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
          <AppHeader subtitle={t.printing.myOrders.subtitle} title={t.printing.myOrders.title} />
          <Stack direction="horizontal" gap="md" wrap>
            <AppButton onPress={() => navigation.goBack()} title={t.common.back} variant="ghost" />
            <AppButton
              loading={isRefreshing}
              onPress={refreshMyOrders}
              title={t.common.refresh}
              variant="outline"
            />
          </Stack>
        </Stack>

        {errorMessage ? <ErrorState message={errorMessage} onRetry={loadMyOrders} /> : null}

        {isLoadingOrders && orders.length === 0 ? (
          <LoadingState message={t.printing.home.loadingOrders} />
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
                title={t.printing.myOrders.createOrder}
              />
            }
            message={t.printing.myOrders.emptyMessage}
            title={t.printing.myOrders.emptyTitle}
            illustrationLabel={t.printing.myOrders.emptyIllustrationAlt}
            illustrationSource={images.emptyStates.printingOrders}
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
