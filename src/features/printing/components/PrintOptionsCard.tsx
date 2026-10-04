import { Pressable, StyleSheet, View } from 'react-native';

import { AppCard, AppText, Stack } from '../../../components';
import { useTranslation } from '../../../i18n';
import { colors, radius, spacing } from '../../../theme';
import type { PrintDraft, PrintPickupLocation } from '../types';

type Props = {
  draft: PrintDraft;
  locations: PrintPickupLocation[];
  onChange: <K extends keyof PrintDraft>(key: K, value: PrintDraft[K]) => void;
};

// Values only. Labels come from the catalog so the option set stays locale-free;
// paper sizes are already language-neutral and are rendered as-is.
const OPTIONS = {
  colorMode: ['black_white', 'color'],
  sides: ['one_sided', 'double_sided'],
  paperSize: ['A4', 'A3', 'A5'],
  binding: ['none', 'staple', 'spiral', 'thermal'],
} as const;

function Choice<T extends string>({
  value,
  current,
  label,
  onPress,
}: {
  value: T;
  current: T;
  label: string;
  onPress: () => void;
}) {
  const selected = value === current;
  return (
    <Pressable onPress={onPress} style={[styles.choice, selected ? styles.selected : null]}>
      <AppText color={selected ? 'brand' : 'secondary'} variant="caption">
        {label}
      </AppText>
    </Pressable>
  );
}

export function PrintOptionsCard({ draft, locations, onChange }: Props) {
  const { t } = useTranslation();
  const labels: Record<string, string> = {
    black_white: t.printing.options.colorBlackWhite,
    color: t.printing.options.colorColored,
    one_sided: t.printing.options.sidesSingle,
    double_sided: t.printing.options.sidesDouble,
    A4: 'A4',
    A3: 'A3',
    A5: 'A5',
    none: t.printing.options.bindingNone,
    staple: t.printing.options.bindingStaple,
    spiral: t.printing.options.bindingSpiral,
    thermal: t.printing.options.bindingThermal,
  };

  return (
    <AppCard variant="outlined">
      <Stack gap="lg">
        <AppText variant="title">{t.printing.options.title}</AppText>
        <Stack gap="sm">
          <AppText variant="label">{t.printing.options.color}</AppText>
          <View style={styles.row}>
            {OPTIONS.colorMode.map((value) => (
              <Choice
                key={value}
                current={draft.colorMode}
                label={labels[value] ?? value}
                onPress={() => onChange('colorMode', value)}
                value={value}
              />
            ))}
          </View>
        </Stack>
        <Stack gap="sm">
          <AppText variant="label">{t.printing.options.sides}</AppText>
          <View style={styles.row}>
            {OPTIONS.sides.map((value) => (
              <Choice
                key={value}
                current={draft.sides}
                label={labels[value] ?? value}
                onPress={() => onChange('sides', value)}
                value={value}
              />
            ))}
          </View>
        </Stack>
        <Stack gap="sm">
          <AppText variant="label">{t.printing.options.paperSize}</AppText>
          <View style={styles.row}>
            {OPTIONS.paperSize.map((value) => (
              <Choice
                key={value}
                current={draft.paperSize}
                label={labels[value] ?? value}
                onPress={() => onChange('paperSize', value)}
                value={value}
              />
            ))}
          </View>
        </Stack>
        <Stack gap="sm">
          <AppText variant="label">{t.printing.options.binding}</AppText>
          <View style={styles.row}>
            {OPTIONS.binding.map((value) => (
              <Choice
                key={value}
                current={draft.binding}
                label={labels[value] ?? value}
                onPress={() => onChange('binding', value)}
                value={value}
              />
            ))}
          </View>
        </Stack>
        {locations.length > 0 ? (
          <Stack gap="sm">
            <AppText variant="label">{t.printing.options.pickupPoint}</AppText>
            <View style={styles.row}>
              {locations.map((location) => (
                <Choice
                  key={String(location.id)}
                  current={String(draft.pickupLocationId ?? '')}
                  label={location.name}
                  onPress={() => onChange('pickupLocationId', location.id)}
                  value={String(location.id)}
                />
              ))}
            </View>
          </Stack>
        ) : null}
      </Stack>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: spacing.sm },
  choice: {
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radius.button,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  selected: { borderColor: colors.brand.primary, backgroundColor: colors.background.muted },
});
