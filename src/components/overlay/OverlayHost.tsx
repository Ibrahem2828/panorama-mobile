import { useEffect, useRef } from 'react';
import { Animated, BackHandler, Dimensions, StyleSheet } from 'react-native';

import { colors } from '../../theme';
import { orderedOverlays, useOverlayStore, type OverlayEntry } from './overlayStore';

function OverlayLayer({ entry }: { entry: OverlayEntry }) {
  const progress = useRef(new Animated.Value(entry.animation === 'none' ? 1 : 0)).current;
  const onRequestClose = useRef(entry.onRequestClose);
  onRequestClose.current = entry.onRequestClose;

  useEffect(() => {
    if (entry.animation === 'none') {
      return;
    }

    Animated.timing(progress, {
      toValue: 1,
      duration: entry.animation === 'slide' ? 260 : 180,
      useNativeDriver: true,
    }).start();
    // The animation only runs when the layer appears.
  }, []);

  // The newest layer registers last, so Android asks it first; it always consumes the back press, like a native Modal.
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      onRequestClose.current();
      return true;
    });

    return () => subscription.remove();
  }, []);

  const animated =
    entry.animation === 'slide'
      ? {
          transform: [
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [Dimensions.get('window').height, 0],
              }),
            },
          ],
        }
      : { opacity: progress };

  return (
    <Animated.View
      accessibilityViewIsModal
      style={[
        StyleSheet.absoluteFill,
        {
          backgroundColor: entry.transparent ? 'transparent' : colors.background.primary,
          zIndex: 1000 + entry.order,
          elevation: 1000 + entry.order,
        },
        animated,
      ]}
    >
      {entry.node}
    </Animated.View>
  );
}

/**
 * Draws every open AppModal on top of the app, inside the main window. A React Native Modal opens a separate Android
 * window that is NOT covered by the screen-capture protection of the main window, so sensitive content shown in one
 * could be captured. Layers drawn here share the protected window.
 */
export function OverlayHost() {
  const entries = useOverlayStore((state) => state.entries);

  return (
    <>
      {orderedOverlays(entries).map(([id, entry]) => (
        <OverlayLayer entry={entry} key={id} />
      ))}
    </>
  );
}
