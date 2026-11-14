import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Image,
  PanResponder,
  StyleSheet,
  View,
  type GestureResponderEvent,
  type LayoutChangeEvent,
} from 'react-native';

import {
  clampTransform,
  doubleTapTransform,
  fitSize,
  identityTransform,
  pinchTransform,
  touchDistance,
  type Box,
  type Transform,
} from '../logic/zoom';

type ZoomableImageProps = {
  /** Full-quality image (a private temp file). Optional while it is still loading. */
  uri: string | null;
  /** Low-resolution preview shown (blurred) until the full image is ready. */
  previewUri?: string | null;
  accessibilityLabel: string;
  onFullLoaded?: () => void;
  onError?: () => void;
  /** Horizontal swipe while not zoomed (page change in documents). */
  onSwipe?: (direction: 'next' | 'previous') => void;
  /** Called with the zoom state so a screen can show its hint only at fit size. */
  onZoomed?: (zoomed: boolean) => void;
};

const TAP_SLOP = 10;
const TAP_MS = 250;
const DOUBLE_TAP_MS = 300;
const SWIPE_DISTANCE = 70;

/**
 * Pan / pinch / double-tap zoom with nothing but PanResponder and Animated (no gesture-handler in this app). The image is
 * laid out "contain"; zoom is clamped so it can never be dragged out of view. No long-press, no menu: nothing to save.
 */
