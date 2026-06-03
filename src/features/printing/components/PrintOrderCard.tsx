import { Pressable, StyleSheet } from 'react-native';

import { AppCard, AppText, Stack } from '../../../components';
import { opacity } from '../../../theme';
import {
  formatPrintOrderDate,
  formatPrintOrderPrice,
  getPrintOrderCopiesCount,
  getPrintOrderDisplayTitle,
  getPrintOrderItemsCount,
} from '../services';
import type { PrintOrder } from '../types';
import { PrintOrderStatusBadge } from './PrintOrderStatusBadge';

type PrintOrderCardProps = {
  order: PrintOrder;
  onPress?: () => void;
};

export function PrintOrderCard({ order, onPress }: PrintOrderCardProps) {
  const date = formatPrintOrderDate(order.created_at ?? order.submitted_at);
  const price = formatPrintOrderPrice(order);

  return (
    <Pressable
      accessibilityRole="button"
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [pressed && onPress ? styles.pressed : null]}
    >
      <AppCard variant="elevated">
        <Stack gap="md">
          <Stack direction="horizontal" gap="md" style={styles.header}>
            <Stack gap="xs" style={styles.titleBlock}>
              <AppText variant="title">{getPrintOrderDisplayTitle(order)}</AppText>
              <AppText color="secondary" variant="bodySmall">
                {getPrintOrderItemsCount(order)} ملف - {getPrintOrderCopiesCount(order)} نسخة
              </AppText>
            </Stack>
            <PrintOrderStatusBadge status={order.status} />
          </Stack>

          <Stack direction="horizontal" gap="sm" wrap>
            {date ? (
              <AppText color="muted" variant="caption">
                {date}
              </AppText>
            ) : null}
            {price ? (
              <AppText color="brand" variant="caption" weight="600">
                {price}
              </AppText>
            ) : null}
          </Stack>
        </Stack>
      </AppCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: opacity.pressed,
  },
  header: {
    alignItems: 'flex-start',
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
  },
});
