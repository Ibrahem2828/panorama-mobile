import type { PrintBinding, PrintColorMode, PrintPaperSize, PrintSides } from '../types';

/** Width of each paper size relative to A4 (A5 is half an A4 sheet, A3 is two A4 sheets). */
const PAPER_WIDTH_SCALE: Record<PrintPaperSize, number> = { A5: 0.71, A4: 1, A3: 1.41 };

/** Every ISO "A" size has the same 1 : sqrt(2) shape. */
const PAPER_ASPECT = Math.SQRT2;

/** The most stacked copies drawn; beyond it the badge carries the real number. */
export const MAX_VISIBLE_COPIES = 4;

/** Widest sheet (A3) drawn in the preview canvas; the other sizes keep their true proportion to it. */
const A3_DRAW_WIDTH = 128;

export type PrintPreviewInput = {
  paperSize: PrintPaperSize;
  colorMode: PrintColorMode;
  sides: PrintSides;
  binding: PrintBinding;
  copies: number;
};

export type PrintPreviewModel = {
  paperSize: PrintPaperSize;
  colored: boolean;
  doubleSided: boolean;
  binding: PrintBinding;
  copies: number;
  /** Sheets drawn behind the front one: one per extra copy, capped. */
  stackDepth: number;
  /** Drawn width / height of one sheet in the preview canvas. */
  sheetWidth: number;
  sheetHeight: number;
  /** Spiral and thermal binding turn the sheets into one booklet; staples and loose sheets do not. */
  isBooklet: boolean;
};

export function buildPrintPreview(input: PrintPreviewInput): PrintPreviewModel {
  const copies = Math.max(1, Math.floor(Number.isFinite(input.copies) ? input.copies : 1));
  const sheetWidth = Math.round((A3_DRAW_WIDTH * PAPER_WIDTH_SCALE[input.paperSize]) / PAPER_WIDTH_SCALE.A3);

  return {
    paperSize: input.paperSize,
    colored: input.colorMode === 'color',
    doubleSided: input.sides === 'double_sided',
    binding: input.binding,
    copies,
    stackDepth: Math.min(copies, MAX_VISIBLE_COPIES) - 1,
    sheetWidth,
    sheetHeight: Math.round(sheetWidth * PAPER_ASPECT),
    isBooklet: input.binding === 'spiral' || input.binding === 'thermal',
  };
}

/** Number of coil loops along a spiral-bound edge of the given height (about one every 9 units). */
export function spiralRingCount(sheetHeight: number): number {
  return Math.max(4, Math.floor((sheetHeight - 12) / 9));
}
