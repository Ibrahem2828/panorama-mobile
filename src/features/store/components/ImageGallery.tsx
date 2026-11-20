import { useCallback, useEffect, useRef, useState } from 'react';
import type { ViewToken } from 'react-native';
import { FlatList, StyleSheet, View } from 'react-native';

import type { StoreProductImage } from '../../../api';
import { AppText } from '../../../components';
import { useTranslation } from '../../../i18n';
import { colors, radius, spacing, useBrand } from '../../../theme';
import { StoreImage } from './StoreImage';

type ImageGalleryProps = {
  images: StoreProductImage[];
  /** Fallback when the product has no pictures at all. */
  fallbackUri?: string | null;
  name: string;
  /** Slide to this image id when it changes (the picture of the chosen colour). */
  focusImageId?: number | null;
};

type GalleryItem = Pick<StoreProductImage, 'id' | 'url'>;

/** Keeps the picture from filling the whole screen on a tall phone: the details stay close below it. */
const MAX_HEIGHT = 300;

const VIEWABILITY = { itemVisiblePercentThreshold: 60 } as const;

/** Swipeable pictures of a product with position dots. Pinch is not needed. */
export function ImageGallery({ images, fallbackUri, name, focusImageId }: ImageGalleryProps) {
  const { t } = useTranslation();
  const brand = useBrand();
  const listRef = useRef<FlatList<GalleryItem>>(null);
  const [width, setWidth] = useState(0);
  const [index, setIndex] = useState(0);
  const items: GalleryItem[] =
    images.length > 0 ? images : fallbackUri ? [{ id: -1, url: fallbackUri }] : [];

  const onViewable = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const first = viewableItems[0];
    if (first && typeof first.index === 'number') setIndex(first.index);
  }, []);

  useEffect(() => {
    if (focusImageId === null || focusImageId === undefined || width === 0) return;
    const target = images.findIndex((image) => image.id === focusImageId);
    if (target >= 0) listRef.current?.scrollToIndex({ index: target, animated: true });
  }, [focusImageId, images, width]);

  return (
    <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)} style={styles.wrap}>
      {width > 0 ? (
        <FlatList
          data={items}
          getItemLayout={(_, itemIndex) => ({
            length: width,
            offset: width * itemIndex,
            index: itemIndex,
          })}
          horizontal
          keyExtractor={(item) => String(item.id)}
          onViewableItemsChanged={onViewable}
          pagingEnabled
          ref={listRef}
          renderItem={({ item, index: itemIndex }) => (
            <StoreImage
              accessibilityLabel={`${name}، ${t.store.product.galleryLabel(itemIndex + 1, items.length)}`}
              borderRadius={radius.xl}
              resizeMode="contain"
              style={{ width, height: Math.min(width, MAX_HEIGHT) }}
              uri={item.url}
            />
          )}
          showsHorizontalScrollIndicator={false}
          viewabilityConfig={VIEWABILITY}
        />
      ) : (
        <View style={styles.placeholder} />
      )}
      {items.length === 0 ? (
        <View style={[styles.empty, { width: width || '100%' }]}>
          <AppText color="muted" variant="bodySmall">
            {t.store.product.noImage}
          </AppText>
        </View>
      ) : null}
      {items.length > 1 ? (
        <View
          accessibilityLabel={t.store.product.galleryLabel(index + 1, items.length)}
          accessible
          style={styles.dots}
        >
          {items.map((item, dotIndex) => (
            <View
              key={item.id}
              style={[
                styles.dot,
                dotIndex === index
                  ? { backgroundColor: brand.primary, width: 18 }
                  : { backgroundColor: colors.border.strong },
              ]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm, overflow: 'hidden' },
  placeholder: { width: '100%', aspectRatio: 1, backgroundColor: colors.background.muted },
  empty: {
    position: 'absolute',
    top: 0,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
