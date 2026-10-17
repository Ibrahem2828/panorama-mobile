import { StyleSheet, View } from 'react-native';

import { AppText, Stack } from '../../../components';
import { useTranslation } from '../../../i18n';
import { colors, radius, spacing, useBrand } from '../../../theme';
import { getFlexDirection } from '../../../utils/rtl';
import { getOrderProgress, getPrintOrderStatusPresentation } from '../services';
import type { PrintOrder } from '../types';

type PrintStatusProgressProps = {
  order: PrintOrder;
};

const SEGMENT_HEIGHT = 6;

/**
 * The order's journey as segments (received, review, accepted, printing, ready, delivered)
 * with the current step named underneath. Cancelled and rejected orders show how far they got.
 */
export function PrintStatusProgress({ order }: PrintStatusProgressProps) {
  const { t } = useTranslation();
  const brand = useBrand();
  const progress = getOrderProgress(order);
  const current = progress.steps.find((step) => step.state === 'current');
  const stepLabel = (status: string) =>
    getPrintOrderStatusPresentation(status, t.printing, t.common.unknown).label;
  const doneColor = progress.terminal ? colors.gray[100] : brand.primary;
  const activeStep = progress.steps.filter((step) => step.state === 'done').length;

  return (
    <Stack gap="sm">
      <View
        accessibilityLabel={t.printing.details.progressTitle}
        accessibilityRole="progressbar"
        accessibilityValue={{
          min: 0,
          max: progress.steps.length,
          now: activeStep,
          text: stepLabel(order.status),
        }}
        style={[styles.track, { flexDirection: getFlexDirection('row') }]}
      >
        {progress.steps.map((step) => (
          <View
            key={step.status}
            style={[
              styles.segment,
              {
                backgroundColor:
                  step.state === 'done'
                    ? doneColor
                    : step.state === 'current'
                      ? brand.accent
                      : colors.gray[100],
              },
            ]}
          />
        ))}
      </View>
      <AppText color={progress.terminal ? 'error' : 'brand'} variant="bodySmall" weight="700">
        {progress.terminal
          ? stepLabel(progress.terminal)
          : stepLabel(current?.status ?? order.status)}
      </AppText>
    </Stack>
  );
}

const styles = StyleSheet.create({
  track: { gap: spacing.xs },
  segment: { flex: 1, height: SEGMENT_HEIGHT, borderRadius: radius.full },
});
