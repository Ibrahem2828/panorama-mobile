import { useEffect, useMemo } from 'react';

import { SelectField } from '../../../components';
import type { SelectOption } from '../../../components';
import { getAutoSelectOption } from '../services/optionSelection';
import type { AcademicOption } from '../types';
import { useTranslation } from '../../../i18n';

type AcademicSelectFieldProps = {
  label: string;
  options: AcademicOption[];
  selectedId: string | number | null;
  onSelect: (id: string | number) => void | Promise<void>;
  disabled?: boolean;
  isLoading?: boolean;
  /** Shown when nothing is selected and the field is enabled. */
  placeholder?: string;
  /** Shown while disabled (for example "pick the university first"). */
  emptyText?: string;
  /** Optional fields: adds a "no choice" row to the sheet. */
  onClear?: () => void | Promise<void>;
  clearLabel?: string;
  hint?: string;
  /** Pick the only option automatically (required fields). */
  autoSelect?: boolean;
  error?: string;
};

/** Compact select: shows the chosen value with a chevron and opens a searchable bottom sheet. */
export function AcademicSelectField({
  label,
  options,
  selectedId,
  onSelect,
  disabled = false,
  isLoading = false,
  placeholder,
  emptyText,
  onClear,
  clearLabel,
  hint,
  autoSelect = false,
  error,
}: AcademicSelectFieldProps) {
  const { t } = useTranslation();
  const sheetOptions = useMemo<SelectOption[]>(
    () =>
      options.map((option) => ({
        id: option.id,
        label: option.name,
        description: option.code ? String(option.code) : null,
      })),
    [options],
  );

  useEffect(() => {
    if (!autoSelect || disabled) return;
    const only = getAutoSelectOption(options, selectedId, isLoading);
    if (only) void onSelect(only.id);
  }, [autoSelect, disabled, isLoading, onSelect, options, selectedId]);

  const emptyHint = options.length === 0 && !isLoading ? emptyText : undefined;

  return (
    <SelectField
      clearLabel={clearLabel}
      disabled={disabled || options.length === 0}
      error={error}
      helperText={emptyHint ?? hint}
      isLoading={isLoading}
      label={label}
      onClear={onClear ? () => void onClear() : undefined}
      onSelect={(id) => void onSelect(id)}
      options={sheetOptions}
      placeholder={placeholder ?? t.studentProfile.selectField.placeholder}
      selectedId={selectedId}
    />
  );
}
