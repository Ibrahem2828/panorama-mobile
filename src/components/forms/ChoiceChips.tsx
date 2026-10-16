import { Pressable, StyleSheet } from 'react-native';

import { colors, layout, opacity, radius, spacing, useBrand } from '../../theme';
import { AppText } from '../common';
import { Stack } from '../layout';

export type ChoiceChip<T extends string> = { value: T; label: string };

type ChoiceChipsProps<T extends string> = {
  /** Names the group for screen readers and is shown above the chips unless `hideLabel`. */
  label: string;
  value: T;
  options: ReadonlyArray<ChoiceChip<T>>;
  onChange: (value: T) => void;
  hideLabel?: boolean;
};

/** A single-choice group of chips: one selected value, brand coloured when selected. */
export function ChoiceChips<T extends string>({
  label,
  value,
  options,
  onChange,
  hideLabel = false,
}: ChoiceChipsProps<T>) {
  const brand = useBrand();

  return (
    <Stack gap="sm">
      {hideLabel ? null : <AppText variant="label">{label}</AppText>}
      <Stack direction="horizontal" gap="sm" wrap>
        {options.map((option) => {
          const selected = option.value === value;

          return (
            <Pressable
              accessibilityLabel={`${label}: ${option.label}`}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              key={option.value}
              onPress={() => onChange(option.value)}
              style={({ pressed }) => [
                styles.chip,
                selected
                  ? { borderColor: brand.primary, backgroundColor: brand.primarySoft }
                  : null,
                pressed ? styles.pressed : null,
              ]}
            >
              <AppText color={selected ? 'brand' : 'secondary'} variant="caption" weight="600">
                {option.label}
              </AppText>
            </Pressable>
          );
        })}
      </Stack>
    </Stack>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: layout.touchTargetMinSize - 4,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radius.button,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background.surface,
  },
  pressed: { opacity: opacity.pressed },
});
