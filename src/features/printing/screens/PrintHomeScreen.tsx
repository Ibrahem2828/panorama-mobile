import { useEffect } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet } from 'react-native';

import {
  AppButton,
  AppCard,
  AppHeader,
  AppScreen,
  AppText,
  Artwork,
  BrandRefreshControl,
  ErrorState,
  SectionHeader,
  SkeletonList,
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
  const errorMessage = usePrintingStore((state) => state.ordersError);
  const loadMyOrders = usePrintingStore((state) => state.loadMyOrders);

  useEffect(() => {
    // The home card always shows the newest order, whatever filter the orders list used.
    void loadMyOrders('');
  }, [loadMyOrders]);

  const latestOrder = orders[0];

  return (
    <AppScreen
      contentContainerStyle={styles.content}
      refreshControl={
        <BrandRefreshControl onRefresh={() => void loadMyOrders('')} refreshing={isLoadingOrders} />
      }
      scroll
    >
      <Stack gap="xl">
        <AppHeader subtitle={t.printing.home.subtitle} title={t.printing.title} />

        <AppCard variant="elevated">
          <Stack align="center" gap="lg">
            <Artwork name="printing" size="md" />
            <Stack gap="xs" style={styles.fullWidth}>
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

        {errorMessage ? (
          <ErrorState message={errorMessage} onRetry={() => void loadMyOrders()} />
        ) : null}

        <Stack gap="md">
          <SectionHeader
            subtitle={t.printing.home.registeredOrders(ordersCount)}
            title={t.printing.home.latestOrder}
          />
          {isLoadingOrders && !latestOrder ? (
            <SkeletonList count={1} />
          ) : latestOrder ? (
            <PrintOrderCard
              order={latestOrder}
              onPress={(order) =>
                navigation.navigate(PrintingRoutes.PrintOrderDetails, { orderId: order.id })
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
  fullWidth: {
    alignSelf: 'stretch',
  },
  content: {
    gap: spacing.xl,
  },
});
