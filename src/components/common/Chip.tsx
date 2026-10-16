import type { ReactNode } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { colors, radius, useBrand } from '../../theme';
import { AppText } from './AppText';

type ChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: ReactNode;
};

/** Selectable filter pill; the selected state uses the student's faculty colour. */
export function Chip({ label, selected = false, onPress, icon }: ChipProps) {
  const brand = useBrand();

  return (
    <Pressable
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
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    borderRadius: radius.full,
    borderWidth: 1,
  },
});
