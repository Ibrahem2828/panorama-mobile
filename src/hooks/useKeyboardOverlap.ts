import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

/**
 * Height of the keyboard that overlaps a screen whose bottom edge sits `bottomOffset` px above the
 * physical screen bottom (e.g. a tab bar). With Android edge-to-edge the window is not resized, so
 * a screen inside a tab navigator has to lift its own bottom content by this amount.
 */
export function useKeyboardOverlap(bottomOffset = 0): number {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvent, (event) =>
      setKeyboardHeight(event.endCoordinates.height),
    );
    const hide = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));

    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return Math.max(0, keyboardHeight - bottomOffset);
}
