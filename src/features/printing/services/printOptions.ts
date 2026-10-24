/**
 * The print-dialog options (pages per sheet, two-sided, orientation, page range) and the pure logic shared by the price summary,
 * the on-screen simulation and the order body. It mirrors `apps/printing/options.py` on the server, which stays authoritative:
 * the price always comes from the server quote, this file only draws and validates what the customer is choosing.
 */

export const PAGES_PER_SHEET_VALUES = [1, 2, 4, 6, 9, 16] as const;
export type PagesPerSheet = (typeof PAGES_PER_SHEET_VALUES)[number];

export type PrintOrientation = 'auto' | 'portrait' | 'landscape';
export type DuplexFlip = 'long_edge' | 'short_edge';
export type NUpDirection = 'ltr' | 'rtl';

export const ORIENTATIONS: readonly PrintOrientation[] = ['auto', 'portrait', 'landscape'];
export const DUPLEX_FLIPS: readonly DuplexFlip[] = ['long_edge', 'short_edge'];
export const N_UP_DIRECTIONS: readonly NUpDirection[] = ['ltr', 'rtl'];

/** Longest page range the server accepts. */
export const MAX_PAGE_RANGE_LENGTH = 255;

export type SheetLayout = {
  pagesPerSheet: PagesPerSheet;
  columns: number;
  rows: number;
  landscape: boolean;
  direction: NUpDirection;
};

/** Columns x rows on a portrait sheet for each pages-per-sheet value. */
const PORTRAIT_GRID: Record<PagesPerSheet, readonly [number, number]> = {
  1: [1, 1],
  2: [1, 2],
  4: [2, 2],
  6: [2, 3],
  9: [3, 3],
  16: [4, 4],
};
/** Two and six pages per sheet look best on a sheet turned sideways when the orientation is left on automatic. */
const AUTO_LANDSCAPE = new Set<PagesPerSheet>([2, 6]);

export function sheetLayout(
  pagesPerSheet: PagesPerSheet,
  orientation: PrintOrientation = 'auto',
  direction: NUpDirection = 'ltr',
): SheetLayout {
  const [portraitColumns, portraitRows] = PORTRAIT_GRID[pagesPerSheet];
  const landscape =
    orientation === 'landscape' || (orientation === 'auto' && AUTO_LANDSCAPE.has(pagesPerSheet));
  const columns = landscape ? Math.max(portraitColumns, portraitRows) : portraitColumns;
  const rows = landscape ? Math.min(portraitColumns, portraitRows) : portraitRows;

  return pagesPerSheet === 1
    ? { pagesPerSheet, columns: 1, rows: 1, landscape, direction }
    : { pagesPerSheet, columns, rows, landscape, direction };
}

/** Digits of any script count (Arabic-Indic digits are fine), exactly like the server. */
function toNumber(text: string): number {
  const western = text.replace(/[٠-٩]/gu, (digit) => String(digit.charCodeAt(0) - 0x0660));

  return Number(western);
}

export type PageRangeResult =
  | { ok: true; pages: number[] }
  | { ok: false; reason: 'syntax' | 'order' | 'beyond' | 'long' };

/**
 * `"1-5, 8"` → the 1-based pages to print (typed order, no duplicates). An empty text is every page. When the document's page count
 * is not known yet (`total` null) only the syntax is checked and the pages are capped to the numbers typed.
 */
export function parsePageRange(text: string, total: number | null): PageRangeResult {
  const cleaned = text.trim();

  if (!cleaned) {
    return { ok: true, pages: total ? Array.from({ length: total }, (_, index) => index + 1) : [] };
  }

  if (cleaned.length > MAX_PAGE_RANGE_LENGTH) {
    return { ok: false, reason: 'long' };
  }

  const pages: number[] = [];
  const seen = new Set<number>();

  for (const part of cleaned.replace(/،/gu, ',').replace(/;/gu, ',').split(',')) {
    if (!part.trim()) {
      continue;
    }

    const match = /^\s*([0-9٠-٩]+)\s*(?:[-–—]\s*([0-9٠-٩]+))?\s*$/u.exec(part);

    if (!match) {
      return { ok: false, reason: 'syntax' };
    }

    const first = toNumber(match[1] ?? '');
    const last = match[2] ? toNumber(match[2]) : first;

    if (first < 1 || last < first) {
      return { ok: false, reason: 'order' };
    }

    if (total !== null && last > total) {
      return { ok: false, reason: 'beyond' };
    }

    if (last - first > 20000) {
      return { ok: false, reason: 'long' };
    }

    for (let page = first; page <= last; page += 1) {
      if (!seen.has(page)) {
        seen.add(page);
        pages.push(page);
      }
    }
  }

  return pages.length > 0 ? { ok: true, pages } : { ok: false, reason: 'syntax' };
}

