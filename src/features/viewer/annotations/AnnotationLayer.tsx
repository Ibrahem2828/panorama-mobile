import { memo, useMemo, useRef, useState } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Path, Rect, Text as SvgText } from 'react-native-svg';

import {
  colorValue,
  PEN_WIDTHS,
  rectFromPoints,
  simplifyStroke,
  toRelative,
  topmostHit,
  underlineRect,
  type Point,
  type Size,
} from './geometry';
import type { Annotation, AnnotationData } from './model';

export type Tool = 'highlight' | 'underline' | 'pen' | 'note' | 'eraser';

export type DraftMark = Omit<Annotation, 'clientId' | 'version' | 'deleted'>;

type Props = {
  /** Size in pixels of the page box this layer covers exactly. */
  size: Size;
  page: number;
  items: readonly Annotation[];
  /** `read` lets touches through to the page (scroll / zoom / swipe); `write` draws with one finger. */
  mode: 'read' | 'write';
  tool: Tool;
  color: string;
  width: number;
  onAdd: (mark: DraftMark) => void;
  onErase: (clientId: string) => void;
  /** Tap with the note tool (new note) or on an existing note (edit it). */
  onNote: (point: Point, existing: Annotation | null) => void;
};

const HIGHLIGHT_OPACITY = 0.38;
/** Touch radius of the eraser and of note hit-testing, as a fraction of the page width. */
const ERASER_RADIUS = 0.025;
const MIN_DRAG = 0.004;

function polyline(points: readonly [number, number][], size: Size): string {
  return points
    .map(
      ([x, y], index) =>
        `${index === 0 ? 'M' : 'L'}${(x * size.width).toFixed(1)} ${(y * size.height).toFixed(1)}`,
    )
    .join(' ');
}

function renderMark(item: Annotation, size: Size, key: string) {
  const data: AnnotationData = item.data;

  if ('rects' in data) {
    return data.rects.map(([x, y, w, h], index) => (
      <Rect
        fill={colorValue(item.color)}
        fillOpacity={item.kind === 'highlight' ? HIGHLIGHT_OPACITY : 1}
        height={Math.max(h * size.height, 1.5)}
        key={`${key}-${index}`}
        rx={item.kind === 'highlight' ? 2 : 0}
        width={w * size.width}
        x={x * size.width}
        y={y * size.height}
      />
    ));
  }

  if ('points' in data) {
    return (
      <Path
        d={polyline(data.points, size)}
        fill="none"
        key={key}
        stroke={colorValue(item.color)}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={Math.max((PEN_WIDTHS[item.width === 2 ? 2 : 1] ?? 0.004) * size.width, 1.5)}
      />
    );
  }

  const radius = Math.max(size.width * 0.022, 9);

  return (
    <G key={key}>
      <Circle
        cx={data.x * size.width}
        cy={data.y * size.height}
        fill="#FFD43B"
        r={radius}
        stroke="#101828"
        strokeWidth={1}
      />
      <SvgText
        fill="#101828"
        fontSize={radius * 1.1}
        fontWeight="bold"
        textAnchor="middle"
        x={data.x * size.width}
        y={data.y * size.height + radius * 0.38}
      >
        ✎
      </SvgText>
    </G>
  );
}

/**
 * Vector layer over one page. Marks are stored page-relative, so they stay exact at any zoom. In write mode a single
 * finger draws (highlight / underline = drag a span, pen = free stroke, note = tap, eraser = touch a mark); in read
 * mode the layer is transparent to touches, so reading gestures never draw by accident.
 */
