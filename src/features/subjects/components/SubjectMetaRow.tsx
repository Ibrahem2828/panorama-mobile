import { StyleSheet } from 'react-native';

import { AppText, Stack } from '../../../components';
import { spacing } from '../../../theme';

type SubjectMetaRowProps = {
  label: string;
  value?: string | null;
};

export function SubjectMetaRow({ label, value }: SubjectMetaRowProps) {
  if (!value) {
    return null;
  }

  return (
    <Stack direction="horizontal" gap="sm" style={styles.row}>
      <AppText color="muted" variant="caption">
        {label}
      </AppText>
      <AppText variant="bodySmall" weight="600">
        {value}
      </AppText>
    </Stack>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 24,
    paddingVertical: spacing.xs,
  },
});
