import { Pressable, StyleSheet, View } from 'react-native';

import { AppCard, AppText, Stack } from '../../../components';
import { colors, radius, spacing } from '../../../theme';
import type { PrintDraft, PrintPickupLocation } from '../types';

type Props = {
  draft: PrintDraft;
  locations: PrintPickupLocation[];
  onChange: <K extends keyof PrintDraft>(key: K, value: PrintDraft[K]) => void;
};

const OPTIONS = {
  colorMode: [
    ['black_white', 'أبيض وأسود'],
    ['color', 'ملون'],
  ],
  sides: [
    ['single', 'وجه واحد'],
    ['double', 'وجهان'],
  ],
  paperSize: [
    ['a4', 'A4'],
    ['a3', 'A3'],
    ['a5', 'A5'],
  ],
  binding: [
    ['none', 'بدون'],
    ['staple', 'تدبيس'],
    ['spiral', 'تسليك'],
    ['thermal', 'تجليد حراري'],
  ],
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
  return (
    <AppCard variant="outlined">
      <Stack gap="lg">
        <AppText variant="title">خيارات الطباعة</AppText>
        <Stack gap="sm">
          <AppText variant="label">اللون</AppText>
          <View style={styles.row}>
            {OPTIONS.colorMode.map(([value, label]) => (
              <Choice
                key={value}
                current={draft.colorMode}
                label={label}
                onPress={() => onChange('colorMode', value)}
                value={value}
              />
            ))}
          </View>
        </Stack>
        <Stack gap="sm">
          <AppText variant="label">الأوجه</AppText>
          <View style={styles.row}>
            {OPTIONS.sides.map(([value, label]) => (
              <Choice
                key={value}
                current={draft.sides}
                label={label}
                onPress={() => onChange('sides', value)}
                value={value}
              />
            ))}
          </View>
        </Stack>
        <Stack gap="sm">
          <AppText variant="label">حجم الورق</AppText>
          <View style={styles.row}>
            {OPTIONS.paperSize.map(([value, label]) => (
              <Choice
                key={value}
                current={draft.paperSize}
                label={label}
                onPress={() => onChange('paperSize', value)}
                value={value}
              />
            ))}
          </View>
        </Stack>
        <Stack gap="sm">
          <AppText variant="label">التجليد</AppText>
          <View style={styles.row}>
            {OPTIONS.binding.map(([value, label]) => (
              <Choice
                key={value}
                current={draft.binding}
                label={label}
                onPress={() => onChange('binding', value)}
                value={value}
              />
            ))}
          </View>
        </Stack>
        {locations.length > 0 ? (
          <Stack gap="sm">
            <AppText variant="label">نقطة الاستلام</AppText>
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
