import { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';

import { AppText, Stack } from '../../../components';
import { useTranslation } from '../../../i18n';
import { colors, radius, spacing, useBrand } from '../../../theme';
import {
  buildSheetSimulation,
  type SheetSimulation,
  type SimulationFace,
  type SimulationInput,
} from '../services/printOptions';

const CANVAS_WIDTH = 280;
const CANVAS_HEIGHT = 190;
const SHEET_LONG = 150;
const SHEET_SHORT = Math.round(SHEET_LONG / Math.SQRT2);

type FaceProps = {
  face: SimulationFace;
  simulation: SheetSimulation;
  x: number;
  y: number;
  label: string;
  tint: string;
  coverColor?: string;
};

/** One face of a sheet: the paper with its grid of pages, each cell showing the page number it will carry. */
function Face({ face, simulation, x, y, label, tint, coverColor }: FaceProps) {
  const { layout } = simulation;
  const width = layout.landscape ? SHEET_LONG : SHEET_SHORT;
  const height = layout.landscape ? SHEET_SHORT : SHEET_LONG;
  const scale = Math.min(1, 118 / width, 150 / height);
  const w = width * scale;
  const h = height * scale;
  const margin = layout.pagesPerSheet === 1 ? 0 : 5;
  const gap = 2.5;
  const cellW = (w - margin * 2 - (layout.columns - 1) * gap) / layout.columns;
  const cellH = (h - margin * 2 - (layout.rows - 1) * gap) / layout.rows;

  return (
    <G>
      {coverColor ? (
        <Rect fill={coverColor} height={h} rx={2} width={w} x={x + 3} y={y + 3} />
      ) : null}
      <Rect
        fill={colors.background.surface}
        height={h}
        rx={2}
        stroke={colors.border.strong}
        strokeWidth={0.9}
        width={w}
        x={x}
        y={y}
      />
      {face.cells.map((page, index) => {
        const row = Math.floor(index / layout.columns);
        const column = index % layout.columns;
        const cx = x + margin + column * (cellW + gap);
        const cy = y + margin + row * (cellH + gap);

        return (
          <G key={index}>
            <Rect
              fill={page === null ? 'none' : tint}
              height={cellH}
              opacity={page === null ? 1 : 0.14}
              rx={1.5}
              stroke={page === null ? colors.gray[200] : tint}
              strokeDasharray={page === null ? '2,2' : undefined}
              strokeWidth={0.7}
              width={cellW}
              x={cx}
              y={cy}
            />
            {page !== null ? (
              <SvgText
                fill={colors.text.primary}
                fontSize={Math.max(7, Math.min(cellH * 0.5, cellW * 0.5, 22))}
                fontWeight="700"
                textAnchor="middle"
                x={cx + cellW / 2}
                y={cy + cellH / 2 + Math.min(cellH * 0.18, 7)}
              >
                {String(page)}
              </SvgText>
            ) : null}
          </G>
        );
      })}
      <SvgText
        fill={colors.text.muted}
        fontSize={9}
        textAnchor="middle"
        x={x + w / 2}
        y={y + h + 11}
      >
        {label}
      </SvgText>
    </G>
  );
}

function PrintSheetSimulationComponent({
  input,
  coverColor,
}: {
  input: SimulationInput;
  coverColor?: string;
}) {
  const { t } = useTranslation();
  const brand = useBrand();
  const simulation = useMemo(() => buildSheetSimulation(input), [input]);
  const { layout } = simulation;
  const faceWidth = layout.landscape ? SHEET_LONG : SHEET_SHORT;
  const scale = Math.min(1, 118 / faceWidth, 150 / (layout.landscape ? SHEET_SHORT : SHEET_LONG));
  const w = faceWidth * scale;
  const h = (layout.landscape ? SHEET_SHORT : SHEET_LONG) * scale;
  const twoFaces = simulation.doubleSided;
  const total = twoFaces ? w * 2 + 34 : w;
  const startX = (CANVAS_WIDTH - total) / 2;
  const y = (CANVAS_HEIGHT - 26 - h) / 2;
  const shortEdge = simulation.flipEdge === 'short_edge';
  // Arabic documents are read from the right, so the front face sits on the right and the back to its left.
  const frontX = twoFaces ? startX + w + 34 : startX;
  const backX = startX;
  const flipX = backX + w + 17;

  const caption = [
    t.printing.simulation.perSheet(layout.pagesPerSheet),
    twoFaces
      ? shortEdge
        ? t.printing.simulation.flipShort
        : t.printing.simulation.flipLong
      : t.printing.simulation.oneSide,
    t.printing.simulation.sheetsTotal(simulation.totalSheets),
  ].join(' · ');

  return (
    <View
      accessible
      accessibilityLabel={`${t.printing.simulation.title}: ${caption}`}
      style={[styles.box, { backgroundColor: brand.primarySoft }]}
    >
      <AppText color="muted" variant="caption" weight="700">
        {t.printing.simulation.title}
      </AppText>
      <Svg height={CANVAS_HEIGHT} viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`} width="100%">
        {twoFaces && simulation.back ? (
          <Face
            coverColor={undefined}
            face={simulation.back}
            label={t.printing.simulation.back}
            simulation={simulation}
            tint={brand.accent}
            x={backX}
            y={y}
          />
        ) : null}
        <Face
          coverColor={coverColor}
          face={simulation.front}
          label={t.printing.simulation.front}
          simulation={simulation}
          tint={brand.primary}
          x={frontX}
          y={y}
        />
        {twoFaces ? (
          <G>
            {/* The turn between the faces: a vertical fold for the long edge, a horizontal one for the short edge. */}
            {shortEdge ? (
              <Line
                stroke={colors.gray[500]}
                strokeDasharray="3,3"
                strokeWidth={1}
                x1={flipX - 12}
                x2={flipX + 12}
                y1={y + h / 2}
                y2={y + h / 2}
              />
            ) : (
              <Line
                stroke={colors.gray[500]}
                strokeDasharray="3,3"
                strokeWidth={1}
                x1={flipX}
                x2={flipX}
                y1={y + h / 2 - 22}
                y2={y + h / 2 + 22}
              />
            )}
            <Path
              d={
                shortEdge
                  ? `M ${flipX - 9} ${y + h / 2 - 10} Q ${flipX} ${y + h / 2 - 22} ${flipX + 9} ${y + h / 2 - 10}`
                  : `M ${flipX - 8} ${y + h / 2 - 16} Q ${flipX - 18} ${y + h / 2} ${flipX - 8} ${y + h / 2 + 16}`
              }
              fill="none"
              stroke={brand.primary}
              strokeLinecap="round"
              strokeWidth={1.6}
            />
          </G>
        ) : null}
      </Svg>
      <Stack gap="xs">
        <AppText color="secondary" variant="caption">
          {caption}
        </AppText>
        {simulation.copies > 1 ? (
          <AppText color="muted" variant="caption">
            {input.doubleSided
              ? t.printing.simulation.copiesDouble(simulation.copies, simulation.sheetsPerCopy)
              : t.printing.simulation.copiesSingle(simulation.copies, simulation.sheetsPerCopy)}
          </AppText>
        ) : null}
        {simulation.isSample ? (
          <AppText color="muted" variant="caption">
            {t.printing.simulation.sample}
          </AppText>
        ) : null}
      </Stack>
    </View>
  );
}

export const PrintSheetSimulation = memo(PrintSheetSimulationComponent);

const styles = StyleSheet.create({
  box: { borderRadius: radius.card, padding: spacing.md, gap: spacing.sm },
});
