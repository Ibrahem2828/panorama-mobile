import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, AppTextInput, CheckboxRow, Stack } from '../../../components';
import { useTranslation } from '../../../i18n';
import { colors, radius, spacing, useBrand } from '../../../theme';
import {
  DUPLEX_FLIPS,
  N_UP_DIRECTIONS,
  ORIENTATIONS,
  PAGES_PER_SHEET_VALUES,
  parsePageRange,
  type PagesPerSheet,
} from '../services/printOptions';
import { usePrintingStore } from '../store';
import type { PrintCartItem } from '../types';
import { PrintChoiceChips, type PrintChoice } from './PrintChoiceChips';

type PrintItemOptionsProps = {
  item: PrintCartItem;
  /** Pages of the document when known (a converted file, or after a quote): lets the range be checked against it. */
  pages?: number | null;
  onChange: (patch: Partial<Omit<PrintCartItem, 'key'>>) => void;
};

/** Built-in bindings shown until the shop's own list has loaded (or when it cannot be reached). */
const FALLBACK_BINDINGS = ['none', 'staple', 'spiral', 'thermal'] as const;

export function usePrintOptionLabels(): Record<string, string> {
  const { t } = useTranslation();
  const bindingTypes = usePrintingStore((state) => state.options?.binding_types);

  return useMemo(() => {
    const labels: Record<string, string> = {
      black_white: t.printing.options.colorBlackWhite,
      color: t.printing.options.colorColored,
      one_sided: t.printing.options.sidesSingle,
      double_sided: t.printing.options.sidesDouble,
      A4: 'A4',
      A3: 'A3',
      A5: 'A5',
      none: t.printing.options.bindingNone,
      staple: t.printing.options.bindingStaple,
      spiral: t.printing.options.bindingSpiral,
      thermal: t.printing.options.bindingThermal,
      beads: t.printing.options.bindingBeads,
    };

    // A type the shop configured is named by the shop (in Arabic), whatever the built-in label was.
    bindingTypes?.forEach((type) => {
      labels[type.code] = type.name || labels[type.code] || type.code;
    });

    return labels;
  }, [bindingTypes, t]);
}

function choices<T extends string>(
  values: readonly T[],
  labels: Record<string, string>,
): PrintChoice<T>[] {
  return values.map((value) => ({ value, label: labels[value] ?? value }));
}

export function PrintItemOptions({ item, pages = null, onChange }: PrintItemOptionsProps) {
  const { t } = useTranslation();
  const brand = useBrand();
  const labels = usePrintOptionLabels();
  const options = usePrintingStore((state) => state.options);
  const copy = t.printing.options;
  const double = item.sides === 'double_sided';
  const bindingValues: readonly string[] = options
    ? ['none', ...options.binding_types.map((type) => type.code)]
    : FALLBACK_BINDINGS;
  const bindingType = options?.binding_types.find((type) => type.code === item.binding);
  const range = parsePageRange(item.pageRange, pages);
  const rangeProblem = item.pageRange.trim() && !range.ok ? range.reason : null;

  return (
    <Stack gap="lg">
      <PrintChoiceChips
        label={copy.color}
        onChange={(colorMode) => onChange({ colorMode })}
        options={choices(['black_white', 'color'] as const, labels)}
        value={item.colorMode}
      />
      <PrintChoiceChips
        label={copy.paperSize}
        onChange={(paperSize) => onChange({ paperSize })}
        options={choices(['A4', 'A3', 'A5'] as const, labels)}
        value={item.paperSize}
      />
      <PrintChoiceChips
        label={copy.sides}
        onChange={(sides) => onChange({ sides })}
        options={choices(['one_sided', 'double_sided'] as const, labels)}
        value={item.sides}
      />
      {double ? (
        <PrintChoiceChips
          label={copy.flip}
          onChange={(duplexFlip) => onChange({ duplexFlip })}
          options={DUPLEX_FLIPS.map((value) => ({ value, label: copy.flips[value] }))}
          value={item.duplexFlip}
        />
      ) : null}
      <PrintChoiceChips
        label={copy.pagesPerSheet}
        onChange={(value) => onChange({ pagesPerSheet: Number(value) as PagesPerSheet })}
        options={PAGES_PER_SHEET_VALUES.map((value) => ({
          value: String(value),
          label: String(value),
        }))}
        value={String(item.pagesPerSheet)}
      />
      {item.pagesPerSheet > 1 ? (
        <PrintChoiceChips
          label={copy.direction}
          onChange={(nUpDirection) => onChange({ nUpDirection })}
          options={N_UP_DIRECTIONS.map((value) => ({ value, label: copy.directions[value] }))}
          value={item.nUpDirection}
        />
      ) : null}
      <PrintChoiceChips
        label={copy.orientation}
        onChange={(orientation) => onChange({ orientation })}
        options={ORIENTATIONS.map((value) => ({ value, label: copy.orientations[value] }))}
        value={item.orientation}
      />
      <AppTextInput
        autoCapitalize="none"
        error={rangeProblem ? copy.rangeErrors[rangeProblem] : undefined}
        helperText={
          !rangeProblem ? (pages ? copy.rangeHintWithTotal(pages) : copy.rangeHint) : undefined
        }
        label={copy.pageRange}
        onChangeText={(pageRange) => onChange({ pageRange })}
        placeholder={copy.rangePlaceholder}
        value={item.pageRange}
      />
      {item.copies > 1 ? (
        <CheckboxRow
          accessibilityLabel={copy.collate}
          checked={item.collate}
          label={copy.collateHint}
          onToggle={() => onChange({ collate: !item.collate })}
        />
      ) : null}
      <PrintChoiceChips
        label={copy.binding}
        onChange={(binding) => onChange({ binding })}
        options={choices(bindingValues, labels)}
        value={item.binding}
      />
      {bindingType?.description ? (
        <AppText color="muted" variant="caption">
          {bindingType.description}
        </AppText>
      ) : null}
      {bindingType?.price_mode === 'per_wire_kg' ? (
        <AppText color="muted" variant="caption">
          {copy.wirePriced}
        </AppText>
      ) : null}
      {options && options.covers.length > 0 ? (
        <Stack gap="sm">
          <AppText variant="label">{copy.cover}</AppText>
          <View style={styles.covers}>
            {[{ code: '', name: copy.coverNone, color_hex: '' }, ...options.covers].map((cover) => {
              const selected = item.cover === cover.code;

              return (
                <Pressable
                  accessibilityLabel={cover.name}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  key={cover.code || 'none'}
                  onPress={() => onChange({ cover: cover.code })}
                  style={[
                    styles.cover,
                    selected
                      ? { borderColor: brand.primary, backgroundColor: brand.primarySoft }
                      : null,
                  ]}
                >
                  {cover.color_hex ? (
                    <View style={[styles.swatch, { backgroundColor: cover.color_hex }]} />
                  ) : null}
                  <AppText color={selected ? 'brand' : 'primary'} variant="label">
                    {cover.name}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </Stack>
      ) : null}
    </Stack>
  );
}

const styles = StyleSheet.create({
  covers: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  cover: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  swatch: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border.strong,
  },
});
