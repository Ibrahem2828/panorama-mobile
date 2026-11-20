import type { ReactNode } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { AppText } from '../../../components';
import { colors, radius, useBrand } from '../../../theme';

type StoreChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: ReactNode;
  accessibilityLabel?: string;
};

/** Filter / category pill with a 44dp touch height. */
export function StoreChip({
  label,
  selected = false,
  onPress,
  icon,
  accessibilityLabel,
}: StoreChipProps) {
  const brand = useBrand();

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      android_ripple={{ color: brand.primarySoft }}
      onPress={onPress}
      style={[
        styles.base,
        selected
          ? { backgroundColor: brand.primary, borderColor: brand.primary }
          : { backgroundColor: colors.background.surface, borderColor: colors.border.default },
      ]}
    >
      {icon}
      <AppText
        numberOfLines={1}
        style={{ color: selected ? brand.onPrimary : colors.text.secondary }}
        variant="bodySmall"
        weight={selected ? '700' : '600'}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 16,
    borderRadius: radius.full,
    borderWidth: 1,
  },
});
