import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';

import { colors, spacing } from '../../theme';

type DividerSpace = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';

type DividerProps = {
  space?: DividerSpace | number;
  style?: StyleProp<ViewStyle>;
};

const dividerSpacing: Record<DividerSpace, number> = {
  none: spacing.none,
  xs: spacing.xs,
  sm: spacing.sm,
  md: spacing.md,
  lg: spacing.lg,
  xl: spacing.xl,
};

function resolveSpace(space: DividerSpace | number): number {
  return typeof space === 'number' ? space : dividerSpacing[space];
}

export function Divider({ space = 'md', style }: DividerProps) {
  return (
    <View
      accessibilityRole="none"
      style={[
        styles.divider,
        {
          marginVertical: resolveSpace(space),
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  divider: {
    width: '100%',
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border.default,
  },
});
