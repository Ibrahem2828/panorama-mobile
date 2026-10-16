import { StyleSheet, View } from 'react-native';

import { AppIconButton, AppText, Icon, Stack } from '../../../components';
import { useTranslation } from '../../../i18n';
import { colors, radius, spacing } from '../../../theme';
import { MAX_COPIES } from '../services/printDraft';

type PrintCopiesStepperProps = {
  value: number;
  error?: string;
  onChange: (value: number) => void;
};

export function PrintCopiesStepper({ value, error, onChange }: PrintCopiesStepperProps) {
  const { t } = useTranslation();

  return (
    <Stack gap="sm">
      <AppText variant="label">{t.printing.copies.title}</AppText>
      <Stack align="center" direction="horizontal" gap="md">
        <AppIconButton
          accessibilityLabel={t.printing.copies.decrease}
          disabled={value <= 1}
          icon={<Icon name="minus" />}
          onPress={() => onChange(value - 1)}
          variant="surface"
        />
        <View
          accessibilityLabel={t.printing.copies.title}
          accessibilityRole="adjustable"
          accessibilityValue={{ min: 1, max: MAX_COPIES, now: value }}
          style={styles.valueBox}
        >
          <AppText align="center" variant="title">
            {value}
          </AppText>
        </View>
        <AppIconButton
          accessibilityLabel={t.printing.copies.increase}
          disabled={value >= MAX_COPIES}
          icon={<Icon name="plus" />}
          onPress={() => onChange(value + 1)}
          variant="surface"
        />
      </Stack>
      {error ? (
        <AppText color="error" variant="bodySmall">
          {error}
        </AppText>
      ) : null}
    </Stack>
  );
}

const styles = StyleSheet.create({
  valueBox: {
    minWidth: 72,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderRadius: radius.input,
    borderColor: colors.border.default,
    backgroundColor: colors.background.surface,
  },
});
