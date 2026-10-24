import { memo, useCallback, useEffect, useRef } from 'react';
import { FlatList, Image, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '../../components';
import { colors, radius, spacing, useBrand } from '../../theme';
import type { ViewerPages } from '../lectures/hooks/useViewerPages';

type Props = {
  pageCount: number;
  current: number;
  pages: ViewerPages;
  onSelect: (page: number) => void;
};

const ITEM_WIDTH = 64;
const ITEM_GAP = spacing.xs;

type ThumbProps = {
  page: number;
  selected: boolean;
  pages: ViewerPages;
  onSelect: (page: number) => void;
};

const Thumb = memo(function Thumb({ page, selected, pages, onSelect }: ThumbProps) {
  const brand = useBrand();
  const source = pages.ready ? pages.getSource('thumbnail', page) : null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={() => onSelect(page)}
      style={[styles.item, selected ? { borderColor: brand.primary, borderWidth: 2 } : null]}
    >
      {source ? (
        // Android only forwards headers when `source` is an array.
        <Image
          accessibilityIgnoresInvertColors
          resizeMode="cover"
          source={[source]}
          style={styles.image}
        />
      ) : (
        <View style={styles.image} />
      )}
      <AppText align="center" color={selected ? 'brand' : 'muted'} variant="caption">
        {page}
      </AppText>
    </Pressable>
  );
});

/**
 * Page thumbnails strip. Virtualised (a 300-page document only ever holds a few dozen small images) and scrolled to
 * the current page; each thumbnail is a ~240 px image streamed with the viewer session, never saved to storage.
 */
export const ThumbnailStrip = memo(function ThumbnailStrip({
  pageCount,
  current,
  pages,
  onSelect,
}: Props) {
  const listRef = useRef<FlatList<number>>(null);
  const data = useRef(Array.from({ length: pageCount }, (_, index) => index + 1)).current;

  useEffect(() => {
    if (current >= 1 && current <= pageCount) {
      listRef.current?.scrollToIndex({ index: current - 1, viewPosition: 0.5, animated: true });
    }
  }, [current, pageCount]);

  const renderItem = useCallback(
    ({ item }: { item: number }) => (
      <Thumb onSelect={onSelect} page={item} pages={pages} selected={item === current} />
    ),
    [current, onSelect, pages],
  );

  return (
    <FlatList
      data={data}
      getItemLayout={(_data, index) => ({
        length: ITEM_WIDTH + ITEM_GAP,
        offset: (ITEM_WIDTH + ITEM_GAP) * index,
        index,
      })}
      horizontal
      initialNumToRender={8}
      keyExtractor={(item) => String(item)}
      maxToRenderPerBatch={6}
      onScrollToIndexFailed={() => undefined}
      ref={listRef}
      removeClippedSubviews
      renderItem={renderItem}
      showsHorizontalScrollIndicator={false}
      style={styles.list}
      windowSize={5}
    />
  );
});

const styles = StyleSheet.create({
  list: {
    flexGrow: 0,
    backgroundColor: colors.background.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.default,
  },
  item: {
    width: ITEM_WIDTH,
    marginEnd: ITEM_GAP,
    marginVertical: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    overflow: 'hidden',
    alignItems: 'center',
  },
  image: { width: ITEM_WIDTH, height: 84, backgroundColor: colors.background.muted },
});
