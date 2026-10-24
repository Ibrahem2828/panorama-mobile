import type { Annotation } from './model';

export type Size = { width: number; height: number };
export type Rect = { x: number; y: number; width: number; height: number };
export type Point = { x: number; y: number };

/** Where a `contain`-fitted image of `natural` size is drawn inside `container` (the layer must match it exactly). */
export function fitRect(container: Size, natural: Size): Rect {
  if (container.width <= 0 || container.height <= 0 || natural.width <= 0 || natural.height <= 0) {
    return { x: 0, y: 0, width: container.width, height: container.height };
  }

  const scale = Math.min(container.width / natural.width, container.height / natural.height);
  const width = natural.width * scale;
  const height = natural.height * scale;

  return { x: (container.width - width) / 2, y: (container.height - height) / 2, width, height };
}

export function clamp01(value: number): number {
  return value < 0 ? 0 : value > 1 ? 1 : value;
}

/** Screen point (inside the page box) -> page-relative 0..1. */
export function toRelative(point: Point, box: Size): Point {
  return {
    x: box.width > 0 ? clamp01(point.x / box.width) : 0,
    y: box.height > 0 ? clamp01(point.y / box.height) : 0,
  };
}

/** Rectangle spanned by two points, in relative coordinates. */
export function rectFromPoints(a: Point, b: Point): [number, number, number, number] {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);

  return [x, y, Math.abs(a.x - b.x), Math.abs(a.y - b.y)];
}

/** An underline is a thin strip under the dragged span. */
export const UNDERLINE_THICKNESS = 0.004;

export function underlineRect(a: Point, b: Point): [number, number, number, number] {
  const x = Math.min(a.x, b.x);
  const y = Math.max(a.y, b.y);

  return [x, y, Math.abs(a.x - b.x), UNDERLINE_THICKNESS];
}

/** Keeps a pen stroke light: drops points closer than `minDistance` (relative units) to the previous kept one. */
export function simplifyStroke(points: readonly Point[], minDistance = 0.002): Point[] {
  const out: Point[] = [];

  for (const point of points) {
    const last = out[out.length - 1];

    if (!last || Math.hypot(point.x - last.x, point.y - last.y) >= minDistance) {
      out.push(point);
    }
  }

  const final = points[points.length - 1];

  if (final && out[out.length - 1] !== final && out.length > 1) {
    out.push(final);
  }

  return out;
}

function distanceToSegment(point: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSquared = dx * dx + dy * dy;
  const t =
    lengthSquared === 0
      ? 0
      : clamp01(((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSquared);

  return Math.hypot(point.x - (a.x + t * dx), point.y - (a.y + t * dy));
}

/** Eraser hit test in relative coordinates; `tolerance` is the touch radius as a fraction of the page width. */
export function hitsAnnotation(item: Annotation, point: Point, tolerance: number): boolean {
  const data = item.data;

  if ('rects' in data) {
    return data.rects.some(
      ([x, y, w, h]) =>
        point.x >= x - tolerance &&
        point.x <= x + w + tolerance &&
        point.y >= y - tolerance &&
        point.y <= y + h + tolerance,
    );
  }

  if ('points' in data) {
    const points = data.points;

    for (let index = 0; index < points.length; index += 1) {
      const current = points[index];
      const previous = points[index - 1] ?? current;

      if (
        current &&
        previous &&
        distanceToSegment(
          point,
          { x: previous[0], y: previous[1] },
          { x: current[0], y: current[1] },
        ) <= tolerance
      ) {
        return true;
      }
    }

    return false;
  }

  // Sticky note: a small square around its anchor.
  return Math.abs(point.x - data.x) <= tolerance * 2 && Math.abs(point.y - data.y) <= tolerance * 2;
}

/** Topmost mark under the touch point (later marks are drawn on top), or null. */
export function topmostHit(
  items: readonly Annotation[],
  point: Point,
  tolerance: number,
): Annotation | null {
  for (let index = items.length - 1; index >= 0; index -= 1) {
    const item = items[index];

    if (item && hitsAnnotation(item, point, tolerance)) {
      return item;
    }
  }

  return null;
}

export const HIGHLIGHT_COLORS = {
  yellow: '#FFE45C',
  green: '#7EE08A',
  pink: '#FF9EC4',
  blue: '#8CC8FF',
} as const;

export const PEN_COLORS = { black: '#101828', red: '#D93025' } as const;

export type HighlightColor = keyof typeof HIGHLIGHT_COLORS;
export type PenColor = keyof typeof PEN_COLORS;

export function colorValue(name: string): string {
  return (
    (HIGHLIGHT_COLORS as Record<string, string>)[name] ??
    (PEN_COLORS as Record<string, string>)[name] ??
    PEN_COLORS.black
  );
}

/** Stroke widths relative to the page width, so a thick line looks the same on every screen. */
export const PEN_WIDTHS = { 1: 0.004, 2: 0.01 } as const;
