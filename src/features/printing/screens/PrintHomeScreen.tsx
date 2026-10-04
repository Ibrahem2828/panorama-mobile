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
import { useTranslation } from '../../../i18n';
import { PrintingRoutes } from '../../../navigation/routes';
import type { PrintingStackParamList } from '../../../navigation/types';
import { spacing } from '../../../theme';
import { PrintOrderCard, PrintingFutureOptionsCard } from '../components';
import { usePrintingStore } from '../store';

type PrintHomeScreenProps = NativeStackScreenProps<PrintingStackParamList, 'PrintHome'>;

export function PrintHomeScreen({ navigation }: PrintHomeScreenProps) {
  const { t } = useTranslation();
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
        <AppHeader subtitle={t.printing.home.subtitle} title={t.printing.title} />

        <AppCard variant="elevated">
          <Stack gap="lg">
            <Illustration
              accessibilityLabel={t.printing.home.illustrationAlt}
              size="lg"
              source={images.printing.hero}
            />
            <Stack gap="xs">
              <AppText variant="h2">{t.printing.home.heading}</AppText>
              <AppText color="secondary" variant="bodySmall">
                {t.printing.home.description}
              </AppText>
            </Stack>
            <Stack direction="horizontal" gap="md" wrap>
              <AppButton
                onPress={() => navigation.navigate(PrintingRoutes.CreatePrintOrder)}
                title={t.printing.home.newOrder}
              />
              <AppButton
                onPress={() => navigation.navigate(PrintingRoutes.MyPrintOrders)}
                title={t.printing.home.myOrders}
                variant="outline"
              />
            </Stack>
          </Stack>
        </AppCard>

        <PrintingFutureOptionsCard />

        {errorMessage ? <ErrorState message={errorMessage} onRetry={loadMyOrders} /> : null}

        <Stack gap="md">
          <SectionHeader
            subtitle={t.printing.home.registeredOrders(ordersCount)}
            title={t.printing.home.latestOrder}
          />
          {isLoadingOrders && !latestOrder ? (
            <LoadingState message={t.printing.home.loadingOrders} />
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
                {t.printing.home.noOrders}
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
