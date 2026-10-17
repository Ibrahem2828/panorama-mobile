import { Pressable, StyleSheet } from 'react-native';

import { AppButton, AppCard, AppText, LoadingState, Stack } from '../../../components';
import { useTranslation } from '../../../i18n';
import { colors, layout, opacity, radius, spacing, useBrand } from '../../../theme';
import type { Id, PrintPickupLocation } from '../types';

type PrintPickupSelectorProps = {
  locations: PrintPickupLocation[];
  selectedId: Id | null;
  isLoading: boolean;
  error: string | null;
  onSelect: (id: Id) => void;
  onRetry: () => void;
};

/** Radio list of pickup points, showing each point's address and instructions. */
export function PrintPickupSelector({
  locations,
  selectedId,
  isLoading,
  error,
  onSelect,
  onRetry,
}: PrintPickupSelectorProps) {
  const { t } = useTranslation();
  const brand = useBrand();

  return (
    <Stack gap="md">
      <AppText variant="title">{t.printing.create.pickupTitle}</AppText>
      {isLoading && locations.length === 0 ? <LoadingState /> : null}
      {error && locations.length === 0 ? (
        <Stack gap="sm">
          <AppText color="error" variant="bodySmall">
            {t.printing.create.pickupLoadFailed}
          </AppText>
          <AppButton onPress={onRetry} size="sm" title={t.common.retry} variant="outline" />
        </Stack>
      ) : null}
      {!isLoading && !error && locations.length === 0 ? (
        <AppCard variant="muted">
          <AppText color="secondary" variant="bodySmall">
            {t.printing.create.pickupNone}
          </AppText>
        </AppCard>
      ) : null}
      {locations.map((location) => {
        const selected = selectedId !== null && String(selectedId) === String(location.id);

        return (
          <Pressable
            accessibilityLabel={location.name}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            key={String(location.id)}
            onPress={() => onSelect(location.id)}
            style={({ pressed }) => [
              styles.option,
              selected ? { borderColor: brand.primary, backgroundColor: brand.primarySoft } : null,
              pressed ? styles.pressed : null,
            ]}
          >
            <Stack gap="xs">
              <AppText variant="bodySmall" weight="600">
                {location.name}
              </AppText>
              {location.address ? (
                <AppText color="secondary" variant="caption">
                  {location.address}
                </AppText>
              ) : null}
              {selected && location.instructions ? (
                <AppText color="muted" variant="caption">
                  {`${t.printing.details.pickupInstructions}: ${location.instructions}`}
                </AppText>
              ) : null}
            </Stack>
          </Pressable>
        );
      })}
    </Stack>
  );
}

const styles = StyleSheet.create({
  option: {
    minHeight: layout.touchTargetMinSize,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radius.card,
    padding: spacing.md,
    backgroundColor: colors.background.surface,
  },
  pressed: { opacity: opacity.pressed },
});
