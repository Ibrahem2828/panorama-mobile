import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { StoreCurrency, StoreProductCard } from '../../../api';
import { AppText } from '../../../components';
import { useTranslation } from '../../../i18n';
import { colors, radius, shadows, spacing, useBrand } from '../../../theme';
import { formatRatingValue, formatStoreMoney, priceIn } from '../services';
import { RatingStars } from './RatingStars';
import { StoreImage } from './StoreImage';

type ProductCardProps = {
  product: StoreProductCard;
  currency: StoreCurrency;
  onPress: (product: StoreProductCard) => void;
};

/** One product of the grid: picture, name, brand, rating and the lowest price in the chosen currency. */
export const ProductCard = memo(function ProductCard({
  product,
  currency,
  onPress,
}: ProductCardProps) {
  const { t } = useTranslation();
  const brand = useBrand();
  const copy = t.store.card;
  const price = formatStoreMoney(priceIn(product.price_from, currency), currency);
  const rating = formatRatingValue(product.rating_avg);
  const brandName = product.brand?.name ?? '';

  return (
    <Pressable
      accessibilityLabel={`${copy.a11y(product.name, brandName, price ? copy.priceFrom(price) : copy.noPrice)}${
        product.in_stock ? '' : `، ${copy.outOfStock}`
      }`}
      accessibilityRole="button"
      android_ripple={{ color: brand.primarySoft }}
      onPress={() => onPress(product)}
      style={({ pressed }) => [styles.card, pressed ? styles.pressed : null]}
    >
      <View>
        <StoreImage
          accessibilityLabel={product.name}
          borderRadius={0}
          style={styles.image}
          uri={product.thumb_url ?? product.image_url}
        />
        {!product.in_stock ? (
          <View style={[styles.badge, { backgroundColor: colors.text.primary }]}>
            <AppText color="inverse" variant="caption" weight="700">
              {copy.outOfStock}
            </AppText>
          </View>
        ) : null}
      </View>
      <View style={styles.body}>
        <AppText numberOfLines={2} style={styles.name} variant="bodySmall" weight="700">
          {product.name}
        </AppText>
        {brandName ? (
          <AppText color="muted" numberOfLines={1} variant="caption">
            {brandName}
          </AppText>
        ) : null}
        <View
          accessibilityLabel={copy.ratingA11y(rating, product.rating_count)}
          accessible
          style={styles.ratingRow}
        >
          <RatingStars size={13} value={product.rating_avg} />
          <AppText color="muted" variant="caption">
            {product.rating_count > 0
              ? `${rating} ${copy.ratingCount(product.rating_count)}`
              : copy.noRatings}
          </AppText>
        </View>
        <View style={styles.spacer} />
        <AppText
          color={price ? 'brand' : 'muted'}
          numberOfLines={2}
          variant={price ? 'subtitle' : 'caption'}
          weight="700"
        >
          {price ? copy.priceFrom(price) : copy.noPrice}
        </AppText>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    ...shadows.card,
    flex: 1,
    overflow: 'hidden',
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.default,
    backgroundColor: colors.background.surface,
  },
  pressed: { opacity: 0.9 },
  image: { width: '100%', aspectRatio: 1 },
  badge: {
    position: 'absolute',
    top: spacing.sm,
    start: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  body: { flex: 1, gap: 4, padding: spacing.md },
  name: { minHeight: 44 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexWrap: 'wrap' },
  spacer: { flexGrow: 1 },
});
