import { StyleSheet, View } from 'react-native';

import { AppText, Icon } from '../../../components';
import { colors, radius, spacing, useBrand } from '../../../theme';
import { useTranslation } from '../../../i18n';
import {
  buildVerificationTimeline,
  type TimelineStepKey,
  type TimelineStepState,
} from '../services/verificationTimeline';

type VerificationTimelineProps = {
  status: string;
};

/** Vertical timeline: submitted, under review, decision (approved or needs an updated card). */
export function VerificationTimeline({ status }: VerificationTimelineProps) {
  const { t } = useTranslation();
  const brand = useBrand();
  const steps = buildVerificationTimeline(status);
  const copy = t.verificationFlow.timeline;

  function title(key: TimelineStepKey, state: TimelineStepState): string {
    if (key === 'submitted') return copy.submitted;
    if (key === 'review') return copy.review;
    return state === 'attention' ? copy.needsUpdate : copy.approved;
  }

  function subtitle(key: TimelineStepKey, state: TimelineStepState): string | null {
    if (state === 'current') {
      return key === 'submitted' ? copy.submittedPending : copy.reviewCurrent;
    }
    if (state === 'upcoming') return key === 'review' ? copy.reviewUpcoming : copy.decisionUpcoming;
    return null;
  }

  return (
    <View accessibilityLabel={copy.label} style={styles.root}>
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        const done = step.state === 'done';
        const current = step.state === 'current';
        const attention = step.state === 'attention';
        const circleColor = attention
          ? colors.semantic.warning
          : done
            ? colors.semantic.success
            : current
              ? brand.primary
              : colors.gray[200];
        const extra = subtitle(step.key, step.state);

        return (
          <View key={step.key} style={styles.row}>
            <View style={styles.rail}>
              <View style={[styles.circle, { backgroundColor: circleColor }]}>
                {done ? (
                  <Icon color={colors.text.inverse} name="check" size={16} strokeWidth={3} />
                ) : null}
                {attention ? <Icon color={colors.text.inverse} name="alert" size={16} /> : null}
                {current ? <View style={styles.pulse} /> : null}
              </View>
              {isLast ? null : (
                <View
                  style={[
                    styles.line,
                    { backgroundColor: done ? colors.semantic.success : colors.gray[200] },
                  ]}
                />
              )}
            </View>
            <View style={styles.text}>
              <AppText
                color={step.state === 'upcoming' ? 'muted' : 'primary'}
                variant="subtitle"
                weight="600"
              >
                {title(step.key, step.state)}
              </AppText>
              {extra ? (
                <AppText color="secondary" variant="caption">
                  {extra}
                </AppText>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const CIRCLE = 28;

const styles = StyleSheet.create({
  root: {
    gap: 0,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  rail: {
    width: CIRCLE,
    alignItems: 'center',
  },
  circle: {
    width: CIRCLE,
    height: CIRCLE,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
  },
  pulse: {
    width: 10,
    height: 10,
    borderRadius: radius.full,
    backgroundColor: colors.text.inverse,
  },
  line: {
    width: 2,
    flex: 1,
    minHeight: 24,
  },
  text: {
    flex: 1,
    gap: 2,
    paddingBottom: spacing.lg,
    paddingTop: 2,
  },
});
