import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, shadows, spacing } from '../../../theme';

/** A bar pinned under a scrolling screen: it stays in view while the options above scroll. */
export function PrintStickyBar({ children }: { children: ReactNode }) {
  return <View style={styles.bar}>{children}</View>;
}

const styles = StyleSheet.create({
  bar: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.default,
    backgroundColor: colors.background.surface,
    ...shadows.sm,
  },
});
