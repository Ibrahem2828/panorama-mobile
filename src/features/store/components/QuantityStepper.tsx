import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Icon } from '../../../components';
import { colors, radius, spacing, useBrand } from '../../../theme';

type QuantityStepperProps = {
  value: number;
  min?: number;
  max: number;
  onChange: (value: number) => void;
  decreaseLabel: string;
  increaseLabel: string;
  valueLabel: string;
  busy?: boolean;
  disabled?: boolean;
};

/** − 3 + : 48dp buttons, announced as an adjustable value, never goes outside [min, max]. */
export function QuantityStepper({
  value,
  min = 1,
  max,
  onChange,
  decreaseLabel,
  increaseLabel,
  valueLabel,
  busy = false,
  disabled = false,
}: QuantityStepperProps) {
  const brand = useBrand();
  const canDecrease = !disabled && !busy && value > min;
  const canIncrease = !disabled && !busy && value < max;

  return (
    <View
      accessibilityActions={[
        { name: 'increment', label: increaseLabel },
        { name: 'decrement', label: decreaseLabel },
      ]}
      accessibilityLabel={valueLabel}
      accessibilityRole="adjustable"
      accessibilityValue={{ min, max, now: value }}
      accessible
      onAccessibilityAction={(event) => {
        if (event.nativeEvent.actionName === 'increment' && canIncrease) onChange(value + 1);
        if (event.nativeEvent.actionName === 'decrement' && canDecrease) onChange(value - 1);
      }}
      style={[styles.row, { borderColor: colors.border.default }]}
    >
      <Pressable
        accessibilityElementsHidden
        android_ripple={{ color: brand.primarySoft, borderless: true }}
        disabled={!canDecrease}
        hitSlop={4}
        importantForAccessibility="no"
        onPress={() => onChange(value - 1)}
        style={[styles.button, !canDecrease ? styles.disabled : null]}
      >
        <Icon color={brand.primary} name="minus" size={20} />
      </Pressable>
      <View style={styles.value}>
        <AppText align="center" variant="subtitle" weight="700">
          {String(value)}
        </AppText>
      </View>
      <Pressable
        accessibilityElementsHidden
        android_ripple={{ color: brand.primarySoft, borderless: true }}
        disabled={!canIncrease}
        hitSlop={4}
        importantForAccessibility="no"
        onPress={() => onChange(value + 1)}
        style={[styles.button, !canIncrease ? styles.disabled : null]}
      >
        <Icon color={brand.primary} name="plus" size={20} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: radius.full,
    backgroundColor: colors.background.surface,
  },
  button: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
  },
  disabled: { opacity: 0.35 },
  value: { minWidth: 44, paddingHorizontal: spacing.xs },
});
