import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { View } from 'react-native';

import { spacing } from '../../theme';
import { getFlexDirection } from '../../utils/rtl';

type StackDirection = 'vertical' | 'horizontal';
type StackGap = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

type StackProps = {
  children: ReactNode;
  direction?: StackDirection;
  gap?: StackGap | number;
  align?: ViewStyle['alignItems'];
  justify?: ViewStyle['justifyContent'];
  wrap?: boolean;
  style?: StyleProp<ViewStyle>;
};

const gapValues: Record<StackGap, number> = {
  none: spacing.none,
  xs: spacing.xs,
  sm: spacing.sm,
  md: spacing.md,
  lg: spacing.lg,
  xl: spacing.xl,
  xxl: spacing.xxl,
};

function resolveGap(gap: StackGap | number): number {
  return typeof gap === 'number' ? gap : gapValues[gap];
}

export function Stack({
  children,
  direction = 'vertical',
  gap = 'md',
  align,
  justify,
  wrap = false,
  style,
}: StackProps) {
  const flexDirection = direction === 'vertical' ? 'column' : getFlexDirection('row');

  return (
    <View
      style={[
        {
          flexDirection,
          gap: resolveGap(gap),
          alignItems: align,
          justifyContent: justify,
          flexWrap: wrap ? 'wrap' : 'nowrap',
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
