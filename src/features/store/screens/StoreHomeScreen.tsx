import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { classifyApiError } from '../../../api/errorKind';
import {
  AppButton,
  AppHeader,
  AppScreen,
  AppText,
  AppTextInput,
  BrandRefreshControl,
  EmptyState,
  ErrorState,
  Icon,
  Skeleton,
} from '../../../components';
import { useTranslation } from '../../../i18n';
import { useNetworkStore } from '../../../offline/networkStore';
import { useRefreshOnReconnect } from '../../../offline/useRefreshOnReconnect';
import { OfflineSearchEmpty, OfflineSearchNote } from '../../search/components/OfflineSearchNotice';
import { StoreRoutes } from '../../../navigation/routes';
import type { StoreStackParamList } from '../../../navigation/types';
import { colors, layout, radius, spacing, useBrand } from '../../../theme';
import type { StoreProductCard } from '../../../api';
import { BrandStrip } from '../components/BrandStrip';
import { CurrencySwitch } from '../components/CurrencySwitch';
import {
  activeFilterCount,
  DEFAULT_FILTERS,
  FilterSheet,
  type StoreFilters,
} from '../components/FilterSheet';
import { ProductCard } from '../components/ProductCard';
import { StoreChip } from '../components/StoreChip';
import { StoreHeaderActions } from '../components/StoreHeaderActions';
import { useStoreCatalog, useStoreFilterOptions } from '../hooks/useStoreCatalog';
import { useStoreStore } from '../store';

type Props = NativeStackScreenProps<StoreStackParamList, 'StoreHome'>;

function SkeletonGrid() {
  return (
    <View style={styles.skeletonGrid}>
      {[0, 1, 2, 3].map((key) => (
        <View key={key} style={styles.skeletonCell}>
          <Skeleton borderRadius={radius.card} height={230} />
        </View>
      ))}
    </View>
  );
}

