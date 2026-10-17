import { StyleSheet, View } from 'react-native';

import { AppText } from '../../../components';
import { colors, radius, spacing, useBrand } from '../../../theme';
import { useTranslation, type TranslationCatalog } from '../../../i18n';

type StudentSetupStep = 1 | 2 | 3;

type StudentSetupStepperProps = {
  currentStep: StudentSetupStep;
};

const TOTAL_STEPS = 3;

const steps: {
  step: StudentSetupStep;
  key: keyof TranslationCatalog['studentProfile']['stepper'];
}[] = [
  { step: 1, key: 'academicProfile' as const },
  { step: 2, key: 'studentCard' as const },
  { step: 3, key: 'verificationStatus' as const },
];

/** Compact progress header: three segments plus "Step n of 3 - name" on one line. */
export function StudentSetupStepper({ currentStep }: StudentSetupStepperProps) {
  const { t } = useTranslation();
  const brand = useBrand();
  const current = steps.find((item) => item.step === currentStep) ?? steps[0]!;
  const stepName = t.studentProfile.stepper[current.key] as string;

  return (
    <View
      accessibilityLabel={t.studentProfile.stepper.stepOf(currentStep, TOTAL_STEPS)}
      accessibilityRole="progressbar"
      style={styles.root}
    >
      <View style={styles.segments}>
        {steps.map((item) => (
          <View
            key={item.step}
            style={[
              styles.segment,
              { backgroundColor: item.step <= currentStep ? brand.primary : colors.gray[200] },
            ]}
          />
        ))}
      </View>
      <AppText color="secondary" variant="caption" weight="600">
        {t.studentProfile.stepper.stepOf(currentStep, TOTAL_STEPS)} · {stepName}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.xs,
  },
  segments: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  segment: {
    flex: 1,
    height: 6,
    borderRadius: radius.full,
  },
});
