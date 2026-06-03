import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { AppBadge, AppCard, AppText, Stack } from '../../../components';
import { colors, layout, spacing } from '../../../theme';
import type { AcademicOption } from '../types';

type AcademicSelectFieldProps = {
  label: string;
  options: AcademicOption[];
  selectedId: string | number | null;
  onSelect: (id: string | number) => void | Promise<void>;
  disabled?: boolean;
  isLoading?: boolean;
  emptyText?: string;
};

function isSelectedOption(optionId: string | number, selectedId: string | number | null): boolean {
  return selectedId !== null && String(optionId) === String(selectedId);
}

export function AcademicSelectField({
  label,
  options,
  selectedId,
  onSelect,
  disabled = false,
  isLoading = false,
  emptyText = 'لا توجد خيارات متاحة حاليا.',
}: AcademicSelectFieldProps) {
  return (
    <Stack gap="sm">
      <View style={styles.labelRow}>
        <AppText variant="title">{label}</AppText>
        {isLoading ? <ActivityIndicator color={colors.brand.primary} size="small" /> : null}
      </View>

      <AppCard padding="none" style={disabled ? styles.disabledCard : null} variant="default">
        {options.length === 0 ? (
          <View style={styles.emptyState}>
            <AppText align="center" color="secondary" variant="bodySmall">
              {isLoading ? 'جاري تحميل الخيارات...' : emptyText}
            </AppText>
          </View>
        ) : (
          <Stack gap="none">
            {options.map((option) => {
              const selected = isSelectedOption(option.id, selectedId);

              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected, disabled }}
                  disabled={disabled}
                  key={String(option.id)}
                  onPress={() => {
                    void onSelect(option.id);
                  }}
                  style={({ pressed }) => [
                    styles.option,
                    selected ? styles.selectedOption : null,
                    pressed && !disabled ? styles.pressedOption : null,
                  ]}
                >
                  <View style={styles.optionText}>
                    <AppText color={selected ? 'brand' : 'primary'} variant="body" weight="600">
                      {option.name}
                    </AppText>
                    {option.code ? (
                      <AppText color="muted" variant="caption">
                        {String(option.code)}
                      </AppText>
                    ) : null}
                  </View>
                  {selected ? <AppBadge label="محدد" variant="brand" /> : null}
                </Pressable>
              );
            })}
          </Stack>
        )}
      </AppCard>
    </Stack>
  );
}

const styles = StyleSheet.create({
  labelRow: {
    minHeight: layout.touchTargetMinSize,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  disabledCard: {
    opacity: 0.72,
  },
  emptyState: {
    minHeight: 88,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  option: {
    minHeight: layout.touchTargetMinSize,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.default,
  },
  selectedOption: {
    backgroundColor: colors.brand.primarySoft,
  },
  pressedOption: {
    backgroundColor: colors.background.muted,
  },
  optionText: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
});
