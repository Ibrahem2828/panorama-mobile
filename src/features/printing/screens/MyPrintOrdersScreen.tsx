import { useCallback, useEffect, useMemo } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import {
  AppButton,
  AppHeader,
  AppScreen,
  AppText,
  EmptyState,
  ErrorState,
  SkeletonList,
  Stack,
} from '../../../components';
import { useTranslation } from '../../../i18n';
import { PrintingRoutes } from '../../../navigation/routes';
import type { PrintingStackParamList } from '../../../navigation/types';
import { layout, spacing, useBrand } from '../../../theme';
import { PrintChoiceChips, PrintOrderCard } from '../components';
import { getPrintOrderStatusPresentation } from '../services';
import { usePrintingStore } from '../store';
import type { PrintOrder } from '../types';

type Props = NativeStackScreenProps<PrintingStackParamList, 'MyPrintOrders'>;

const FILTER_STATUSES = [
  'submitted',
  'under_review',
  'accepted',
  'printing',
  'ready',
  'delivered',
  'cancelled',
  'rejected',
] as const;

function keyExtractor(order: PrintOrder) {
  return String(order.id);
}

function Separator() {
  return <View style={styles.separator} />;
}

export function MyPrintOrdersScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const brand = useBrand();
  const orders = usePrintingStore((state) => state.orders);
  const ordersCount = usePrintingStore((state) => state.ordersCount);
  const nextPage = usePrintingStore((state) => state.nextOrdersPage);
  const statusFilter = usePrintingStore((state) => state.statusFilter);
  const hasLoaded = usePrintingStore((state) => state.hasLoadedOrders);
  const isLoadingOrders = usePrintingStore((state) => state.isLoadingOrders);
  const isLoadingMore = usePrintingStore((state) => state.isLoadingMoreOrders);
  const isRefreshing = usePrintingStore((state) => state.isRefreshing);
  const ordersError = usePrintingStore((state) => state.ordersError);
  const loadMyOrders = usePrintingStore((state) => state.loadMyOrders);
  const refreshMyOrders = usePrintingStore((state) => state.refreshMyOrders);
  const loadMoreOrders = usePrintingStore((state) => state.loadMoreOrders);

  useEffect(() => {
    void loadMyOrders();
  }, [loadMyOrders]);

  const handleOpen = useCallback(
    (order: PrintOrder) =>
      navigation.navigate(PrintingRoutes.PrintOrderDetails, { orderId: order.id }),
    [navigation],
  );
  const handleRefresh = useCallback(() => void refreshMyOrders(), [refreshMyOrders]);
  const handleEndReached = useCallback(() => void loadMoreOrders(), [loadMoreOrders]);
  const handleFilter = useCallback(
    (status: string) => {
      // A change of filter starts a fresh load even if one is already finishing.
      usePrintingStore.setState({ isLoadingOrders: false });
      void loadMyOrders(status);
    },
    [loadMyOrders],
  );
  const renderItem = useCallback(
    ({ item }: { item: PrintOrder }) => <PrintOrderCard onPress={handleOpen} order={item} />,
    [handleOpen],
  );
  const filterOptions = useMemo(
    () => [
      { value: '', label: t.printing.myOrders.statusAll },
      ...FILTER_STATUSES.map((status) => ({
        value: status as string,
        label: getPrintOrderStatusPresentation(status, t.printing, t.common.unknown).label,
      })),
    ],
    [t],
  );

  const header = (
    <Stack gap="lg" style={styles.header}>
      <AppHeader
        subtitle={hasLoaded ? t.printing.myOrders.total(ordersCount) : t.printing.myOrders.subtitle}
        title={t.printing.myOrders.title}
      />
      <Stack direction="horizontal" gap="md" wrap>
        <AppButton
          onPress={() => navigation.navigate(PrintingRoutes.CreatePrintOrder)}
          title={t.printing.myOrders.createOrder}
        />
      </Stack>
      <PrintChoiceChips
        label={t.printing.myOrders.statusFilterLabel}
        onChange={handleFilter}
        options={filterOptions}
        value={statusFilter}
      />
    </Stack>
  );

  if (ordersError && !hasLoaded) {
    return (
      <AppScreen contentContainerStyle={styles.centerContent} scroll>
        {header}
        <ErrorState message={ordersError} onRetry={() => void loadMyOrders()} />
      </AppScreen>
    );
  }

  return (
    <AppScreen horizontalPadding={false}>
      <FlatList
        ItemSeparatorComponent={Separator}
        ListEmptyComponent={
          isLoadingOrders ? (
            <SkeletonList />
          ) : statusFilter ? (
            <EmptyState
              action={
                <AppButton
                  onPress={() => handleFilter('')}
                  title={t.printing.myOrders.statusAll}
                  variant="outline"
                />
              }
              message={t.printing.myOrders.filteredEmptyMessage}
              title={t.printing.myOrders.filteredEmptyTitle}
            />
          ) : (
            <EmptyState
              action={
                <AppButton
                  onPress={() => navigation.navigate(PrintingRoutes.CreatePrintOrder)}
                  title={t.printing.myOrders.createOrder}
                />
              }
              illustrationLabel={t.printing.myOrders.emptyIllustrationAlt}
              artwork="printing"
              message={t.printing.myOrders.emptyMessage}
              title={t.printing.myOrders.emptyTitle}
            />
          )
        }
        ListFooterComponent={
          <View style={styles.footer}>
            {isLoadingMore ? <ActivityIndicator color={brand.primary} /> : null}
            {ordersError && hasLoaded ? (
              <Stack align="center" gap="sm">
                <AppText align="center" color="error" variant="bodySmall">
                  {ordersError}
                </AppText>
                <AppButton
                  onPress={handleEndReached}
                  size="sm"
                  title={t.common.retry}
                  variant="outline"
                />
              </Stack>
            ) : null}
            {!isLoadingMore && !ordersError && nextPage !== null ? (
              <AppButton
                onPress={handleEndReached}
                size="sm"
                title={t.printing.myOrders.loadMore}
                variant="outline"
              />
            ) : null}
          </View>
        }
        ListHeaderComponent={header}
        contentContainerStyle={styles.listContent}
        data={orders}
        initialNumToRender={6}
        keyExtractor={keyExtractor}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            colors={[brand.primary]}
            onRefresh={handleRefresh}
            refreshing={isRefreshing}
            tintColor={brand.primary}
          />
        }
        removeClippedSubviews
        renderItem={renderItem}
        windowSize={7}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  centerContent: { gap: spacing.xl },
  header: { marginBottom: spacing.lg },
  listContent: {
    paddingHorizontal: layout.screenHorizontalPadding,
    paddingTop: layout.screenVerticalPadding,
    paddingBottom: layout.screenVerticalPadding,
    flexGrow: 1,
  },
  separator: { height: spacing.md },
  footer: { paddingVertical: spacing.lg, alignItems: 'center', minHeight: spacing.xxl },
});
