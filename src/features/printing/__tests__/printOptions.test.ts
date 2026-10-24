import {
  buildSheetSimulation,
  parsePageRange,
  sheetLayout,
  sheetsPerCopy,
  type SimulationInput,
} from '../services/printOptions';
import {
  buildOrderBody,
  buildQuoteBody,
  createEmptyDraft,
  newCartItem,
  validateItem,
} from '../services';
import type { PrintDraft, PrintProduct } from '../types';

describe('parsePageRange', () => {
  it('reads pages and ranges in the typed order without duplicates', () => {
    expect(parsePageRange('1-5, 8', 10)).toEqual({ ok: true, pages: [1, 2, 3, 4, 5, 8] });
    expect(parsePageRange('3,1,3', 5)).toEqual({ ok: true, pages: [3, 1] });
    expect(parsePageRange('٣-٥', 6)).toEqual({ ok: true, pages: [3, 4, 5] });
    expect(parsePageRange('4،6', 6)).toEqual({ ok: true, pages: [4, 6] });
  });

  it('an empty range is every page (or nothing known yet)', () => {
    expect(parsePageRange('  ', 3)).toEqual({ ok: true, pages: [1, 2, 3] });
    expect(parsePageRange('', null)).toEqual({ ok: true, pages: [] });
  });

  it('explains what is wrong', () => {
    expect(parsePageRange('abc', 10)).toEqual({ ok: false, reason: 'syntax' });
    expect(parsePageRange('1-', 10)).toEqual({ ok: false, reason: 'syntax' });
    expect(parsePageRange('5-3', 10)).toEqual({ ok: false, reason: 'order' });
    expect(parsePageRange('0', 10)).toEqual({ ok: false, reason: 'order' });
    expect(parsePageRange('1-99', 10)).toEqual({ ok: false, reason: 'beyond' });
    expect(parsePageRange('x'.repeat(300), 10)).toEqual({ ok: false, reason: 'long' });
  });

  it('only checks the writing while the page count is unknown', () => {
    expect(parsePageRange('1-99', null)).toMatchObject({ ok: true });
  });
});

describe('sheetLayout', () => {
  it.each([
    [1, 'auto', 1, 1, false],
    [2, 'auto', 2, 1, true],
    [4, 'auto', 2, 2, false],
    [6, 'auto', 3, 2, true],
    [9, 'auto', 3, 3, false],
    [16, 'auto', 4, 4, false],
    [2, 'portrait', 1, 2, false],
    [4, 'landscape', 2, 2, true],
  ] as const)('%i per sheet, %s', (perSheet, orientation, columns, rows, landscape) => {
    expect(sheetLayout(perSheet, orientation)).toMatchObject({ columns, rows, landscape });
  });
});

describe('sheetsPerCopy (the same formula as the server)', () => {
  it.each([
    [10, 1, false, 10],
    [10, 1, true, 5],
    [11, 1, true, 6],
    [12, 4, true, 2],
    [13, 4, true, 2],
    [17, 4, true, 3],
    [1, 16, true, 1],
    [0, 4, true, 0],
  ])('%i pages, %i per sheet, double=%s -> %i', (pages, perSheet, double, expected) => {
    expect(sheetsPerCopy(pages, perSheet, double)).toBe(expected);
  });
});

const base: SimulationInput = {
  pages: 12,
  pageRange: '',
  pagesPerSheet: 4,
  orientation: 'auto',
  direction: 'ltr',
  doubleSided: true,
  duplexFlip: 'long_edge',
  copies: 3,
};

describe('buildSheetSimulation', () => {
  it('puts the first pages on the front and the next ones on the back', () => {
    const simulation = buildSheetSimulation(base);

    expect(simulation.front.cells).toEqual([1, 2, 3, 4]);
    expect(simulation.back?.cells).toEqual([5, 6, 7, 8]);
    expect(simulation.sheetsPerCopy).toBe(2);
    expect(simulation.totalSheets).toBe(6);
  });

  it('a right-to-left grid fills each row from the right', () => {
    const simulation = buildSheetSimulation({ ...base, direction: 'rtl', pagesPerSheet: 4 });

    expect(simulation.front.cells).toEqual([2, 1, 4, 3]);
  });

  it('draws only the selected pages and pads empty cells', () => {
    const simulation = buildSheetSimulation({
      ...base,
      pageRange: '3, 9',
      doubleSided: false,
      copies: 1,
    });

    expect(simulation.selectedPages).toBe(2);
    expect(simulation.front.cells).toEqual([3, 9, null, null]);
    expect(simulation.back).toBeNull();
  });

  it('draws a sample when the page count is not known', () => {
    expect(buildSheetSimulation({ ...base, pages: null }).isSample).toBe(true);
    expect(buildSheetSimulation(base).isSample).toBe(false);
  });

  it('keeps going with the whole document when the range is wrong, and says so', () => {
    const simulation = buildSheetSimulation({ ...base, pageRange: '1-99' });

    expect(simulation.rangeError).toBe('beyond');
    expect(simulation.selectedPages).toBe(12);
  });
});

const product: PrintProduct = {
  id: 7,
  name: 'دفتر تشريح',
  description: '',
  image_url: null,
  pages_count: 80,
  paper_size: 'A4',
  color_mode: 'black_white',
  sides: 'double_sided',
  binding: 'spiral',
  cover: '',
  price: '4000.00',
  currency: 'SYP',
};

describe('request bodies', () => {
  function draftWith(patch: Record<string, unknown>): PrintDraft {
    const draft = createEmptyDraft();
    const item = { ...newCartItem({ kind: 'library', id: 5, title: 'x' }), ...patch };

    return { ...draft, items: [item] };
  }

  it('sends the print-dialog options of a file', () => {
    const body = buildQuoteBody(
      draftWith({
        pagesPerSheet: 4,
        pageRange: ' 1-3 ',
        collate: false,
        cover: 'navy',
        duplexFlip: 'short_edge',
      }),
    ) as { items: Record<string, unknown>[] };

    expect(body.items[0]).toMatchObject({
      source_file: 5,
      pages_per_sheet: 4,
      page_range: '1-3',
      collate: false,
      cover: 'navy',
      duplex_flip: 'short_edge',
      orientation: 'auto',
      n_up_direction: 'ltr',
    });
  });

  it('leaves optional fields out when they are not set', () => {
    const body = buildQuoteBody(draftWith({})) as { items: Record<string, unknown>[] };

    expect(body.items[0]).not.toHaveProperty('page_range');
    expect(body.items[0]).not.toHaveProperty('cover');
  });

  it('a ready product sends only itself and the copies', () => {
    const body = buildOrderBody(draftWith({ source: { kind: 'product', product }, copies: 2 })) as {
      items: Record<string, unknown>[];
    };

    expect(body.items[0]).toEqual({ product: 7, copies: 2 });
  });

  it('validates the way a page range is written', () => {
    expect(
      validateItem({ ...newCartItem({ kind: 'library', id: 1, title: 'x' }), pageRange: 'x-y' })
        .pageRange,
    ).toBe(true);
    expect(
      validateItem({ ...newCartItem({ kind: 'library', id: 1, title: 'x' }), pageRange: '1-5' })
        .pageRange,
    ).toBeUndefined();
    expect(
      validateItem({ ...newCartItem({ kind: 'product', product }), pageRange: 'x-y' }).pageRange,
    ).toBeUndefined();
  });
});