export const AnnotationLayer = memo(function AnnotationLayer({
  size,
  page,
  items,
  mode,
  tool,
  color,
  width,
  onAdd,
  onErase,
  onNote,
}: Props) {
  const [draft, setDraft] = useState<DraftMark | null>(null);
  const latest = useRef({ size, page, items, tool, color, width, onAdd, onErase, onNote });
  const start = useRef<Point | null>(null);
  const stroke = useRef<Point[]>([]);

  latest.current = { size, page, items, tool, color, width, onAdd, onErase, onNote };

  const responder = useMemo(() => {
    const relative = (event: { nativeEvent: { locationX: number; locationY: number } }) =>
      toRelative(
        { x: event.nativeEvent.locationX, y: event.nativeEvent.locationY },
        latest.current.size,
      );
    const draftFor = (from: Point, to: Point): DraftMark | null => {
      const { tool: current, color: currentColor, page: currentPage } = latest.current;

      if (current === 'highlight') {
        return {
          page: currentPage,
          kind: 'highlight',
          color: currentColor,
          width: 1,
          data: { rects: [rectFromPoints(from, to)] },
        };
      }

      if (current === 'underline') {
        return {
          page: currentPage,
          kind: 'underline',
          color: currentColor,
          width: 1,
          data: { rects: [underlineRect(from, to)] },
        };
      }

      return null;
    };
    const eraseAt = (point: Point) => {
      const hit = topmostHit(latest.current.items, point, ERASER_RADIUS);

      if (hit) {
        latest.current.onErase(hit.clientId);
      }
    };

    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (event) => {
        const point = relative(event);

        start.current = point;
        stroke.current = [point];

        if (latest.current.tool === 'eraser') {
          eraseAt(point);
        }
      },
      onPanResponderMove: (event, gesture) => {
        if (gesture.numberActiveTouches > 1 || !start.current) {
          return; // a second finger never draws
        }

        const point = relative(event);
        const { tool: current } = latest.current;

        if (current === 'pen') {
          stroke.current.push(point);
          setDraft({
            page: latest.current.page,
            kind: 'pen',
            color: latest.current.color,
            width: latest.current.width,
            data: {
              points: simplifyStroke(stroke.current).map((p) => [p.x, p.y] as [number, number]),
            },
          });
        } else if (current === 'eraser') {
          eraseAt(point);
        } else if (current === 'highlight' || current === 'underline') {
          setDraft(draftFor(start.current, point));
        }
      },
      onPanResponderRelease: (event) => {
        const from = start.current;
        const point = relative(event);
        const { tool: current } = latest.current;

        start.current = null;
        setDraft(null);

        if (!from) {
          return;
        }

        const moved = Math.hypot(point.x - from.x, point.y - from.y);

        if (current === 'note') {
          if (moved < MIN_DRAG * 4) {
            const existing = topmostHit(
              latest.current.items.filter((item) => item.kind === 'note'),
              point,
              ERASER_RADIUS,
            );

            latest.current.onNote(point, existing);
          }
        } else if (current === 'pen') {
          const points = simplifyStroke(stroke.current);

          // A tap leaves a dot; a stroke needs at least two points.
          const final =
            points.length >= 2 ? points : [point, { x: Math.min(point.x + 0.001, 1), y: point.y }];

          latest.current.onAdd({
            page: latest.current.page,
            kind: 'pen',
            color: latest.current.color,
            width: latest.current.width,
            data: { points: final.map((p) => [p.x, p.y] as [number, number]) },
          });
        } else if (current === 'highlight' || current === 'underline') {
          if (moved >= MIN_DRAG) {
            const mark = draftFor(from, point);

            if (mark) {
              latest.current.onAdd(mark);
            }
          }
        }

        stroke.current = [];
      },
      onPanResponderTerminate: () => {
        start.current = null;
        stroke.current = [];
        setDraft(null);
      },
    });
  }, []);

  const draftItem: Annotation | null = draft
    ? { ...draft, clientId: 'draft', version: null, deleted: false }
    : null;

  return (
    <View
      pointerEvents={mode === 'write' ? 'auto' : 'box-none'}
      style={[styles.layer, { width: size.width, height: size.height }]}
      {...(mode === 'write' ? responder.panHandlers : {})}
    >
      <Svg height={size.height} pointerEvents="none" width={size.width}>
        {items.map((item) => renderMark(item, size, item.clientId))}
        {draftItem ? renderMark(draftItem, size, 'draft') : null}
      </Svg>
    </View>
  );
});

const styles = StyleSheet.create({
  layer: { position: 'absolute', top: 0, start: 0 },
});
