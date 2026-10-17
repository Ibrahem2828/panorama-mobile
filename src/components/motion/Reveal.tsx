import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { Animated, Easing } from 'react-native';

import { useReduceMotion } from './useReduceMotion';

type RevealProps = {
  children: ReactNode;
  /** Position in a staggered list; each step delays the entrance by `step` ms (capped). */
  index?: number;
  step?: number;
  distance?: number;
  style?: StyleProp<ViewStyle>;
};

/** Fade and rise entrance, run once on mount. Use `index` to cascade siblings. */
export function Reveal({ children, index = 0, step = 70, distance = 16, style }: RevealProps) {
  const reduce = useReduceMotion();
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduce) {
      progress.setValue(1);
      return;
    }
    const anim = Animated.timing(progress, {
      toValue: 1,
      duration: 420,
      delay: Math.min(index, 8) * step,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [index, progress, reduce, step]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progress,
          transform: [
            {
              translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
