export type Transform = { scale: number; x: number; y: number };
export type Box = { width: number; height: number };

export const MIN_SCALE = 1;
export const MAX_SCALE = 5;
export const DOUBLE_TAP_SCALE = 2.5;

export const identityTransform: Transform = { scale: 1, x: 0, y: 0 };

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** The image is laid out "contain" inside the box; this is the size it really occupies at scale 1. */
export function fitSize(natural: Box, container: Box): Box {
  if (natural.width <= 0 || natural.height <= 0 || container.width <= 0 || container.height <= 0) {
    return container;
  }

  const ratio = Math.min(container.width / natural.width, container.height / natural.height);

  return { width: natural.width * ratio, height: natural.height * ratio };
}

/** Keeps a zoomed image from being dragged away: it may only move while it is larger than the viewport. */
export function clampTransform(transform: Transform, fitted: Box, container: Box): Transform {
  const scale = clamp(transform.scale, MIN_SCALE, MAX_SCALE);
  const limitX = Math.max(0, (fitted.width * scale - container.width) / 2);
  const limitY = Math.max(0, (fitted.height * scale - container.height) / 2);

  return { scale, x: clamp(transform.x, -limitX, limitX), y: clamp(transform.y, -limitY, limitY) };
}

export function touchDistance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
 * New transform while two fingers move: the scale follows the finger distance and the content under the pinch centre stays
 * under it. `center` is relative to the viewport centre.
 */
export function pinchTransform(
  start: Transform,
  startDistance: number,
  distance: number,
  startCenter: { x: number; y: number },
  center: { x: number; y: number },
): Transform {
  if (startDistance <= 0) {
    return start;
  }

  const scale = clamp(start.scale * (distance / startDistance), MIN_SCALE * 0.8, MAX_SCALE * 1.2);
  const ratio = scale / start.scale;

  return {
    scale,
    x: center.x - (startCenter.x - start.x) * ratio,
    y: center.y - (startCenter.y - start.y) * ratio,
  };
}

/** Double tap toggles between fit and a zoomed view centred on the tapped point. */
export function doubleTapTransform(current: Transform, tap: { x: number; y: number }): Transform {
  if (current.scale > 1.05) {
    return identityTransform;
  }

  return {
    scale: DOUBLE_TAP_SCALE,
    x: -tap.x * (DOUBLE_TAP_SCALE - 1),
    y: -tap.y * (DOUBLE_TAP_SCALE - 1),
  };
}
