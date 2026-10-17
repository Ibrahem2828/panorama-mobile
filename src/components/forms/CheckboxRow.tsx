import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, radius, spacing, useBrand } from '../../theme';
import { AppText } from '../common';
import { Icon } from '../icons';

type CheckboxRowProps = {
  checked: boolean;
  onToggle: () => void;
  /** Plain label, or rich children (for inline links). */
  label?: string;
  children?: ReactNode;
  accessibilityLabel: string;
  error?: boolean;
  disabled?: boolean;
};

const BOX = 24;

/** Checkbox with a 44dp+ touch row; the label area can contain pressable links. */
export function CheckboxRow({
  checked,
  onToggle,
  label,
  children,
  accessibilityLabel,
  error = false,
  disabled = false,
}: CheckboxRowProps) {
  const brand = useBrand();

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="checkbox"
        accessibilityState={{ checked, disabled }}
        disabled={disabled}
        hitSlop={10}
        onPress={onToggle}
        style={[
          styles.box,
          {
            borderColor: error
              ? colors.semantic.error
              : checked
                ? brand.primary
                : colors.border.strong,
          },
          checked ? { backgroundColor: brand.primary } : null,
        ]}
      >
        {checked ? <Icon color={brand.onPrimary} name="check" size={16} strokeWidth={3} /> : null}
      </Pressable>
      <View style={styles.label}>
        {children ?? (
          <AppText color={error ? 'error' : 'primary'} variant="bodySmall">
            {label}
          </AppText>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  box: {
    width: BOX,
    height: BOX,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderRadius: radius.sm,
    backgroundColor: colors.background.surface,
  },
  label: {
    flex: 1,
    minWidth: 0,
  },
});
