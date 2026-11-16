import { StyleSheet, View } from 'react-native';

import { AppIconButton, AppText, Icon } from '../../../components';
import { useTranslation } from '../../../i18n';
import { colors, useBrand } from '../../../theme';
import { useStoreStore } from '../store';

type StoreHeaderActionsProps = {
  onOpenCart?: () => void;
  onOpenOrders?: () => void;
};

/** Cart (with the number of items) and "my orders" buttons that sit in the store screens' headers. */
export function StoreHeaderActions({ onOpenCart, onOpenOrders }: StoreHeaderActionsProps) {
  const { t } = useTranslation();
  const brand = useBrand();
  const count = useStoreStore((state) => state.cart?.items_count ?? 0);

  return (
    <View style={styles.row}>
      {onOpenOrders ? (
        <AppIconButton
          accessibilityLabel={t.store.home.ordersLabel}
          icon={<Icon color={colors.text.primary} name="receipt" size={22} />}
          onPress={onOpenOrders}
          shape="circle"
          size="sm"
          variant="surface"
        />
      ) : null}
      {onOpenCart ? (
        <View>
          <AppIconButton
            accessibilityLabel={
              count > 0 ? t.store.home.cartLabelWithCount(count) : t.store.home.cartLabel
            }
            icon={<Icon color={colors.text.primary} name="cart" size={22} />}
            onPress={onOpenCart}
            shape="circle"
            size="sm"
            variant="surface"
          />
          {count > 0 ? (
            <View pointerEvents="none" style={[styles.badge, { backgroundColor: brand.accent }]}>
              <AppText color="inverse" style={styles.badgeText} variant="caption" weight="700">
                {count > 99 ? '99+' : String(count)}
              </AppText>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: {
    position: 'absolute',
    top: -4,
    end: -4,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  badgeText: { fontSize: 11, lineHeight: 16 },
});
