import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { classifyApiError } from '../../../api/errorKind';
import type { StoreCartItem } from '../../../api';
import {
  AppButton,
  AppCard,
  AppHeader,
  AppScreen,
  AppText,
  AppTextInput,
  BrandRefreshControl,
  EmptyState,
  ErrorState,
  Icon,
  SkeletonList,
  useToastStore,
} from '../../../components';
import { useTranslation } from '../../../i18n';
import { useNetworkStore } from '../../../offline/networkStore';
import { StoreRoutes } from '../../../navigation/routes';
import type { StoreStackParamList } from '../../../navigation/types';
import { colors, layout, radius, spacing, useBrand } from '../../../theme';
import { CartLine } from '../components/CartLine';
import { CurrencySwitch } from '../components/CurrencySwitch';
import { cartTotalsFor, canCheckout, storeErrorMessage } from '../services';
import { useStoreStore } from '../store';

type Props = NativeStackScreenProps<StoreStackParamList, 'StoreCart'>;

const NOTES_MAX = 500;

export function StoreCartScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const brand = useBrand();
  const isOnline = useNetworkStore((state) => state.isOnline);
  const showToast = useToastStore((state) => state.show);
  const cart = useStoreStore((state) => state.cart);
  const currency = useStoreStore((state) => state.currency);
  const setCurrency = useStoreStore((state) => state.setCurrency);
  const loadCart = useStoreStore((state) => state.loadCart);
  const isLoading = useStoreStore((state) => state.isLoadingCart);
  const cartError = useStoreStore((state) => state.cartError);
  const busyItemId = useStoreStore((state) => state.busyItemId);
  const highlighted = useStoreStore((state) => state.highlightedVariants);
  const isPlacing = useStoreStore((state) => state.isPlacingOrder);
  const setQuantity = useStoreStore((state) => state.setQuantity);
  const removeItem = useStoreStore((state) => state.removeItem);
  const placeOrder = useStoreStore((state) => state.placeOrder);
  const clearHighlights = useStoreStore((state) => state.clearHighlights);
  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const copy = t.store.cart;

  useFocusEffect(
    useCallback(() => {
      void loadCart();
      return () => clearHighlights();
    }, [clearHighlights, loadCart]),
  );

  const totals = cartTotalsFor(cart, currency);
  const ready = canCheckout(cart, currency);

  async function change(item: StoreCartItem, quantity: number) {
    const result = await setQuantity(item.id, quantity);
    setMessage(result.ok ? null : storeErrorMessage(result.info, t.store));
  }

  async function remove(item: StoreCartItem) {
    const result = await removeItem(item.id);
    if (result.ok) {
      showToast(copy.removed);
      setMessage(null);
    } else setMessage(storeErrorMessage(result.info, t.store));
  }

  function confirmClear() {
    Alert.alert(copy.clearTitle, copy.clearMessage, [
      { text: copy.keep, style: 'cancel' },
      {
        text: copy.clearConfirm,
        style: 'destructive',
        onPress: () => {
          void (async () => {
            for (const item of useStoreStore.getState().cart?.items ?? []) {
              const result = await removeItem(item.id);
              if (!result.ok) {
                setMessage(storeErrorMessage(result.info, t.store));
                return;
              }
            }
          })();
        },
      },
    ]);
  }

  async function submit() {
    if (!ready || isPlacing) return;
    setMessage(null);
    const result = await placeOrder(notes);
    if (result.ok) {
      setNotes('');
      navigation.replace(StoreRoutes.StoreOrderSuccess, { orderId: result.data.id });
    } else {
      setMessage(storeErrorMessage(result.info, t.store));
    }
  }

  if (isLoading && !cart) {
    return (
      <AppScreen contentContainerStyle={styles.content} scroll>
        <AppHeader onBack={() => navigation.goBack()} showBack title={copy.title} />
        <SkeletonList count={3} />
      </AppScreen>
    );
  }

  if (!cart) {
    return (
      <AppScreen contentContainerStyle={styles.content} scroll>
        <AppHeader onBack={() => navigation.goBack()} showBack title={copy.title} />
        <ErrorState
          fallbackMessage={t.store.home.errorMessage}
          kind={classifyApiError(cartError, { deviceOnline: isOnline })}
          onRetry={() => void loadCart()}
          title={copy.errorTitle}
        />
      </AppScreen>
    );
  }

  if (cart.items.length === 0) {
    return (
      <AppScreen contentContainerStyle={styles.content} scroll>
        <AppHeader onBack={() => navigation.goBack()} showBack title={copy.title} />
        <EmptyState
          action={
            <AppButton
              onPress={() => navigation.navigate(StoreRoutes.StoreHome)}
              title={copy.browse}
            />
          }
          artwork="cart"
          message={copy.emptyMessage}
          title={copy.emptyTitle}
        />
      </AppScreen>
    );
  }

  return (
    <AppScreen horizontalPadding={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <BrandRefreshControl
              onRefresh={() => {
                setRefreshing(true);
                void loadCart().finally(() => setRefreshing(false));
              }}
              refreshing={refreshing}
            />
          }
        >
          <AppHeader
            onBack={() => navigation.goBack()}
            showBack
            subtitle={copy.itemsCount(cart.items_count)}
            title={copy.title}
          />

          <View style={styles.lines}>
            {cart.items.map((item) => (
              <CartLine
                busy={busyItemId === item.id}
                currency={currency}
                highlighted={highlighted.includes(item.variant.id)}
                item={item}
                key={item.id}
                onChangeQuantity={(line, quantity) => void change(line, quantity)}
                onOpen={(line) =>
                  navigation.navigate(StoreRoutes.StoreProduct, {
                    productId: line.product.id,
                    name: line.product.name,
                  })
                }
                onRemove={(line) => void remove(line)}
              />
            ))}
          </View>

          <AppCard variant="elevated">
            <View style={styles.summary}>
              <AppText variant="label" weight="700">
                {copy.currencyTitle}
              </AppText>
              <CurrencySwitch
                onChange={(next) => {
                  setMessage(null);
                  setCurrency(next);
                }}
                value={currency}
              />

              {totals ? (
                <View style={styles.totals}>
                  <View style={styles.totalRow}>
                    <AppText color="secondary" variant="bodySmall">
                      {copy.subtotal}
                    </AppText>
                    <AppText variant="bodySmall" weight="600">
                      {totals.subtotal}
                    </AppText>
                  </View>
                  {totals.rounding ? (
                    <View style={styles.totalRow}>
                      <AppText color="secondary" variant="bodySmall">
                        {copy.rounding}
                      </AppText>
                      <AppText variant="bodySmall" weight="600">
                        {totals.rounding}
                      </AppText>
                    </View>
                  ) : null}
                  <View style={[styles.totalRow, styles.grandRow]}>
                    <AppText variant="title">{copy.total}</AppText>
                    <AppText color="brand" variant="h3" weight="700">
                      {totals.total}
                    </AppText>
                  </View>
                </View>
              ) : (
                <AppText accessibilityLiveRegion="polite" color="error" variant="bodySmall">
                  {copy.totalUnavailable}
                </AppText>
              )}
            </View>
          </AppCard>

          <AppTextInput
            label={copy.notesLabel}
            maxLength={NOTES_MAX}
            multiline
            onChangeText={setNotes}
            placeholder={copy.notesPlaceholder}
            value={notes}
          />

          <View style={[styles.cash, { backgroundColor: brand.primarySoft }]}>
            <Icon color={brand.primary} name="receipt" size={22} />
            <AppText color="brand" style={styles.cashText} variant="bodySmall" weight="700">
              {copy.cashOnPickup}
            </AppText>
          </View>

          {message ? (
            <View accessibilityLiveRegion="polite" style={styles.alert}>
              <Icon color={colors.semantic.error} name="alert" size={20} />
              <AppText color="error" style={styles.alertText} variant="bodySmall" weight="600">
                {message}
              </AppText>
            </View>
          ) : !ready ? (
            <AppText color="secondary" variant="caption">
              {copy.fixIssues}
            </AppText>
          ) : null}

          <AppButton
            disabled={!ready}
            fullWidth
            loading={isPlacing}
            onPress={() => void submit()}
            size="lg"
            title={isPlacing ? copy.confirming : copy.confirm}
          />
          <AppButton
            disabled={isPlacing}
            fullWidth
            onPress={confirmClear}
            title={copy.clear}
            variant="ghost"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    gap: spacing.lg,
    paddingHorizontal: layout.screenHorizontalPadding,
    paddingBottom: spacing.xxl,
  },
  lines: { gap: spacing.md },
  summary: { gap: spacing.md },
  totals: { gap: spacing.sm },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  grandRow: {
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.default,
  },
  cash: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
  },
  cashText: { flex: 1 },
  alert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.semantic.errorSoft,
  },
  alertText: { flex: 1 },
});
