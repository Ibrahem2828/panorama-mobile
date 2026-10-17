import { StyleSheet, View } from 'react-native';

import { AppText, Stack } from '../../../components';
import { useTranslation } from '../../../i18n';
import { colors, radius, spacing, useBrand } from '../../../theme';
import {
  buildStatusTimeline,
  formatPrintOrderDateTime,
  getPrintOrderStatusPresentation,
} from '../services';
import type { PrintOrder } from '../types';

type PrintStatusTimelineProps = {
  order: PrintOrder;
};

const DOT_SIZE = 12;
const RAIL_WIDTH = 2;

/** Vertical status history, newest first, with the public note the staff attached. */
export function PrintStatusTimeline({ order }: PrintStatusTimelineProps) {
  const { t, locale } = useTranslation();
  const brand = useBrand();
  const entries = buildStatusTimeline(order);
  const label = (status: string) =>
    getPrintOrderStatusPresentation(status, t.printing, t.common.unknown).label;

  if (entries.length === 0) {
    return (
      <AppText color="secondary" variant="bodySmall">
        {t.printing.details.timelineEmpty}
      </AppText>
    );
  }

  return (
    <Stack gap="none">
      {entries.map((entry, index) => {
        const isLatest = index === 0;
        const isLast = index === entries.length - 1;
        const title =
          entry.id === 'created' ? t.printing.details.timelineCreated : label(entry.new_status);
        const when = formatPrintOrderDateTime(entry.created_at, locale);

        return (
          <Stack direction="horizontal" gap="md" key={String(entry.id)}>
            <View style={styles.rail}>
              <View
                style={[
                  styles.dot,
                  { backgroundColor: isLatest ? brand.primary : colors.border.strong },
                ]}
              />
              {!isLast ? <View style={styles.line} /> : null}
            </View>
            <Stack gap="xs" style={styles.body}>
              <AppText variant="bodySmall" weight={isLatest ? '700' : '600'}>
                {title}
              </AppText>
              {when ? (
                <AppText color="muted" variant="caption">
                  {entry.old_status
                    ? `${when} · ${t.printing.details.timelineFrom(label(entry.old_status))}`
                    : when}
                </AppText>
              ) : null}
              {entry.public_note ? (
                <AppText color="secondary" variant="caption">
                  {entry.public_note}
                </AppText>
              ) : null}
            </Stack>
          </Stack>
        );
      })}
    </Stack>
  );
}

const styles = StyleSheet.create({
  rail: { alignItems: 'center', width: DOT_SIZE },
  dot: { width: DOT_SIZE, height: DOT_SIZE, borderRadius: radius.full, marginTop: spacing.xs },
  line: {
    flex: 1,
    width: RAIL_WIDTH,
    backgroundColor: colors.border.default,
    minHeight: spacing.lg,
  },
  body: { flex: 1, minWidth: 0, paddingBottom: spacing.lg },
});
