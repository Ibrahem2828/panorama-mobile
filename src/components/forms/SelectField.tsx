import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { colors, layout, radius, spacing, useBrand } from '../../theme';
import { AppText } from '../common';
import { Icon } from '../icons';
import { FormField } from './FormField';
import { OptionSheet } from './OptionSheet';
import type { SelectOption } from './OptionSheet';

type SelectFieldProps = {
  label: string;
  /** Shown when nothing is selected. */
  placeholder: string;
  title?: string;
  options: SelectOption[];
  selectedId: string | number | null;
  onSelect: (id: string | number) => void;
  disabled?: boolean;
  isLoading?: boolean;
  error?: string;
  helperText?: string;
  /** Text shown (and sheet row) for the "no choice" state of an optional field. */
  clearLabel?: string;
  onClear?: () => void;
  required?: boolean;
};

/** A compact field that shows the chosen value with a chevron and opens a bottom sheet to change it. */
export function SelectField({
  label,
  placeholder,
  title,
  options,
  selectedId,
  onSelect,
  disabled = false,
  isLoading = false,
  error,
  helperText,
  clearLabel,
  onClear,
  required = false,
}: SelectFieldProps) {
  const brand = useBrand();
  const [open, setOpen] = useState(false);
  const selected =
    selectedId === null ? null : options.find((item) => String(item.id) === String(selectedId));
  const optionalCleared = selectedId === null && Boolean(onClear && clearLabel);
  const display = selected?.label ?? (optionalCleared ? clearLabel : null);
  const isDisabled = disabled || isLoading;

  return (
    <FormField error={error} helperText={helperText} label={label} required={required}>
      <Pressable
        accessibilityLabel={`${label}: ${display ?? placeholder}`}
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled, expanded: open }}
        disabled={isDisabled}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.field,
          error ? styles.fieldError : null,
          selected ? { borderColor: brand.primary } : null,
          isDisabled ? styles.fieldDisabled : null,
          pressed ? styles.pressed : null,
        ]}
      >
        <AppText
          color={display ? 'primary' : 'muted'}
          numberOfLines={1}
          style={styles.value}
          variant="input"
        >
          {display ?? placeholder}
        </AppText>
        {isLoading ? (
          <ActivityIndicator color={brand.primary} size="small" />
        ) : (
          <View style={styles.chevron}>
            <Icon color={colors.text.secondary} name="chevronDown" size={20} />
          </View>
        )}
      </Pressable>
      <OptionSheet
        clearLabel={clearLabel}
        onClear={onClear}
        onClose={() => setOpen(false)}
        onSelect={onSelect}
        options={options}
        selectedId={selectedId}
        title={title ?? label}
        visible={open}
      />
    </FormField>
  );
}

const styles = StyleSheet.create({
  field: {
    minHeight: layout.inputMinHeight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderRadius: radius.input,
    borderColor: colors.border.default,
    backgroundColor: colors.background.surface,
  },
  fieldError: {
    borderColor: colors.semantic.error,
  },
  fieldDisabled: {
    backgroundColor: colors.background.muted,
    opacity: 0.72,
  },
  pressed: {
    opacity: 0.85,
  },
  value: {
    flex: 1,
  },
  chevron: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
