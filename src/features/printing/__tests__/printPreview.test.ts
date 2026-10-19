import { MAX_VISIBLE_COPIES, buildPrintPreview, spiralRingCount } from '../services/printPreview';

const base = {
  paperSize: 'A4',
  colorMode: 'black_white',
  sides: 'one_sided',
  binding: 'none',
  copies: 1,
} as const;

describe('buildPrintPreview', () => {
  it('keeps the true proportions between paper sizes and the A-series shape', () => {
    const a5 = buildPrintPreview({ ...base, paperSize: 'A5' });
    const a4 = buildPrintPreview(base);
    const a3 = buildPrintPreview({ ...base, paperSize: 'A3' });

    expect(a5.sheetWidth).toBeLessThan(a4.sheetWidth);
    expect(a4.sheetWidth).toBeLessThan(a3.sheetWidth);
    expect(a4.sheetHeight / a4.sheetWidth).toBeCloseTo(Math.SQRT2, 1);
  });

  it('stacks one sheet per extra copy up to the cap', () => {
    expect(buildPrintPreview(base).stackDepth).toBe(0);
    expect(buildPrintPreview({ ...base, copies: 3 }).stackDepth).toBe(2);
    expect(buildPrintPreview({ ...base, copies: 50 }).stackDepth).toBe(MAX_VISIBLE_COPIES - 1);
    expect(buildPrintPreview({ ...base, copies: 50 }).copies).toBe(50);
  });

  it('treats a bad copy count as one copy', () => {
    expect(buildPrintPreview({ ...base, copies: 0 }).copies).toBe(1);
    expect(buildPrintPreview({ ...base, copies: Number.NaN }).copies).toBe(1);
  });

  it('maps colour, sides and the booklet bindings', () => {
    const model = buildPrintPreview({
      ...base,
      colorMode: 'color',
      sides: 'double_sided',
      binding: 'spiral',
    });

    expect(model).toMatchObject({ colored: true, doubleSided: true, isBooklet: true });
    expect(buildPrintPreview({ ...base, binding: 'thermal' }).isBooklet).toBe(true);
    expect(buildPrintPreview({ ...base, binding: 'staple' }).isBooklet).toBe(false);
  });

  it('draws more coil loops on a taller sheet, never fewer than four', () => {
    expect(spiralRingCount(40)).toBe(4);
    expect(spiralRingCount(160)).toBeGreaterThan(spiralRingCount(80));
  });
});
