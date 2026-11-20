import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';

import type { StoreBrand, StoreCategory, StoreOrdering } from '../../../api';
import { AppButton, AppText } from '../../../components';
import { AppModal } from '../../../components/overlay';
import { useTranslation } from '../../../i18n';
import { colors, radius, shadows, spacing } from '../../../theme';
import { STORE_ORDERINGS } from '../services';
import { StoreChip } from './StoreChip';

export type StoreFilters = {
  brand: number | null;
  category: number | null;
  inStock: boolean;
  ordering: StoreOrdering;
};

export const DEFAULT_FILTERS: StoreFilters = {
  brand: null,
  category: null,
  inStock: false,
  ordering: 'popular',
};

/** How many filters differ from the defaults (shown as a number on the filter button). */
export function activeFilterCount(filters: StoreFilters): number {
  return (
    (filters.brand !== null ? 1 : 0) +
    (filters.category !== null ? 1 : 0) +
    (filters.inStock ? 1 : 0) +
    (filters.ordering !== DEFAULT_FILTERS.ordering ? 1 : 0)
  );
}

type FilterSheetProps = {
  visible: boolean;
  filters: StoreFilters;
  brands: StoreBrand[];
  categories: StoreCategory[];
  onApply: (filters: StoreFilters) => void;
  onClose: () => void;
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <AppText accessibilityRole="header" variant="label" weight="700">
        {title}
      </AppText>
      <View style={styles.wrap}>{children}</View>
    </View>
  );
}

function SheetBody({
  filters,
  brands,
  categories,
  onApply,
  onClose,
}: Omit<FilterSheetProps, 'visible'>) {
  const { t } = useTranslation();
  const { height } = useWindowDimensions();
  const [draft, setDraft] = useState<StoreFilters>(filters);
  const copy = t.store.filters;

  useEffect(() => setDraft(filters), [filters]);

  return (
    <View style={styles.overlay}>
      <Pressable
        accessibilityLabel={copy.close}
        accessibilityRole="button"
        onPress={onClose}
        style={StyleSheet.absoluteFill}
      />
      <View accessibilityViewIsModal style={[styles.sheet, { maxHeight: height * 0.88 }]}>
        <View style={styles.grabber} />
        <View style={styles.headerRow}>
          <AppText accessibilityRole="header" variant="title">
            {copy.title}
          </AppText>
          <Pressable
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => setDraft(DEFAULT_FILTERS)}
            style={styles.resetButton}
          >
            <AppText color="brand" variant="bodySmall" weight="700">
              {copy.reset}
            </AppText>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.content} style={styles.scroll}>
          <Section title={copy.sortTitle}>
            {STORE_ORDERINGS.map((ordering) => (
              <StoreChip
                key={ordering}
                label={copy.orderings[ordering]}
                onPress={() => setDraft({ ...draft, ordering })}
                selected={draft.ordering === ordering}
              />
            ))}
          </Section>
          {brands.length > 0 ? (
            <Section title={copy.brandTitle}>
              <StoreChip
                label={copy.any}
                onPress={() => setDraft({ ...draft, brand: null })}
                selected={draft.brand === null}
              />
              {brands.map((item) => (
                <StoreChip
                  key={item.id}
                  label={item.name}
                  onPress={() => setDraft({ ...draft, brand: item.id })}
                  selected={draft.brand === item.id}
                />
              ))}
            </Section>
          ) : null}
          {categories.length > 0 ? (
            <Section title={copy.categoryTitle}>
              <StoreChip
                label={copy.any}
                onPress={() => setDraft({ ...draft, category: null })}
                selected={draft.category === null}
              />
              {categories.map((item) => (
                <StoreChip
                  key={item.id}
                  label={item.name}
                  onPress={() => setDraft({ ...draft, category: item.id })}
                  selected={draft.category === item.id}
                />
              ))}
            </Section>
          ) : null}
          <Section title={copy.availabilityTitle}>
            <StoreChip
              label={copy.inStockOnly}
              onPress={() => setDraft({ ...draft, inStock: !draft.inStock })}
              selected={draft.inStock}
            />
          </Section>
        </ScrollView>
        <View style={[styles.footer, { borderTopColor: colors.border.default }]}>
          <AppButton
            fullWidth
            onPress={() => {
              onApply(draft);
              onClose();
            }}
            title={copy.apply}
          />
        </View>
      </View>
    </View>
  );
}

/** Bottom sheet with the sort order, brand, category and "in stock only" choices; applied together with one button. */
export function FilterSheet({ visible, ...rest }: FilterSheetProps) {
  return (
    <AppModal animationType="slide" onRequestClose={rest.onClose} transparent visible={visible}>
      {visible ? <SheetBody {...rest} /> : <View />}
    </AppModal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.overlay },
  sheet: {
    ...shadows.card,
    borderTopStartRadius: radius.xxl,
    borderTopEndRadius: radius.xxl,
    backgroundColor: colors.background.surface,
  },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    marginTop: spacing.sm,
    borderRadius: 2,
    backgroundColor: colors.border.default,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  resetButton: { minHeight: 44, justifyContent: 'center' },
  scroll: { flexShrink: 1 },
  content: { gap: spacing.lg, paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  section: { gap: spacing.sm },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
