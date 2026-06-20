import { Image, StyleSheet, View } from 'react-native';

import { images } from '../../../assets/images';
import { colors } from '../../../theme';
import type { PrintOrderStatus } from '../types';

type PrintOrderStatusIconProps = {
  status: PrintOrderStatus;
  size?: 'sm' | 'md';
};

export function getPrintOrderStatusImage(status: PrintOrderStatus) {
  switch (status) {
    case 'submitted':
    case 'pending':
    case 'accepted':
      return images.printing.orderPending;
    case 'in_progress':
    case 'printing':
      return images.printing.orderProcessing;
    case 'ready':
    case 'ready_for_pickup':
      return images.printing.orderReady;
    case 'delivered':
      return images.printing.orderCompleted;
    case 'cancelled':
    case 'canceled':
    case 'rejected':
      return images.printing.orderCancelled;
    default:
      return images.printing.orderPending;
  }
}

export function PrintOrderStatusIcon({ status, size = 'sm' }: PrintOrderStatusIconProps) {
  return (
    <View style={[styles.container, size === 'sm' ? styles.sm : styles.md]}>
      <Image
        accessibilityIgnoresInvertColors
        accessibilityLabel="أيقونة حالة طلب الطباعة"
        resizeMode="contain"
        source={getPrintOrderStatusImage(status)}
        style={styles.image}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: colors.background.muted,
  },
  sm: {
    width: 48,
    height: 48,
  },
  md: {
    width: 72,
    height: 72,
  },
  image: {
    width: '82%',
    height: '82%',
  },
});
