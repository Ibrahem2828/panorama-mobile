import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { storeService, type StoreProductDetail } from '../../../api';
import { classifyApiError } from '../../../api/errorKind';
import {
  AppButton,
  AppHeader,
  AppScreen,
  AppText,
  ErrorState,
  Icon,
  Skeleton,
} from '../../../components';
import { useTranslation } from '../../../i18n';
import { useNetworkStore } from '../../../offline/networkStore';
import { StoreRoutes } from '../../../navigation/routes';
import type { StoreStackParamList } from '../../../navigation/types';
import { colors, layout, radius, shadows, spacing, useBrand } from '../../../theme';
import { useAuthStore } from '../../auth/store';
import { CurrencySwitch } from '../components/CurrencySwitch';
import { ImageGallery } from '../components/ImageGallery';
import { QuantityStepper } from '../components/QuantityStepper';
import { RatingStars } from '../components/RatingStars';
import { ReviewsSection } from '../components/ReviewsSection';
import { StoreHeaderActions } from '../components/StoreHeaderActions';
import { VariantPicker } from '../components/VariantPicker';
import {
  addToCartBlock,
  clampQuantity,
  findVariant,
  formatRatingValue,
  formatStoreMoney,
  initialSelection,
  lowStockRemaining,
  maxAddable,
  priceIn,
  storeErrorMessage,
  unitsInCart,
  type VariantSelection,
} from '../services';
import { useStoreStore } from '../store';

type Props = NativeStackScreenProps<StoreStackParamList, 'StoreProduct'>;

const ADDED_NOTICE_MS = 6000;