/** Sheets of paper for ONE copy: the faces needed, halved when both faces are used, rounded up. */
export function sheetsPerCopy(
  selectedPages: number,
  pagesPerSheet: number,
  doubleSided: boolean,
): number {
  if (selectedPages <= 0) {
    return 0;
  }

  const faces = Math.max(Math.ceil(selectedPages / pagesPerSheet), 1);

  return doubleSided ? Math.ceil(faces / 2) : faces;
}

export type SimulationInput = {
  /** Pages of the document when known; otherwise a sample document is drawn. */
  pages: number | null;
  pageRange: string;
  pagesPerSheet: PagesPerSheet;
  orientation: PrintOrientation;
  direction: NUpDirection;
  doubleSided: boolean;
  duplexFlip: DuplexFlip;
  copies: number;
};

export type SimulationFace = {
  /** Page number in each grid cell, row by row (null = an empty cell). */
  cells: (number | null)[];
};

export type SheetSimulation = {
  layout: SheetLayout;
  /** The first sheet of one copy: its front and (when two-sided) back faces. */
  front: SimulationFace;
  back: SimulationFace | null;
  selectedPages: number;
  sheetsPerCopy: number;
  totalSheets: number;
  copies: number;
  doubleSided: boolean;
  /** The edge the sheet turns on, drawn as the fold line between the faces. */
  flipEdge: DuplexFlip;
  /** True when no real page count was known and a sample was drawn. */
  isSample: boolean;
  rangeError: 'syntax' | 'order' | 'beyond' | 'long' | null;
};

/** Cells of one face: consecutive pages, rows from the top; a right-to-left grid fills each row from the right. */
function faceCells(pages: number[], layout: SheetLayout): SimulationFace {
  const cells: (number | null)[] = Array.from({ length: layout.columns * layout.rows }, () => null);

  pages.slice(0, cells.length).forEach((page, index) => {
    const row = Math.floor(index / layout.columns);
    const column = index % layout.columns;
    const target = layout.direction === 'rtl' ? layout.columns - 1 - column : column;

    cells[row * layout.columns + target] = page;
  });

  return { cells };
}

const SAMPLE_PAGES = 12;

export function buildSheetSimulation(input: SimulationInput): SheetSimulation {
  const layout = sheetLayout(input.pagesPerSheet, input.orientation, input.direction);
  const isSample = input.pages === null || input.pages < 1;
  const total = isSample ? SAMPLE_PAGES : (input.pages as number);
  const parsed = parsePageRange(input.pageRange, total);
  const selected =
    parsed.ok && parsed.pages.length > 0
      ? parsed.pages
      : Array.from({ length: total }, (_, i) => i + 1);
  const copies = Math.max(1, Math.floor(Number.isFinite(input.copies) ? input.copies : 1));
  const perSheet = layout.pagesPerSheet;
  const frontPages = selected.slice(0, perSheet);
  const backPages = input.doubleSided ? selected.slice(perSheet, perSheet * 2) : [];
  const perCopy = sheetsPerCopy(selected.length, perSheet, input.doubleSided);

  return {
    layout,
    front: faceCells(frontPages, layout),
    back: input.doubleSided ? faceCells(backPages, layout) : null,
    selectedPages: selected.length,
    sheetsPerCopy: perCopy,
    totalSheets: perCopy * copies,
    copies,
    doubleSided: input.doubleSided,
    flipEdge: input.duplexFlip,
    isSample,
    rangeError: parsed.ok ? null : parsed.reason,
  };
}
