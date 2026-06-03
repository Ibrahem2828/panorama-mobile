import { StyleSheet, View } from 'react-native';

import { AppText } from '../../../components';
import { colors, spacing } from '../../../theme';

type NotificationMetaRowProps = {
  label: string;
  value?: string | number | null;
};

export function NotificationMetaRow({ label, value }: NotificationMetaRowProps) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  return (
    <View style={styles.row}>
      <AppText color="muted" variant="caption">
        {label}
      </AppText>
      <AppText color="secondary" style={styles.value} variant="caption">
        {String(value)}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.default,
  },
  value: {
    minWidth: 0,
  },
});
