import { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Line, Rect } from 'react-native-svg';

import { AppText, Stack } from '../../../components';
import { useTranslation } from '../../../i18n';
import { colors, radius, spacing, useBrand } from '../../../theme';
import { buildPrintPreview, spiralRingCount, type PrintPreviewModel } from '../services/printPreview';
import type { PrintCartItem } from '../types';
import { usePrintOptionLabels } from './PrintItemOptions';

const CANVAS_WIDTH = 240;
const CANVAS_HEIGHT = 220;
/** Arabic documents open from the right, so the binding edge is the right edge. */
const COIL_COLOR = '#6B7280';
const STAPLE_COLOR = '#9CA3AF';

type SheetProps = {
  model: PrintPreviewModel;
  x: number;
  y: number;
  front: boolean;
};

function Sheet({ model, x, y, front }: SheetProps) {
  const brand = useBrand();
  const { sheetWidth: w, sheetHeight: h, colored, doubleSided } = model;
  const margin = Math.max(6, Math.round(w * 0.1));
  const right = x + w - margin - (model.binding === 'thermal' ? 8 : 0);
  const textWidth = w - margin * 2 - (model.binding === 'thermal' ? 8 : 0);
  const ink = colored ? brand.primary : COIL_COLOR;
  const lineCount = Math.max(5, Math.floor((h - margin * 3) / 9) - 3);
  const widths = [1, 0.92, 0.97, 0.7, 1, 0.88, 0.95, 0.6, 1, 0.9, 0.78, 0.94, 0.55, 1];
  const imageHeight = Math.round(h * 0.2);

  return (
    <G>
      <Rect
        fill={colors.background.surface}
        height={h}
        rx={2.5}
        stroke={colors.border.strong}
        strokeWidth={0.9}
        width={w}
        x={x}
        y={y}
      />
      {front ? (
        <>
          {/* Text blocks start at the right edge, like Arabic text does. */}
          <Rect
            fill={ink}
            height={4.5}
            opacity={0.95}
            rx={1.5}
            width={textWidth * 0.5}
            x={right - textWidth * 0.5}
            y={y + margin}
          />
          {Array.from({ length: lineCount }, (_, index) => {
            const top = y + margin + 12 + index * 8.5;
            const afterImage = index >= 3 ? imageHeight + 6 : 0;
            const ratio = widths[index % widths.length] ?? 1;

            return (
              <Rect
                fill={colors.gray[300]}
                height={2.6}
                key={index}
                opacity={doubleSided ? 0.95 : 1}
                rx={1.2}
                width={textWidth * ratio}
                x={right - textWidth * ratio}
                y={top + afterImage}
              />
            );
          })}
          {/* A picture block: three brand colours when printed in colour, flat grey in black and white. */}
          <G>
            <Rect
              fill={colored ? brand.primary : colors.gray[200]}
              height={imageHeight}
              rx={2}
              width={textWidth * 0.46}
              x={right - textWidth * 0.46}
              y={y + margin + 12 + 3 * 8.5}
            />
            {colored ? (
              <>
                <Rect
                  fill={brand.accent}
                  height={imageHeight}
                  width={textWidth * 0.18}
                  x={right - textWidth * 0.46}
                  y={y + margin + 12 + 3 * 8.5}
                />
                <Rect
                  fill={colors.semantic.warning}
                  height={imageHeight * 0.45}
                  rx={1}
                  width={textWidth * 0.14}
                  x={right - textWidth * 0.3}
                  y={y + margin + 12 + 3 * 8.5 + imageHeight * 0.55}
                />
              </>
            ) : null}
          </G>
          {doubleSided && h > 100 ? (
            // The other face showing through the paper, mirrored, so "two sides" reads at a glance.
            <G opacity={0.16}>
              {Array.from({ length: 3 }, (_, index) => (
                <Line
                  key={index}
                  stroke={colors.gray[700]}
                  strokeWidth={2}
                  x1={x + margin + 4}
                  x2={x + margin + 4 + textWidth * (0.5 + (index % 3) * 0.15)}
                  y1={y + h - margin - 8 - index * 8}
                  y2={y + h - margin - 8 - index * 8}
                />
              ))}
            </G>
          ) : null}
        </>
      ) : null}
    </G>
  );
}

