import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';

import { layout, spacing } from '../../theme';
import { AppText } from '../common';

type AppHeaderProps = {
  title: string;
  subtitle?: string;
  leftAction?: ReactNode;
  rightAction?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function AppHeader({ title, subtitle, leftAction, rightAction, style }: AppHeaderProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.actionSlot}>{leftAction}</View>
      <View style={styles.titleBlock}>
        <AppText variant="h2">{title}</AppText>
        {subtitle ? (
          <AppText color="secondary" variant="bodySmall">
            {subtitle}
          </AppText>
        ) : null}
      </View>
      <View style={styles.actionSlot}>{rightAction}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: layout.headerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  actionSlot: {
    width: layout.iconButton.md,
    minHeight: layout.iconButton.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: {
    flex: 1,
    gap: spacing.xs,
    alignItems: 'flex-end',
  },
});
