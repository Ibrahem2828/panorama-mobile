import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { StoreCartItem, StoreCurrency } from '../../../api';
import { AppText, Icon } from '../../../components';
import { useTranslation } from '../../../i18n';
import { colors, radius, spacing } from '../../../theme';
import {
  DEFAULT_MAX_PER_LINE,
  cartLineIssue,
  formatStoreMoney,
  lineTotal,
  priceIn,
  safeHex,
} from '../services';
import { QuantityStepper } from './QuantityStepper';
import { StoreImage } from './StoreImage';

type CartLineProps = {
  item: StoreCartItem;
  currency: StoreCurrency;
  highlighted: boolean;
  busy: boolean;
  onChangeQuantity: (item: StoreCartItem, quantity: number) => void;
  onRemove: (item: StoreCartItem) => void;
  onOpen: (item: StoreCartItem) => void;
};

/** One cart line: picture, name, chosen colour/size, unit price, quantity stepper and remove. */
export const CartLine = memo(function CartLine({
  item,
  currency,
  highlighted,
  busy,
  onChangeQuantity,
  onRemove,
  onOpen,
}: CartLineProps) {
  const { t } = useTranslation();
  const copy = t.store.cart;
  const issue = cartLineIssue(item, currency);
  const unit = formatStoreMoney(priceIn(item.prices, currency), currency);
  const total = lineTotal(item, currency);
  const variantParts = [item.variant.colour_name, item.variant.size_label].filter(Boolean);
  const issueText =
    issue === 'noPrice'
      ? copy.lineNoPrice
      : issue === 'unavailable'
        ? copy.lineUnavailable
        : issue === 'insufficient'
          ? copy.lineInsufficient(item.available)
          : null;
  // The per-order cap is not part of the cart payload: the server answers with its own limit if it is lower.
  const max = Math.max(1, Math.min(item.available, DEFAULT_MAX_PER_LINE));

  return (
    <View
      style={[
        styles.card,
        highlighted || issue ? { borderColor: colors.semantic.error, borderWidth: 1.5 } : null,
      ]}
    >
      <View style={styles.topRow}>
        <Pressable
          accessibilityLabel={item.product.name}
          accessibilityRole="button"
          onPress={() => onOpen(item)}
          style={styles.thumbTouch}
        >
          <StoreImage borderRadius={radius.md} style={styles.thumb} uri={item.thumb_url} />
        </Pressable>
        <View style={styles.info}>
          <Pressable accessibilityRole="button" onPress={() => onOpen(item)}>
            <AppText numberOfLines={2} variant="bodySmall" weight="700">
              {item.product.name}
            </AppText>
          </Pressable>
          {item.product.brand ? (
            <AppText color="muted" numberOfLines={1} variant="caption">
              {item.product.brand}
            </AppText>
          ) : null}
          {variantParts.length > 0 ? (
            <View style={styles.variantRow}>
              {item.variant.colour_hex ? (
                <View style={[styles.dot, { backgroundColor: safeHex(item.variant.colour_hex) }]} />
              ) : null}
              <AppText
                color="secondary"
                numberOfLines={1}
                style={styles.variantText}
                variant="caption"
              >
                {variantParts.join(' · ')}
              </AppText>
            </View>
          ) : null}
          {unit ? (
            <AppText color="secondary" variant="caption">
              {copy.unitPrice(unit)}
            </AppText>
          ) : null}
        </View>
        <Pressable
          accessibilityLabel={copy.removeLabel(item.product.name)}
          accessibilityRole="button"
          disabled={busy}
          hitSlop={4}
          onPress={() => onRemove(item)}
          style={styles.remove}
        >
          <Icon color={colors.semantic.error} name="trash" size={20} />
        </Pressable>
      </View>
      {issueText ? (
        <View accessibilityLiveRegion="polite" style={styles.issueRow}>
          <Icon color={colors.semantic.error} name="alert" size={16} />
          <AppText color="error" style={styles.issueText} variant="caption" weight="700">
            {issueText}
          </AppText>
        </View>
      ) : null}
      <View style={styles.bottomRow}>
        <QuantityStepper
          busy={busy}
          decreaseLabel={copy.decrease(item.product.name)}
          increaseLabel={copy.increase(item.product.name)}
          max={max}
          // A line above what is left goes straight down to what is left, not one step at a time.
          onChange={(quantity) =>
            onChangeQuantity(item, quantity < item.quantity ? Math.min(quantity, max) : quantity)
          }
          value={item.quantity}
          valueLabel={copy.quantityOf(item.product.name, item.quantity)}
        />
        <AppText
          color="brand"
          numberOfLines={1}
          style={styles.total}
          variant="subtitle"
          weight="700"
        >
          {total ?? '—'}
        </AppText>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.default,
    backgroundColor: colors.background.surface,
  },
  topRow: { flexDirection: 'row', gap: spacing.md },
  thumbTouch: { width: 76, height: 76 },
  thumb: { width: 76, height: 76 },
  info: { flex: 1, gap: 2 },
  variantRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  variantText: { flexShrink: 1 },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border.strong,
  },
  remove: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  issueRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  issueText: { flexShrink: 1 },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  total: { flexShrink: 1 },
});
