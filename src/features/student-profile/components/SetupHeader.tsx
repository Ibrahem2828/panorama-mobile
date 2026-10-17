import { StyleSheet, View } from 'react-native';

import { AppText, FormBackButton } from '../../../components';
import { spacing } from '../../../theme';
import { StudentSetupStepper } from './StudentSetupStepper';

type SetupHeaderProps = {
  title: string;
  subtitle?: string;
  step: 1 | 2 | 3;
  onBack?: () => void;
};

/** Title block for the student setup flow: optional back, title, one-line subtitle, progress. */
export function SetupHeader({ title, subtitle, step, onBack }: SetupHeaderProps) {
  return (
    <View style={styles.root}>
      <StudentSetupStepper currentStep={step} />
      <View style={styles.titleRow}>
        {onBack ? <FormBackButton onPress={onBack} /> : null}
        <View style={styles.titles}>
          <AppText variant="h2">{title}</AppText>
          {subtitle ? (
            <AppText color="secondary" variant="bodySmall">
              {subtitle}
            </AppText>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.lg,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  titles: {
    flex: 1,
    gap: spacing.xs,
  },
});
