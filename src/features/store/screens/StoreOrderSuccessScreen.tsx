import { useEffect } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, View } from 'react-native';

import { AppButton, AppCard, AppScreen, AppText, Icon } from '../../../components';
import { useTranslation } from '../../../i18n';
import { StoreRoutes } from '../../../navigation/routes';
import type { StoreStackParamList } from '../../../navigation/types';
import { colors, radius, spacing, useBrand } from '../../../theme';
import { isolateLtr } from '../../../utils/rtl';
import { formatStoreMoney } from '../services';
import { useStoreStore } from '../store';

type Props = NativeStackScreenProps<StoreStackParamList, 'StoreOrderSuccess'>;

/** Shown right after checkout: the order code, what happens next and where to follow it. */
export function StoreOrderSuccessScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const brand = useBrand();
  const { orderId } = route.params;
  const order = useStoreStore((state) => state.orderDetails[String(orderId)]);
  const loadOrder = useStoreStore((state) => state.loadOrder);
  const copy = t.store.success;

  useEffect(() => {
    if (!order) void loadOrder(orderId);
  }, [loadOrder, order, orderId]);

  return (
    <AppScreen contentContainerStyle={styles.content} scroll>
      <View style={styles.hero}>
        <View
          accessibilityLabel={copy.artLabel}
          accessible
          style={[styles.disc, { backgroundColor: brand.primarySoft }]}
        >
          <View style={[styles.core, { backgroundColor: colors.semantic.success }]}>
            <Icon color={colors.text.inverse} name="check" size={44} strokeWidth={2.6} />
          </View>
        </View>
        <AppText accessibilityRole="header" align="center" variant="h2">
          {copy.title}
        </AppText>
        {order ? (
          <View style={styles.codeBox}>
            <AppText color="muted" variant="caption">
              {copy.codeLabel}
            </AppText>
            <AppText color="brand" selectable variant="h1" weight="700">
              {isolateLtr(order.code)}
            </AppText>
            <AppText color="secondary" variant="bodySmall">
              {`${copy.totalLabel}: ${formatStoreMoney(order.total, order.currency) ?? order.total}`}
            </AppText>
          </View>
        ) : null}
      </View>

      <AppCard variant="elevated">
        <View style={styles.steps}>
          <AppText variant="title">{copy.nextTitle}</AppText>
          {copy.steps.map((step, index) => (
            <View key={step} style={styles.step}>
              <View style={[styles.stepNumber, { backgroundColor: brand.primary }]}>
                <AppText style={{ color: brand.onPrimary }} variant="caption" weight="700">
                  {String(index + 1)}
                </AppText>
              </View>
              <AppText color="secondary" style={styles.stepText} variant="bodySmall">
                {step}
              </AppText>
            </View>
          ))}
          <View style={[styles.cash, { backgroundColor: brand.primarySoft }]}>
            <Icon color={brand.primary} name="receipt" size={20} />
            <AppText color="brand" style={styles.stepText} variant="bodySmall" weight="700">
              {t.store.cart.cashOnPickup}
            </AppText>
          </View>
        </View>
      </AppCard>

      <View style={styles.actions}>
        <AppButton
          fullWidth
          onPress={() => navigation.replace(StoreRoutes.StoreOrderDetails, { orderId })}
          title={copy.viewOrder}
        />
        <AppButton
          fullWidth
          onPress={() => navigation.popToTop()}
          title={copy.continueShopping}
          variant="outline"
        />
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.xl, paddingVertical: spacing.xl },
  hero: { alignItems: 'center', gap: spacing.md },
  disc: {
    width: 148,
    height: 148,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 74,
  },
  core: {
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 44,
  },
  codeBox: { alignItems: 'center', gap: 2 },
  steps: { gap: spacing.md },
  step: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  stepNumber: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
  },
  stepText: { flex: 1 },
  cash: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
  },
  actions: { gap: spacing.md },
});