export function StoreProductScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const brand = useBrand();
  const isOnline = useNetworkStore((state) => state.isOnline);
  const accessToken = useAuthStore((state) => state.accessToken);
  const currency = useStoreStore((state) => state.currency);
  const setCurrency = useStoreStore((state) => state.setCurrency);
  const cart = useStoreStore((state) => state.cart);
  const addToCart = useStoreStore((state) => state.addToCart);
  const loadCart = useStoreStore((state) => state.loadCart);
  const { productId } = route.params;
  const copy = t.store.product;
  const [product, setProduct] = useState<StoreProductDetail | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selection, setSelection] = useState<VariantSelection>({ colour: '', size: '' });
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [justAdded, setJustAdded] = useState(false);
  const addedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectionReady = useRef(false);

  const load = useCallback(
    async (mode: 'initial' | 'refresh') => {
      if (!accessToken) return;
      if (mode === 'initial') setIsLoading(true);
      else setIsRefreshing(true);
      try {
        const detail = await storeService.getProduct(productId, accessToken);
        setProduct(detail);
        setError(null);
        // Only the very first load picks a variant; a refresh keeps the student's choice when it still exists.
        if (!selectionReady.current) {
          selectionReady.current = true;
          setSelection(initialSelection(detail.variants, useStoreStore.getState().currency));
        }
      } catch (caught) {
        if (mode === 'initial' || !product) setError(caught);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [accessToken, product, productId],
  );

  useEffect(() => {
    selectionReady.current = false;
    void load('initial');
    void loadCart({ silent: true });
  }, [productId, accessToken]);

  useEffect(
    () => () => {
      if (addedTimer.current) clearTimeout(addedTimer.current);
    },
    [],
  );

  const variant = useMemo(
    () => (product ? findVariant(product.variants, selection) : null),
    [product, selection],
  );
  const inCart = variant ? unitsInCart(cart, variant.id) : 0;
  const max = variant ? maxAddable(variant, inCart) : 0;
  const block = addToCartBlock(variant, currency, inCart);
  const unit = variant ? priceIn(variant.prices, currency) : priceIn(product?.prices, currency);
  const unitMoney = formatStoreMoney(unit, currency);
  const total = unit !== null ? formatStoreMoney(Number(unit) * quantity, currency) : null;
  const lowStock = variant ? lowStockRemaining(variant) : null;

  // A different variant, a cart that changed or a currency switch can lower the maximum: never keep a quantity above it.
  useEffect(() => {
    setQuantity((current) => clampQuantity(current, max));
  }, [max, variant?.id]);

  useEffect(() => {
    setQuantity(1);
    setMessage(null);
  }, [variant?.id]);

  async function handleAdd() {
    if (!variant || block !== null || adding) return;
    setAdding(true);
    setMessage(null);
    const result = await addToCart(variant.id, quantity);
    setAdding(false);
    if (result.ok) {
      setJustAdded(true);
      if (addedTimer.current) clearTimeout(addedTimer.current);
      addedTimer.current = setTimeout(() => setJustAdded(false), ADDED_NOTICE_MS);
      setQuantity(1);
    } else {
      setMessage(storeErrorMessage(result.info, t.store));
      // The shelf changed since this page loaded: show the real numbers.
      if (result.info.refreshCart) void load('refresh');
    }
  }

  const headerRight = (
    <StoreHeaderActions onOpenCart={() => navigation.navigate(StoreRoutes.StoreCart)} />
  );

  if (isLoading && !product) {
    return (
      <AppScreen scroll>
        <AppHeader
          onBack={() => navigation.goBack()}
          rightAction={headerRight}
          showBack
          title={route.params.name ?? copy.title}
        />
        <View style={styles.skeleton}>
          <Skeleton borderRadius={radius.xl} height={320} />
          <Skeleton height={28} width="70%" />
          <Skeleton height={20} width="40%" />
          <Skeleton height={48} />
        </View>
      </AppScreen>
    );
  }

  if (!product) {
    const kind = classifyApiError(error, { deviceOnline: isOnline });

    return (
      <AppScreen scroll>
        <AppHeader
          onBack={() => navigation.goBack()}
          rightAction={headerRight}
          showBack
          title={copy.title}
        />
        <ErrorState
          kind={kind}
          message={kind === 'notFound' ? copy.unavailableMessage : undefined}
          onRetry={kind === 'notFound' ? undefined : () => void load('initial')}
          title={kind === 'notFound' ? copy.unavailableTitle : copy.errorTitle}
        />
        {kind === 'notFound' ? (
          <AppButton onPress={() => navigation.goBack()} title={t.common.back} variant="outline" />
        ) : null}
      </AppScreen>
    );
  }

  const rating = formatRatingValue(product.rating_avg);
  const outOfStockAll = !product.in_stock;

  return (
    <AppScreen horizontalPadding={false} maxContentWidth={false}>
      <View style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              colors={[brand.primary]}
              onRefresh={() => void load('refresh')}
              progressBackgroundColor={colors.background.elevated}
              refreshing={isRefreshing}
              tintColor={brand.primary}
            />
          }
        >
          <AppHeader
            onBack={() => navigation.goBack()}
            rightAction={headerRight}
            showBack
            title={copy.title}
          />
          <ImageGallery
            fallbackUri={product.image_url}
            focusImageId={variant?.image_id ?? null}
            images={product.images}
            name={product.name}
          />

          <View style={styles.block}>
            {product.brand ? (
              <AppText color="brand" variant="bodySmall" weight="700">
                {product.brand.name}
              </AppText>
            ) : null}
            <AppText accessibilityRole="header" variant="h2">
              {product.name}
            </AppText>
            <View
              accessibilityLabel={t.store.card.ratingA11y(rating, product.rating_count)}
              accessible
              style={styles.ratingRow}
            >
              <RatingStars size={16} value={product.rating_avg} />
              <AppText color="secondary" variant="bodySmall">
                {product.rating_count > 0
                  ? `${rating} ${t.store.card.ratingCount(product.rating_count)}`
                  : t.store.card.noRatings}
              </AppText>
            </View>
          </View>

          <View style={styles.priceRow}>
            <AppText
              color={unitMoney ? 'brand' : 'muted'}
              variant={unitMoney ? 'h1' : 'bodySmall'}
              weight="700"
            >
              {unitMoney ?? copy.noPrice}
            </AppText>
            <CurrencySwitch onChange={setCurrency} value={currency} />
          </View>

          <VariantPicker
            currency={currency}
            onChange={setSelection}
            selection={selection}
            variants={product.variants}
          />

          {variant ? (
            <View style={styles.stockBlock}>
              {block === 'outOfStock' || outOfStockAll ? (
                <View style={styles.statusRow}>
                  <Icon color={colors.semantic.error} name="alert" size={18} />
                  <AppText color="error" variant="bodySmall" weight="700">
                    {copy.outOfStock}
                  </AppText>
                </View>
              ) : null}
              {lowStock !== null ? (
                <AppText color="warning" variant="bodySmall" weight="700">
                  {copy.onlyLeft(lowStock)}
                </AppText>
              ) : null}
              {inCart > 0 ? (
                <AppText color="secondary" variant="caption">
                  {copy.inCart(inCart)}
                </AppText>
              ) : null}
            </View>
          ) : (
            <AppText color="secondary" variant="bodySmall">
              {copy.selectOptions}
            </AppText>
          )}

          {variant && block !== 'outOfStock' && block !== 'noPrice' ? (
            <View style={styles.group}>
              <AppText variant="label" weight="700">
                {copy.quantity}
              </AppText>
              <QuantityStepper
                decreaseLabel={copy.decrease}
                disabled={max <= 0}
                increaseLabel={copy.increase}
                max={Math.max(max, 1)}
                onChange={setQuantity}
                value={quantity}
                valueLabel={copy.quantityValue(quantity)}
              />
              {block === 'limitReached' ? (
                <AppText color="secondary" variant="caption">
                  {copy.limitReached}
                </AppText>
              ) : quantity >= max && max === variant.max_per_order && variant.available > max ? (
                <AppText color="secondary" variant="caption">
                  {copy.maxPerOrder(variant.max_per_order)}
                </AppText>
              ) : null}
            </View>
          ) : null}

          {product.description ? (
            <View style={styles.group}>
              <AppText accessibilityRole="header" variant="title">
                {copy.description}
              </AppText>
              <AppText color="secondary" variant="body">
                {product.description}
              </AppText>
            </View>
          ) : null}

          {product.specs.length > 0 || product.category ? (
            <View style={styles.group}>
              <AppText accessibilityRole="header" variant="title">
                {copy.specs}
              </AppText>
              <View style={styles.specs}>
                {product.category ? (
                  <SpecRow label={copy.category} value={product.category.name} />
                ) : null}
                {product.brand ? <SpecRow label={copy.brand} value={product.brand.name} /> : null}
                {product.specs.map((spec, index) => (
                  <SpecRow key={`${spec.label}-${index}`} label={spec.label} value={spec.value} />
                ))}
              </View>
            </View>
          ) : null}

          <ReviewsSection
            canReview={product.can_review}
            onChanged={() => void load('refresh')}
            productId={product.id}
            ratingAverage={product.rating_avg}
            ratingCount={product.rating_count}
          />
        </ScrollView>

        <View style={styles.bar}>
          {message ? (
            <AppText accessibilityLiveRegion="polite" color="error" variant="bodySmall">
              {message}
            </AppText>
          ) : null}
          {justAdded ? (
            <View accessibilityLiveRegion="polite" style={styles.addedRow}>
              <Icon color={colors.semantic.success} name="checkCircle" size={18} />
              <AppText color="success" style={styles.addedText} variant="bodySmall" weight="700">
                {copy.added}
              </AppText>
              <AppButton
                onPress={() => navigation.navigate(StoreRoutes.StoreCart)}
                size="sm"
                title={copy.viewCart}
                variant="ghost"
              />
            </View>
          ) : null}
          <View style={styles.barRow}>
            <View style={styles.barPrice}>
              <AppText color="muted" variant="caption">
                {t.store.cart.total}
              </AppText>
              <AppText color="brand" numberOfLines={1} variant="title" weight="700">
                {total ?? '—'}
              </AppText>
            </View>
            <AppButton
              accessibilityLabel={
                block === null ? copy.addToCart : `${copy.addToCart}، ${blockText(block, copy)}`
              }
              disabled={block !== null}
              leftIcon={<Icon color={brand.onPrimary} name="cart" size={20} />}
              loading={adding}
              onPress={() => void handleAdd()}
              style={styles.addButton}
              title={block === 'outOfStock' ? copy.outOfStock : copy.addToCart}
            />
          </View>
        </View>
      </View>
    </AppScreen>
  );
}