function Binding({ model, x, y }: { model: PrintPreviewModel; x: number; y: number }) {
  const brand = useBrand();
  const { sheetWidth: w, sheetHeight: h, binding } = model;
  const edge = x + w;

  if (binding === 'spiral') {
    const rings = spiralRingCount(h);
    const gap = (h - 12) / rings;

    return (
      <G>
        {Array.from({ length: rings }, (_, index) => {
          const cy = y + 9 + index * gap;

          return (
            <G key={index}>
              <Circle cx={edge - 5} cy={cy} fill={colors.background.primary} r={1.7} />
              <Ellipse
                cx={edge - 1}
                cy={cy}
                fill="none"
                rx={6}
                ry={2.6}
                stroke={COIL_COLOR}
                strokeWidth={1.7}
              />
            </G>
          );
        })}
      </G>
    );
  }

  if (binding === 'thermal') {
    return (
      <G>
        <Rect fill={brand.primary} height={h} rx={1.5} width={8} x={edge - 8} y={y} />
        <Rect fill="#FFFFFF" height={h - 6} opacity={0.22} width={1.6} x={edge - 6} y={y + 3} />
        <Line stroke="#FFFFFF" strokeOpacity={0.4} strokeWidth={0.8} x1={edge - 8} x2={edge - 8} y1={y} y2={y + h} />
      </G>
    );
  }

  if (binding === 'staple') {
    const sx = edge - 22;
    const sy = y + 10;

    return (
      <G origin={`${sx + 8}, ${sy}`} rotation={-38}>
        <Line stroke="#000000" strokeLinecap="round" strokeOpacity={0.18} strokeWidth={3.6} x1={sx + 0.6} x2={sx + 16.6} y1={sy + 1.4} y2={sy + 1.4} />
        <Line stroke={STAPLE_COLOR} strokeLinecap="round" strokeWidth={3.2} x1={sx} x2={sx + 16} y1={sy} y2={sy} />
        <Line stroke="#FFFFFF" strokeLinecap="round" strokeOpacity={0.75} strokeWidth={0.9} x1={sx + 1.5} x2={sx + 14.5} y1={sy - 0.8} y2={sy - 0.8} />
      </G>
    );
  }

  return null;
}

function PrintOrderPreviewComponent({
  item,
  pages,
}: {
  item: Pick<PrintCartItem, 'paperSize' | 'colorMode' | 'sides' | 'binding' | 'copies'>;
  /** Pages per copy when known (after a quote, or on a placed order). */
  pages?: number | null;
}) {
  const { t } = useTranslation();
  const labels = usePrintOptionLabels();
  const model = useMemo(() => buildPrintPreview(item), [item]);
  const brand = useBrand();

  const frontX = (CANVAS_WIDTH - model.sheetWidth) / 2 + model.stackDepth * 2;
  const frontY = (CANVAS_HEIGHT - model.sheetHeight) / 2 - model.stackDepth * 2;
  const backSheets = Array.from({ length: model.stackDepth }, (_, index) => model.stackDepth - index);
  const bindingKey = model.binding;

  const caption = [
    item.copies > 1 ? t.printing.preview.copies(item.copies) : null,
    pages ? t.printing.preview.pages(pages) : null,
    model.paperSize,
    labels[item.colorMode],
    labels[item.sides],
    labels[item.binding],
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <View
      accessible
      accessibilityLabel={`${t.printing.preview.title}: ${caption}`}
      style={[styles.box, { backgroundColor: brand.primarySoft }]}
    >
      <AppText color="muted" variant="caption" weight="700">
        {t.printing.preview.title}
      </AppText>
      <Svg height={CANVAS_HEIGHT} viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`} width="100%">
        {/* Soft ground shadow under the stack. */}
        <Ellipse
          cx={CANVAS_WIDTH / 2}
          cy={CANVAS_HEIGHT - 8}
          fill="#000000"
          opacity={0.08}
          rx={model.sheetWidth * 0.62}
          ry={5}
        />
        {backSheets.map((depth) => {
          const x = frontX - depth * 4;
          const y = frontY + depth * 4;
          // Loose sheets are not squared up: each copy sits at a slightly different angle.
          const tilt = model.binding === 'none' ? (depth % 2 === 0 ? 1.6 : -1.3) : 0;

          return (
            <G key={depth} origin={`${x + model.sheetWidth / 2}, ${y + model.sheetHeight / 2}`} rotation={tilt}>
              <Sheet front={false} model={model} x={x} y={y} />
              <Binding model={model} x={x} y={y} />
            </G>
          );
        })}
        <G key={bindingKey}>
          <Sheet front model={model} x={frontX} y={frontY} />
          <Binding model={model} x={frontX} y={frontY} />
        </G>
      </Svg>
      {model.copies > 1 ? (
        <View style={[styles.badge, { backgroundColor: brand.primary }]}>
          <AppText color="inverse" variant="caption" weight="700">
            {`×${model.copies}`}
          </AppText>
        </View>
      ) : null}
      <Stack gap="xs">
        <AppText color="secondary" variant="caption">
          {caption}
        </AppText>
        <AppText color="muted" variant="caption">
          {t.printing.preview.bindingHint[item.binding]}
        </AppText>
      </Stack>
    </View>
  );
}

export const PrintOrderPreview = memo(PrintOrderPreviewComponent);

const styles = StyleSheet.create({
  box: { borderRadius: radius.card, padding: spacing.md, gap: spacing.sm },
  badge: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    minWidth: 34,
    borderRadius: radius.button,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    alignItems: 'center',
  },
});
