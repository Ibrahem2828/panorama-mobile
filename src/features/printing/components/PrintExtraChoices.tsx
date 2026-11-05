import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Icon, Stack } from '../../../components';
import type { PrintExtraOption } from '../../../api/types';
import { useTranslation } from '../../../i18n';
import { formatPrintMoney } from '../services/printingService';
import { colors, layout, opacity, radius, spacing, useBrand } from '../../../theme';
import {
  formatExtraPrice,
  selectExtra,
  selectExtraInGroup,
  type PrintExtraGroup,
  type PrintExtraSelection,
  type PrintExtraUnitLabels,
} from '../services/printExtras';

type PrintExtraChoicesProps = {
  group: PrintExtraGroup;
  selection: PrintExtraSelection;
  currency: string;
  onChange: (selection: PrintExtraSelection) => void;
};

export function usePrintExtraUnitLabels(): PrintExtraUnitLabels {
  const { t } = useTranslation();
  const copy = t.printing.options.extras;

  return { per_copy: copy.perCopy, per_50_sheets: copy.per50Sheets, per_sheet: copy.perSheet };
}

type RowProps = {
  label: string;
  price?: string;
  description?: string;
  swatch?: string;
  selected: boolean;
  onPress: () => void;
};

function ChoiceRow({ label, price, description, swatch, selected, onPress }: RowProps) {
  const brand = useBrand();

  return (
    <Pressable
      accessibilityLabel={price ? `${label}: ${price}` : label}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        selected
          ? { borderColor: brand.primary, backgroundColor: brand.primarySoft, borderWidth: 2 }
          : null,
        pressed ? styles.pressed : null,
      ]}
    >
      <View
        style={[styles.radio, { borderColor: selected ? brand.primary : colors.border.strong }]}
      >
        {selected ? <Icon color={brand.primary} name="check" size={14} strokeWidth={2.8} /> : null}
      </View>
      {swatch ? <View style={[styles.swatch, { backgroundColor: swatch }]} /> : null}
      <View style={styles.texts}>
        <AppText color={selected ? 'brand' : 'primary'} variant="label">
          {label}
        </AppText>
        {description ? (
          <AppText color="muted" variant="caption">
            {description}
          </AppText>
        ) : null}
        {price ? (
          <AppText color="secondary" variant="caption" weight="600">
            {price}
          </AppText>
        ) : null}
      </View>
    </Pressable>
  );
}

/**
 * One optional choice list of the shop's order form («لا شيء» by default). A list made of two sections (transparency:
 * required / not required) shows them as two headings of the same list, and only one option can be chosen in it.
 */
export function PrintExtraChoices({
  group,
  selection,
  currency,
  onChange,
}: PrintExtraChoicesProps) {
  const { t } = useTranslation();
  const copy = t.printing.options.extras;
  const units = usePrintExtraUnitLabels();
  const chosen = group.sections.some((entry) => Boolean(selection[entry.section]));
  const headed = group.sections.length > 1;
  const headings: Record<string, string> = {
    front_transparency_required: copy.required,
    front_transparency_optional: copy.notRequired,
    back_transparency_required: copy.required,
    back_transparency_optional: copy.notRequired,
  };

  const price = (option: PrintExtraOption) =>
    formatExtraPrice(option, formatPrintMoney(option.price, currency), units, copy.free);

  return (
    <Stack gap="sm">
      <AppText variant="label">{copy.groups[group.key]}</AppText>
      <ChoiceRow
        label={copy.none}
        onPress={() =>
          onChange(
            group.sections.reduce((next, entry) => selectExtra(next, entry.section, ''), selection),
          )
        }
        selected={!chosen}
      />
      {group.sections.map((entry) => (
        <Stack gap="sm" key={entry.section}>
          {headed ? (
            <AppText color="muted" variant="caption" weight="700">
              {headings[entry.section] ?? entry.label}
            </AppText>
          ) : null}
          {entry.options.map((option) => (
            <ChoiceRow
              description={option.description}
              key={`${entry.section}:${option.code}`}
              label={option.name}
              onPress={() =>
                onChange(selectExtraInGroup(selection, group, entry.section, option.code))
              }
              price={price(option)}
              selected={selection[entry.section] === option.code}
              swatch={option.color_hex}
            />
          ))}
        </Stack>
      ))}
    </Stack>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: layout.touchTargetMinSize,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.background.surface,
  },
  pressed: { opacity: opacity.pressed },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatch: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border.strong,
  },
  texts: { flex: 1, minWidth: 0, gap: 2 },
});
