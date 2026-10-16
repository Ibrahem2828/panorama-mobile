import { Pressable, StyleSheet } from 'react-native';

import { AppText, Stack } from '../../../components';
import { colors, layout, opacity, radius, spacing, useBrand } from '../../../theme';

export type PrintChoice<T extends string> = { value: T; label: string };

type PrintChoiceChipsProps<T extends string> = {
  label: string;
  value: T;
  options: ReadonlyArray<PrintChoice<T>>;
  onChange: (value: T) => void;
};

/** A single-choice group of chips (one radio group), used for every print option. */
export function PrintChoiceChips<T extends string>({
  label,
  value,
  options,
  onChange,
}: PrintChoiceChipsProps<T>) {
  const brand = useBrand();

  return (
    <Stack gap="sm">
      <AppText variant="label">{label}</AppText>
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
