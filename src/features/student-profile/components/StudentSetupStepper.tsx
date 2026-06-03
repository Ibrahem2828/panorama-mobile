import { StyleSheet, View } from 'react-native';

import { AppBadge, AppText, Stack } from '../../../components';
import { colors, radius, spacing } from '../../../theme';

type StudentSetupStep = 1 | 2 | 3;

type StudentSetupStepperProps = {
  currentStep: StudentSetupStep;
};

const steps: { step: StudentSetupStep; label: string }[] = [
  { step: 1, label: 'الملف الأكاديمي' },
  { step: 2, label: 'بطاقة الطالب' },
  { step: 3, label: 'حالة التوثيق' },
];

export function StudentSetupStepper({ currentStep }: StudentSetupStepperProps) {
  return (
    <Stack direction="horizontal" gap="sm" wrap>
      {steps.map((item) => {
        const isCurrent = item.step === currentStep;
        const isDone = item.step < currentStep;

        return (
          <View
            key={item.step}
            style={[
              styles.step,
              isCurrent ? styles.currentStep : null,
              isDone ? styles.doneStep : null,
            ]}
          >
            <AppBadge
              label={String(item.step)}
              variant={isDone ? 'success' : isCurrent ? 'brand' : 'neutral'}
            />
            <AppText color={isCurrent ? 'brand' : 'secondary'} variant="caption" weight="600">
              {item.label}
            </AppText>
          </View>
        );
      })}
    </Stack>
  );
}

const styles = StyleSheet.create({
  step: {
    minHeight: 44,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.background.surface,
  },
  currentStep: {
    borderColor: colors.brand.primary,
    backgroundColor: colors.brand.primarySoft,
  },
  doneStep: {
    borderColor: colors.semantic.success,
    backgroundColor: colors.semantic.successSoft,
  },
});