function blockText(
  block: NonNullable<ReturnType<typeof addToCartBlock>>,
  copy: { outOfStock: string; noPrice: string; limitReached: string; selectOptions: string },
): string {
  switch (block) {
    case 'outOfStock':
      return copy.outOfStock;
    case 'noPrice':
      return copy.noPrice;
    case 'limitReached':
      return copy.limitReached;
    default:
      return copy.selectOptions;
  }
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.specRow}>
      <AppText color="secondary" style={styles.specLabel} variant="bodySmall">
        {label}
      </AppText>
      <AppText style={styles.specValue} variant="bodySmall" weight="600">
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    gap: spacing.lg,
    paddingHorizontal: layout.screenHorizontalPadding,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  skeleton: { gap: spacing.md, marginTop: spacing.md },
  block: { gap: spacing.xs },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  stockBlock: { gap: spacing.xs },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  group: { gap: spacing.sm },
  specs: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.default,
    overflow: 'hidden',
  },
  specRow: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.default,
    backgroundColor: colors.background.surface,
  },
  specLabel: { flex: 2 },
  specValue: { flex: 3 },
  bar: {
    ...shadows.md,
    gap: spacing.sm,
    paddingHorizontal: layout.screenHorizontalPadding,
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.default,
    backgroundColor: colors.background.surface,
  },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  barPrice: { flexShrink: 1, minWidth: 90 },
  addButton: { flex: 1 },
  addedRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  addedText: { flexShrink: 1 },
});
