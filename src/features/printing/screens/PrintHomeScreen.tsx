import { useEffect } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet } from 'react-native';

import { images } from '../../../assets/images';
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
import { PrintingRoutes } from '../../../navigation/routes';
import type { PrintingStackParamList } from '../../../navigation/types';
import { spacing } from '../../../theme';
import { PrintOrderCard, PrintingFutureOptionsCard } from '../components';
import { usePrintingStore } from '../store';

type PrintHomeScreenProps = NativeStackScreenProps<PrintingStackParamList, 'PrintHome'>;

export function PrintHomeScreen({ navigation }: PrintHomeScreenProps) {
  const orders = usePrintingStore((state) => state.orders);
  const ordersCount = usePrintingStore((state) => state.ordersCount);
  const isLoadingOrders = usePrintingStore((state) => state.isLoadingOrders);
  const errorMessage = usePrintingStore((state) => state.errorMessage);
  const loadMyOrders = usePrintingStore((state) => state.loadMyOrders);

  useEffect(() => {
    void loadMyOrders();
  }, [loadMyOrders]);

  const latestOrder = orders[0];

  return (
    <AppScreen contentContainerStyle={styles.content} scroll>
      <Stack gap="xl">
        <AppHeader subtitle="طلبات الطباعة" title="الطباعة" />

        <AppCard variant="elevated">
          <Stack gap="lg">
            <Illustration
              accessibilityLabel="رسم يوضح خدمة الطباعة"
              size="lg"
              source={images.printing.hero}
            />
            <Stack gap="xs">
              <AppText variant="h2">طلب طباعة من ملفاتك</AppText>
              <AppText color="secondary" variant="bodySmall">
                أنشئ طلبا من ملف متاح لك، ثم تابع حالته من طلباتي.
              </AppText>
            </Stack>
            <Stack direction="horizontal" gap="md" wrap>
              <AppButton
                onPress={() => navigation.navigate(PrintingRoutes.CreatePrintOrder)}
                title="طلب جديد"
              />
              <AppButton
                onPress={() => navigation.navigate(PrintingRoutes.MyPrintOrders)}
                title="طلباتي"
                variant="outline"
              />
            </Stack>
          </Stack>
        </AppCard>

        <PrintingFutureOptionsCard />

        {errorMessage ? <ErrorState message={errorMessage} onRetry={loadMyOrders} /> : null}

        <Stack gap="md">
          <SectionHeader subtitle={`${ordersCount} طلب مسجل من الباك إند`} title="آخر طلب طباعة" />
          {isLoadingOrders && !latestOrder ? (
            <LoadingState message="جاري تحميل طلبات الطباعة..." />
          ) : latestOrder ? (
            <PrintOrderCard
              order={latestOrder}
              onPress={() =>
                navigation.navigate(PrintingRoutes.PrintOrderDetails, {
                  orderId: latestOrder.id,
                })
              }
            />
          ) : (
            <AppCard variant="muted">
              <AppText color="secondary" variant="bodySmall">
                لا توجد طلبات طباعة حتى الآن.
              </AppText>
            </AppCard>
          )}
        </Stack>
      </Stack>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
  },
});
