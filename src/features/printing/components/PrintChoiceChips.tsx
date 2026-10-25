import { Pressable, StyleSheet } from 'react-native';

import { AppText, Icon, Stack, type ChoiceChip } from '../../../components';
import { colors, layout, opacity, radius, spacing, useBrand } from '../../../theme';

export type PrintChoice<T extends string> = ChoiceChip<T>;

type PrintChoiceChipsProps<T extends string> = {
  label: string;
  value: T;
  options: ReadonlyArray<PrintChoice<T>>;
  onChange: (value: T) => void;
  /** Hint under the group (what the option means). */
  hint?: string;
};

/**
 * A single-choice group of chips (one radio group), used for every print option. The selected chip is filled with the
 * brand colour, carries a check mark and a thicker border, so the choice is clear without relying on colour alone.
 */
export function PrintChoiceChips<T extends string>({
  label,
  value,
  options,
  onChange,
  hint,
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
                  ? {
                      borderColor: brand.primary,
                      backgroundColor: brand.primarySoft,
                      borderWidth: 2,
                    }
                  : null,
                pressed ? styles.pressed : null,
              ]}
            >
              {selected ? (
                <Icon color={brand.primary} name="check" size={16} strokeWidth={2.6} />
              ) : null}
              <AppText color={selected ? 'brand' : 'secondary'} variant="caption" weight="700">
                {option.label}
              </AppText>
            </Pressable>
          );
        })}
      </Stack>
      {hint ? (
        <AppText color="muted" variant="caption">
          {hint}
        </AppText>
      ) : null}
    </Stack>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: layout.touchTargetMinSize,
    minWidth: layout.touchTargetMinSize,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxs,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radius.button,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.background.surface,
  },
  pressed: { opacity: opacity.pressed },
});
