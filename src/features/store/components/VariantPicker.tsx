import { Pressable, StyleSheet, View } from 'react-native';

import type { StoreCurrency, StoreVariant } from '../../../api';
import { AppText, Icon } from '../../../components';
import { useTranslation } from '../../../i18n';
import { colors, radius, spacing, useBrand } from '../../../theme';
import {
  colourOptions,
  isLightHex,
  safeHex,
  selectColour,
  selectSize,
  sizeOptions,
  type VariantSelection,
} from '../services';

type VariantPickerProps = {
  variants: StoreVariant[];
  selection: VariantSelection;
  currency: StoreCurrency;
  onChange: (selection: VariantSelection) => void;
};

/** Colour swatches and size chips. Combinations that do not exist or are sold out are dimmed and say so to screen readers. */
export function VariantPicker({ variants, selection, currency, onChange }: VariantPickerProps) {
  const { t } = useTranslation();
  const brand = useBrand();
  const colourList = colourOptions(variants, selection, currency);
  const sizeList = sizeOptions(variants, selection, currency);
  const chosenColour = colourList.find((option) => option.selected);
  const copy = t.store.product;

  return (
    <View style={styles.wrap}>
      {colourList.length > 0 ? (
        <View style={styles.group}>
          <AppText variant="label" weight="700">
            {copy.colour}
            {chosenColour ? (
              <AppText color="secondary" variant="label">{`  ${chosenColour.name}`}</AppText>
            ) : null}
          </AppText>
          <View style={styles.row}>
            {colourList.map((option) => {
              const dim = option.state !== 'available';
              const hex = safeHex(option.hex);

              return (
                <Pressable
                  accessibilityLabel={
                    option.selected
                      ? copy.optionSelected(option.name)
                      : dim
                        ? copy.optionOutOfStock(option.name)
                        : option.name
                  }
                  accessibilityRole="radio"
                  accessibilityState={{ selected: option.selected, checked: option.selected }}
                  key={option.key}
                  onPress={() => onChange(selectColour(variants, selection, option.key, currency))}
                  style={styles.swatchTouch}
                >
                  <View
                    style={[
                      styles.swatchRing,
                      option.selected ? { borderColor: brand.primary } : null,
                    ]}
                  >
                    <View
                      style={[styles.swatch, { backgroundColor: hex }, dim ? styles.dim : null]}
                    >
                      {option.selected ? (
                        <Icon
                          color={isLightHex(hex) ? '#101828' : '#FFFFFF'}
                          name="check"
                          size={18}
                          strokeWidth={3}
                        />
                      ) : null}
                      {dim ? <View style={styles.strike} /> : null}
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      {sizeList.length > 0 ? (
        <View style={styles.group}>
          <AppText variant="label" weight="700">
            {copy.size}
          </AppText>
          <View style={styles.row}>
            {sizeList.map((option) => {
              const dim = option.state !== 'available';

              return (
                <Pressable
                  accessibilityLabel={
                    option.selected
                      ? copy.optionSelected(option.label)
                      : dim
                        ? copy.optionOutOfStock(option.label)
                        : option.label
                  }
                  accessibilityRole="radio"
                  accessibilityState={{ selected: option.selected, checked: option.selected }}
                  key={option.label}
                  onPress={() => onChange(selectSize(variants, selection, option.label, currency))}
                  style={[
                    styles.sizeChip,
                    option.selected
                      ? { backgroundColor: brand.primary, borderColor: brand.primary }
                      : null,
                    dim ? styles.dim : null,
                  ]}
                >
                  <AppText
                    style={{
                      color: option.selected ? brand.onPrimary : colors.text.primary,
                      textDecorationLine: dim ? 'line-through' : 'none',
                    }}
                    variant="bodySmall"
                    weight="700"
                  >
                    {option.label}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.lg },
  group: { gap: spacing.sm },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  swatchTouch: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  swatchRing: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 21,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  swatch: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border.strong,
  },
  strike: {
    position: 'absolute',
    width: 44,
    height: 2,
    backgroundColor: colors.text.secondary,
    transform: [{ rotate: '-45deg' }],
  },
  dim: { opacity: 0.45 },
  sizeChip: {
    minWidth: 52,
    minHeight: 44,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.strong,
    backgroundColor: colors.background.surface,
  },
});
