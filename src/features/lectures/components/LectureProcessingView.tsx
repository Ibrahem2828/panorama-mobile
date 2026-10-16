import { ActivityIndicator, StyleSheet } from 'react-native';

import { AppBadge, AppButton, AppCard, AppText, ErrorState, Stack } from '../../../components';
import { useTranslation } from '../../../i18n';
import { spacing, useBrand } from '../../../theme';
import { useProcessingStatus } from '../hooks/useProcessingStatus';
import { isKnownStatus, isTerminalStatus } from '../logic';
import type { Lecture } from '../types';

type Props = {
  lecture: Lecture;
  /** Called when processing reached "ready" so the caller can reload the lecture and open the viewer. */
  onReady: () => void;
};

/** Shown instead of the viewer while the lecture cannot be viewed: processing, failed, quarantined or unpublished. */
export function LectureProcessingView({ lecture, onReady }: Props) {
  const { t } = useTranslation();
  const brand = useBrand();
  const pending = !isTerminalStatus(lecture.status);
  const processing = useProcessingStatus(lecture.id, pending, (status) => {
    if (status.status === 'ready') onReady();
  });
  const current = processing.status?.status ?? lecture.status;

  if (current === 'failed') {
    return (
      <ErrorState
        message={t.lectures.processing.failedMessage}
        title={t.lectures.processing.failedTitle}
      />
    );
  }
  if (current === 'quarantined') {
    return (
      <ErrorState
        message={t.lectures.processing.quarantinedMessage}
        title={t.lectures.processing.quarantinedTitle}
      />
    );
  }
  if (current === 'ready') {
    // Ready but not viewable (unpublished or without pages), or the detail is about to refresh.
    return (
      <ErrorState
        message={t.lectures.processing.unpublishedMessage}
        title={t.lectures.processing.unpublishedTitle}
      />
    );
  }

  const label = isKnownStatus(current) ? t.lectures.status[current] : t.lectures.status.unknown;

  return (
    <AppCard variant="elevated">
      <Stack align="center" gap="md" style={styles.content}>
        <ActivityIndicator color={brand.primary} size="large" />
        <AppText align="center" variant="title">
          {t.lectures.processing.title}
        </AppText>
        <AppText align="center" color="secondary" variant="bodySmall">
          {t.lectures.processing.message}
        </AppText>
        <AppBadge label={t.lectures.processing.step(label)} variant="info" />
        <AppText align="center" color="muted" variant="caption">
          {t.lectures.processing.autoCheck}
        </AppText>
        {processing.errorKind ? (
          <AppText align="center" color="error" variant="bodySmall">
            {t.lectures.errors[processing.errorKind]}
          </AppText>
        ) : null}
        <AppButton
          loading={processing.isChecking}
          onPress={processing.checkNow}
          size="sm"
          title={t.lectures.processing.checkNow}
          variant="outline"
        />
      </Stack>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  content: { paddingVertical: spacing.lg },
});
