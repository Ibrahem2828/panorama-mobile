import { useCallback, useRef } from 'react';
import { Animated } from 'react-native';

/** Spring-based press feedback: the element sinks slightly on press-in and bounces back on release. */
export function usePressScale(pressedScale = 0.97) {
  const scale = useRef(new Animated.Value(1)).current;

  const to = useCallback(
    (value: number, bounciness: number) => {
      Animated.spring(scale, {
        toValue: value,
        speed: 40,
        bounciness,
        useNativeDriver: true,
      }).start();
    },
    [scale],
  );

  const onPressIn = useCallback(() => to(pressedScale, 0), [pressedScale, to]);
  const onPressOut = useCallback(() => to(1, 6), [to]);

  return { scale, onPressIn, onPressOut };
}
