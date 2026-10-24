import { useEffect, useId, type ReactNode } from 'react';

import { useOverlayStore, type OverlayAnimation } from './overlayStore';

export type AppModalProps = {
  visible: boolean;
  onRequestClose?: () => void;
  animationType?: OverlayAnimation;
  /** A transparent modal lets the screen below show through (backdrops are drawn by the children). */
  transparent?: boolean;
  children: ReactNode;
};

const noop = () => undefined;

/**
 * Drop-in replacement for the React Native Modal that is drawn inside the main (screenshot-protected) window.
 * Never import Modal from react-native: a test enforces it.
 */
export function AppModal({
  visible,
  onRequestClose = noop,
  animationType = 'none',
  transparent = false,
  children,
}: AppModalProps) {
  const id = useId();
  const upsert = useOverlayStore((state) => state.upsert);
  const remove = useOverlayStore((state) => state.remove);

  // No dependency list on purpose: the children are new elements on every render and must reach the host each time.
  useEffect(() => {
    if (visible) {
      upsert(id, { node: children, onRequestClose, animation: animationType, transparent });
    } else {
      remove(id);
    }
  });

  useEffect(() => () => remove(id), [id, remove]);

  return null;
}
