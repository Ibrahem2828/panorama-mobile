import { StyleSheet, View } from 'react-native';

import { AppButton, AppText, Stack } from '../../../components';
import { colors, radius, spacing } from '../../../theme';

type PrintCopiesStepperProps = {
  value: number;
  error?: string;
  onIncrement: () => void;
  onDecrement: () => void;
};

export function PrintCopiesStepper({
  value,
  error,
  onIncrement,
  onDecrement,
}: PrintCopiesStepperProps) {
  return (
    <Stack gap="sm">
      <AppText variant="title">عدد النسخ</AppText>
      <Stack direction="horizontal" gap="md" style={styles.controls}>
        <AppButton
          accessibilityLabel="إنقاص عدد النسخ"
          disabled={value <= 1}
          onPress={onDecrement}
          size="sm"
          title="-"
          variant="outline"
        />
        <View style={styles.valueBox}>
          <AppText align="center" variant="title">
            {value}
          </AppText>
        </View>
        <AppButton
          accessibilityLabel="زيادة عدد النسخ"
          disabled={value >= 99}
          onPress={onIncrement}
          size="sm"
          title="+"
          variant="outline"
        />
      </Stack>
      {error ? (
        <AppText color="error" variant="bodySmall">
          {error}
        </AppText>
      ) : (
        <AppText color="muted" variant="caption">
          الحد المسموح حاليا من 1 إلى 99 نسخة.
        </AppText>
      )}
    </Stack>
  );
}

const styles = StyleSheet.create({
  controls: {
    alignItems: 'center',
  },
  valueBox: {
    minWidth: 88,
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
