import { memo } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { AppText } from '../../../components';
import { colors, radius, spacing, useBrand } from '../../../theme';

type Props = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

function FilterChipBase({ label, selected, onPress }: Props) {
  const brand = useBrand();
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        styles.chip,
        selected
          ? { backgroundColor: brand.primary, borderColor: brand.primary }
          : { backgroundColor: colors.background.surface, borderColor: colors.border.default },
      ]}
    >
      <AppText
        numberOfLines={1}
        style={{ color: selected ? brand.onPrimary : colors.text.secondary }}
        variant="caption"
        weight="600"
      >
        {label}
      </AppText>
    </Pressable>
  );
}

export const FilterChip = memo(FilterChipBase);

const styles = StyleSheet.create({
  chip: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
    borderWidth: 1,
  },
});
