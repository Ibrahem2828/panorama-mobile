import { StyleSheet, View } from 'react-native';

import { AppButton, AppCard, AppText, Stack } from '../../../components';
import { useTranslation } from '../../../i18n';
import { colors, radius, spacing, useBrand } from '../../../theme';
import { formatFileSize } from '../../files/services';
import { uploadPercent } from '../services/printDraft';
import type { PrintTransferState } from '../types';

type UploadProgressCardProps = {
  transfer: PrintTransferState;
  onCancel: () => void;
};

const BAR_HEIGHT = 8;

/**
 * A real upload progress bar (bytes sent / bytes total) with a cancel button. The bar is
 * announced to screen readers as a progress bar with its percentage.
 */
export function UploadProgressCard({ transfer, onCancel }: UploadProgressCardProps) {
  const { t } = useTranslation();
  const brand = useBrand();
  const percent = uploadPercent(transfer.loaded, transfer.total);
  const title =
    transfer.phase === 'quote' ? t.printing.transfer.quoteTitle : t.printing.transfer.orderTitle;
  const sizeText =
    transfer.total > 0
      ? t.printing.transfer.bytes(
          formatFileSize(transfer.loaded, t.files) ?? '0',
          formatFileSize(transfer.total, t.files) ?? '0',
        )
      : null;

  return (
    <AppCard variant="outlined">
      <Stack gap="md">
        <AppText variant="title">{title}</AppText>
        <View
          accessibilityLabel={title}
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 0, max: 100, now: percent }}
          style={styles.track}
        >
          <View style={[styles.fill, { width: `${percent}%`, backgroundColor: brand.primary }]} />
        </View>
        <Stack direction="horizontal" gap="md" justify="space-between">
          <AppText color="brand" variant="bodySmall" weight="700">
            {t.printing.transfer.percent(percent)}
          </AppText>
          {sizeText ? (
            <AppText color="muted" variant="caption">
              {sizeText}
            </AppText>
          ) : null}
        </Stack>
        <AppText color="secondary" variant="caption">
          {percent >= 100 ? t.printing.transfer.processing : t.printing.transfer.keepOpen}
        </AppText>
        <AppButton
          accessibilityLabel={t.printing.transfer.cancelLabel}
          onPress={onCancel}
          size="sm"
          title={t.printing.transfer.cancel}
          variant="outline"
        />
      </Stack>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  track: {
    height: BAR_HEIGHT,
    borderRadius: radius.full,
    backgroundColor: colors.gray[100],
    overflow: 'hidden',
  },
  fill: {
    height: BAR_HEIGHT,
    borderRadius: radius.full,
    minWidth: spacing.xs,
  },
});
