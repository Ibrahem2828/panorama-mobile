import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import type { StoreBrand } from '../../../api';
import { AppText } from '../../../components';
import { useTranslation } from '../../../i18n';
import { colors, radius, spacing, useBrand } from '../../../theme';
import { StoreImage } from './StoreImage';

type BrandStripProps = {
  brands: StoreBrand[];
  selectedId: number | null;
  onSelect: (id: number | null) => void;
};

const TILE = 64;

function BrandTile({
  label,
  selected,
  onPress,
  children,
  accessibilityLabel,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  children: ReactNode;
  accessibilityLabel: string;
}) {
  const brand = useBrand();

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={styles.item}
    >
      <View
        style={[
          styles.tile,
          selected
            ? { borderColor: brand.primary, borderWidth: 2, backgroundColor: brand.primarySoft }
            : null,
        ]}
      >
        {children}
      </View>
      <AppText
        align="center"
        color={selected ? 'brand' : 'secondary'}
        numberOfLines={2}
        style={styles.label}
        variant="caption"
        weight={selected ? '700' : '600'}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

/** Horizontal strip of brand logos (authenticated pictures); tapping one filters the grid. */
export function BrandStrip({ brands, selectedId, onSelect }: BrandStripProps) {
  const { t } = useTranslation();
  const brand = useBrand();

  if (brands.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <AppText accessibilityRole="header" variant="label" weight="700">
        {t.store.home.brandsTitle}
      </AppText>
      <ScrollView
        contentContainerStyle={styles.row}
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        <BrandTile
          accessibilityLabel={t.store.home.brandsAll}
          label={t.store.home.brandsAll}
          onPress={() => onSelect(null)}
          selected={selectedId === null}
        >
          <AppText color="brand" variant="subtitle" weight="700">
            {t.store.home.brandsAll}
          </AppText>
        </BrandTile>
        {brands.map((item) => (
          <BrandTile
            accessibilityLabel={t.store.home.brandLabel(item.name)}
            key={item.id}
            label={item.name}
            onPress={() => onSelect(selectedId === item.id ? null : item.id)}
            selected={selectedId === item.id}
          >
            {item.logo_url ? (
              <StoreImage
                borderRadius={radius.md}
                fallbackIcon="bag"
                resizeMode="contain"
                style={styles.logo}
                uri={item.logo_url}
              />
            ) : (
              <AppText style={{ color: brand.primary }} variant="title" weight="700">
                {item.name.slice(0, 1)}
              </AppText>
            )}
          </BrandTile>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  row: { gap: spacing.md, paddingVertical: 2 },
  item: { width: TILE + 8, alignItems: 'center', gap: 4, minHeight: 44 },
  tile: {
    width: TILE,
    height: TILE,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.background.surface,
  },
  logo: { width: TILE - 12, height: TILE - 12, backgroundColor: 'transparent' },
  label: { width: '100%' },
});