export function StoreHomeScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const brand = useBrand();
  const isOnline = useNetworkStore((state) => state.isOnline);
  const currency = useStoreStore((state) => state.currency);
  const setCurrency = useStoreStore((state) => state.setCurrency);
  const loadCurrency = useStoreStore((state) => state.loadCurrency);
  const loadCart = useStoreStore((state) => state.loadCart);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<StoreFilters>(DEFAULT_FILTERS);
  const [sheetOpen, setSheetOpen] = useState(false);
  const { brands, categories } = useStoreFilterOptions();
  const catalog = useStoreCatalog(search, filters);
  // Back online after a search answered from the phone: run it again by itself.
  useRefreshOnReconnect(() => {
    if (catalog.isLocal || catalog.error) void catalog.retry();
  });
  const copy = t.store.home;
  const activeCount = activeFilterCount(filters);
  const isFiltered = activeCount > 0 || search.trim() !== '';

  useEffect(() => {
    void loadCurrency();
  }, [loadCurrency]);

  // Keep the cart badge honest whenever the student comes back to the store.
  useFocusEffect(
    useCallback(() => {
      void loadCart({ silent: true });
    }, [loadCart]),
  );

  const openProduct = useCallback(
    (product: StoreProductCard) =>
      navigation.navigate(StoreRoutes.StoreProduct, { productId: product.id, name: product.name }),
    [navigation],
  );
  const renderItem = useCallback(
    ({ item }: { item: StoreProductCard }) => (
      <View style={styles.cell}>
        <ProductCard currency={currency} onPress={openProduct} product={item} />
      </View>
    ),
    [currency, openProduct],
  );
  const clearAll = useCallback(() => {
    setSearch('');
    setFilters(DEFAULT_FILTERS);
  }, []);

  const header = useMemo(
    () => (
      <View style={styles.header}>
        <AppHeader
          rightAction={
            <StoreHeaderActions
              onOpenCart={() => navigation.navigate(StoreRoutes.StoreCart)}
              onOpenOrders={() => navigation.navigate(StoreRoutes.StoreOrders)}
            />
          }
          showBack={false}
          subtitle={copy.subtitle}
          title={copy.title}
        />
        <AppTextInput
          accessibilityLabel={copy.searchLabel}
          autoCapitalize="none"
          autoCorrect={false}
          leftIcon={<Icon color={colors.text.muted} name="search" size={20} />}
          onChangeText={setSearch}
          placeholder={copy.searchPlaceholder}
          returnKeyType="search"
          rightIcon={
            search ? (
              <Pressable
                accessibilityLabel={copy.clearSearch}
                accessibilityRole="button"
                hitSlop={12}
                onPress={() => setSearch('')}
              >
                <Icon color={colors.text.muted} name="close" size={20} />
              </Pressable>
            ) : undefined
          }
          value={search}
        />
        {catalog.isLocal && catalog.items.length > 0 ? <OfflineSearchNote /> : null}
        <BrandStrip
          brands={brands}
          onSelect={(id) => setFilters((previous) => ({ ...previous, brand: id }))}
          selectedId={filters.brand}
        />
        {categories.length > 0 ? (
          <View style={styles.categories}>
            <AppText accessibilityRole="header" variant="label" weight="700">
              {copy.categoriesTitle}
            </AppText>
            <ScrollView
              contentContainerStyle={styles.chips}
              horizontal
              showsHorizontalScrollIndicator={false}
            >
              <StoreChip
                label={copy.categoriesAll}
                onPress={() => setFilters((previous) => ({ ...previous, category: null }))}
                selected={filters.category === null}
              />
              {categories.map((category) => (
                <StoreChip
                  key={category.id}
                  label={category.name}
                  onPress={() =>
                    setFilters((previous) => ({
                      ...previous,
                      category: previous.category === category.id ? null : category.id,
                    }))
                  }
                  selected={filters.category === category.id}
                />
              ))}
            </ScrollView>
          </View>
        ) : null}
        <View style={styles.toolbar}>
          <CurrencySwitch onChange={setCurrency} value={currency} />
          <Pressable
            accessibilityLabel={
              activeCount > 0 ? copy.filterActiveLabel(activeCount) : copy.filterLabel
            }
            accessibilityRole="button"
            onPress={() => setSheetOpen(true)}
            style={[
              styles.filterButton,
              activeCount > 0
                ? { borderColor: brand.primary, backgroundColor: brand.primarySoft }
                : null,
            ]}
          >
            <Icon color={brand.primary} name="filter" size={20} />
            <AppText color="brand" numberOfLines={1} variant="bodySmall" weight="700">
              {copy.filterLabel}
            </AppText>
            {activeCount > 0 ? (
              <View style={[styles.filterCount, { backgroundColor: brand.primary }]}>
                <AppText
                  style={{ color: brand.onPrimary, fontSize: 11, lineHeight: 16 }}
                  variant="caption"
                  weight="700"
                >
                  {String(activeCount)}
                </AppText>
              </View>
            ) : null}
          </Pressable>
        </View>
        {catalog.hasLoaded && !catalog.error ? (
          <AppText accessibilityLiveRegion="polite" color="muted" variant="caption">
            {copy.resultsCount(catalog.count)}
          </AppText>
        ) : null}
      </View>
    ),
    [
      activeCount,
      brand.onPrimary,
      brand.primary,
      brand.primarySoft,
      brands,
      catalog.count,
      catalog.error,
      catalog.hasLoaded,
      catalog.isLocal,
      catalog.items.length,
      categories,
      copy,
      currency,
      filters.brand,
      filters.category,
      navigation,
      search,
      setCurrency,
    ],
  );

  const empty = catalog.isLoading ? (
    <SkeletonGrid />
  ) : catalog.error ? (
    <ErrorState
      fallbackMessage={copy.errorMessage}
      kind={classifyApiError(catalog.error, { deviceOnline: isOnline })}
      onRetry={() => void catalog.retry()}
      title={copy.errorTitle}
    />
  ) : catalog.isLocal ? (
    <OfflineSearchEmpty />
  ) : isFiltered ? (
    <EmptyState
      action={<AppButton onPress={clearAll} title={copy.clearFilters} variant="outline" />}
      artwork="search"
      message={copy.emptyFilteredMessage}
      title={copy.emptyFilteredTitle}
    />
  ) : (
    <EmptyState
      artwork="store"
      illustrationLabel={copy.emptyArtLabel}
      message={copy.emptyMessage}
      title={copy.emptyTitle}
    />
  );

  return (
    <AppScreen horizontalPadding={false}>
      <FlatList
        ListEmptyComponent={empty}
        ListFooterComponent={
          <View style={styles.footer}>
            {catalog.isLoadingMore ? <ActivityIndicator color={brand.primary} /> : null}
            {catalog.moreError ? (
              <AppButton
                onPress={() => void catalog.loadMore()}
                size="sm"
                title={t.common.retry}
                variant="outline"
              />
            ) : null}
          </View>
        }
        ListHeaderComponent={header}
        columnWrapperStyle={styles.columns}
        contentContainerStyle={styles.listContent}
        data={catalog.error ? [] : catalog.items}
        initialNumToRender={6}
        keyExtractor={(item) => String(item.id)}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        numColumns={2}
        onEndReached={() => void catalog.loadMore()}
        onEndReachedThreshold={0.5}
        refreshControl={
          <BrandRefreshControl
            onRefresh={() => void catalog.refresh()}
            refreshing={catalog.isRefreshing}
          />
        }
        renderItem={renderItem}
        windowSize={7}
      />
      <FilterSheet
        brands={brands}
        categories={categories}
        filters={filters}
        onApply={setFilters}
        onClose={() => setSheetOpen(false)}
        visible={sheetOpen}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.lg, marginBottom: spacing.lg },
  categories: { gap: spacing.sm },
  chips: { gap: spacing.sm },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  filterButton: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.background.surface,
  },
  filterCount: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  listContent: {
    paddingHorizontal: layout.screenHorizontalPadding,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    flexGrow: 1,
  },
  columns: { gap: spacing.md },
  cell: { flex: 1, maxWidth: '50%', marginBottom: spacing.md },
  skeletonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  skeletonCell: { width: '47%', flexGrow: 1 },
  footer: { minHeight: spacing.xxl, alignItems: 'center', paddingVertical: spacing.md },
});