export function ZoomableImage({
  uri,
  previewUri,
  accessibilityLabel,
  onFullLoaded,
  onError,
  onSwipe,
  onZoomed,
}: ZoomableImageProps) {
  const [container, setContainer] = useState<Box>({ width: 0, height: 0 });
  const [natural, setNatural] = useState<Box | null>(null);
  const [fullReady, setFullReady] = useState(false);
  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const origin = useRef({ x: 0, y: 0 });
  const root = useRef<View>(null);
  const transform = useRef<Transform>(identityTransform);
  const gesture = useRef({
    start: identityTransform as Transform,
    startDistance: 0,
    startCenter: { x: 0, y: 0 },
    moved: false,
    startedAt: 0,
    startPoint: { x: 0, y: 0 },
    wasPinch: false,
  });
  const lastTap = useRef(0);
  const fitted = useMemo(
    () => (natural ? fitSize(natural, container) : container),
    [container, natural],
  );
  const live = useRef({ fitted, container, onSwipe, onZoomed });

  useEffect(() => {
    live.current = { fitted, container, onSwipe, onZoomed };
  });

  const apply = useCallback(
    (next: Transform) => {
      const clamped = clampTransform(next, live.current.fitted, live.current.container);

      transform.current = clamped;
      scale.setValue(clamped.scale);
      translateX.setValue(clamped.x);
      translateY.setValue(clamped.y);
      live.current.onZoomed?.(clamped.scale > 1.02);
    },
    [scale, translateX, translateY],
  );

  const measure = useCallback(() => {
    root.current?.measureInWindow((x, y) => {
      origin.current = { x, y };
    });
  }, []);

  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { width, height } = event.nativeEvent.layout;

      setContainer({ width, height });
      measure();
    },
    [measure],
  );

  const point = useCallback((touch: { pageX: number; pageY: number }) => {
    const { width, height } = live.current.container;

    return {
      x: touch.pageX - origin.current.x - width / 2,
      y: touch.pageY - origin.current.y - height / 2,
    };
  }, []);

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (event: GestureResponderEvent) => {
          measure();

          const touches = event.nativeEvent.touches;
          const first = touches[0];

          gesture.current = {
            start: transform.current,
            startDistance: 0,
            startCenter: { x: 0, y: 0 },
            moved: false,
            startedAt: Date.now(),
            startPoint: first ? { x: first.pageX, y: first.pageY } : { x: 0, y: 0 },
            wasPinch: false,
          };
        },
        onPanResponderMove: (event, state) => {
          const touches = event.nativeEvent.touches;
          const current = gesture.current;
          const [a, b] = touches;

          if (a && b) {
            const pa = point(a);
            const pb = point(b);
            const distance = touchDistance(pa, pb);
            const center = { x: (pa.x + pb.x) / 2, y: (pa.y + pb.y) / 2 };

            if (!current.wasPinch || current.startDistance === 0) {
              current.wasPinch = true;
              current.startDistance = distance;
              current.startCenter = center;
              current.start = transform.current;
            }

            current.moved = true;
            apply(
              pinchTransform(
                current.start,
                current.startDistance,
                distance,
                current.startCenter,
                center,
              ),
            );
            return;
          }

          if (current.wasPinch) {
            // One finger left after a pinch: continue as a pan from where the pinch ended.
            current.wasPinch = false;
            current.startDistance = 0;
            current.start = transform.current;
            current.startPoint = a ? { x: a.pageX, y: a.pageY } : current.startPoint;
            return;
          }

          if (Math.abs(state.dx) > TAP_SLOP || Math.abs(state.dy) > TAP_SLOP) {
            current.moved = true;
          }

          if (transform.current.scale > 1.02 || current.start.scale > 1.02) {
            apply({
              scale: current.start.scale,
              x: current.start.x + state.dx,
              y: current.start.y + state.dy,
            });
          }
        },
        onPanResponderRelease: (event, state) => {
          const current = gesture.current;
          const duration = Date.now() - current.startedAt;
          const touch = event.nativeEvent.changedTouches[0];

          if (!current.moved && duration < TAP_MS && touch) {
            const now = Date.now();

            if (now - lastTap.current < DOUBLE_TAP_MS) {
              lastTap.current = 0;
              apply(doubleTapTransform(transform.current, point(touch)));
            } else {
              lastTap.current = now;
            }

            return;
          }

          if (
            !current.wasPinch &&
            transform.current.scale <= 1.02 &&
            Math.abs(state.dx) > SWIPE_DISTANCE &&
            Math.abs(state.dx) > Math.abs(state.dy) * 1.5
          ) {
            live.current.onSwipe?.(state.dx < 0 ? 'next' : 'previous');
          }

          apply(transform.current.scale < 1 ? identityTransform : transform.current);
        },
      }),
    [apply, measure, point],
  );

  // A different picture (next PDF page) always starts un-zoomed.
  useEffect(() => {
    apply(identityTransform);
    setFullReady(false);
    fade.setValue(0);
    setNatural(null);
  }, [apply, fade, uri]);

  const animatedStyle = {
    transform: [{ translateX }, { translateY }, { scale }],
  };
  const imageSize = { width: container.width, height: container.height };

  return (
    <View
      accessibilityIgnoresInvertColors
      accessibilityLabel={accessibilityLabel}
      accessible
      collapsable={false}
      onLayout={handleLayout}
      ref={root}
      style={styles.root}
      {...responder.panHandlers}
    >
      <Animated.View pointerEvents="none" style={[imageSize, styles.layer, animatedStyle]}>
        {previewUri ? (
          <Image
            blurRadius={fullReady ? 0 : 6}
            resizeMode="contain"
            source={{ uri: previewUri }}
            style={[imageSize, styles.image, fullReady ? styles.hidden : null]}
          />
        ) : null}
        {uri ? (
          <Animated.Image
            fadeDuration={0}
            onError={onError}
            onLoad={(event) => {
              const { width, height } = event.nativeEvent.source;

              setNatural({ width, height });
              setFullReady(true);
              onFullLoaded?.();
              Animated.timing(fade, { toValue: 1, duration: 160, useNativeDriver: true }).start();
            }}
            resizeMode="contain"
            source={{ uri }}
            style={[imageSize, styles.image, { opacity: fade }]}
          />
        ) : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden', backgroundColor: '#000000' },
  layer: { position: 'absolute', left: 0, top: 0 },
  image: { position: 'absolute', left: 0, top: 0 },
  hidden: { opacity: 0 },
});
