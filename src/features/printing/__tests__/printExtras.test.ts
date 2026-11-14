import type { PrintExtraSection } from '../../../api/types';
import {
  buildOrderBody,
  buildQuoteBody,
  createEmptyDraft,
  draftSignature,
  newCartItem,
} from '../services/printDraft';
import {
  buildExtraGroups,
  buildExtrasPayload,
  describeExtras,
  extrasSignature,
  formatExtraPrice,
  orderExtras,
  pruneExtras,
  selectExtra,
  selectExtraInGroup,
} from '../services/printExtras';
import type { PrintDraft } from '../types';

const opt = (
  code: string,
  price: string,
  price_unit: 'per_copy' | 'per_50_sheets' | 'per_sheet' = 'per_copy',
) => ({ code, name: `اسم ${code}`, description: '', price, price_unit, color_hex: '' });

const extras: PrintExtraSection[] = [
  { section: 'final_delivery', label: 'التسليم النهائي', options: [opt('boxed', '500')] },
  { section: 'back_transparency_optional', label: 'x', options: [opt('b2', '10')] },
  { section: 'front_transparency_optional', label: 'x', options: [opt('f2', '10')] },
  {
    section: 'front_transparency_required',
    label: 'x',
    options: [opt('f1', '20', 'per_50_sheets')],
  },
  { section: 'front_cover', label: 'نوع الغلاف الأمامي', options: [opt('card', '1500')] },
  { section: 'back_cover', label: 'نوع الغلاف الخلفي', options: [] },
  { section: 'design_paper', label: 'خدمات أخرى', options: [opt('d', '5', 'per_sheet')] },
];

const units = { per_copy: 'للنسخة', per_50_sheets: 'لكل 50 ورقة', per_sheet: 'للورقة' };

describe('extras groups', () => {
  it('orders the lists like the shop form, merges transparency, skips empty ones and design_paper', () => {
    const groups = buildExtraGroups(extras);

    expect(groups.map((g) => g.key)).toEqual([
      'front_cover',
      'front_transparency',
      'back_transparency',
      'final_delivery',
    ]);
    expect(groups[1]?.sections.map((s) => s.section)).toEqual([
      'front_transparency_required',
      'front_transparency_optional',
    ]);
  });

  it('is empty for an older server without extras', () => {
    expect(buildExtraGroups(undefined)).toEqual([]);
  });
});

describe('extras selection', () => {
  it('drops empty selections from the payload', () => {
    expect(buildExtrasPayload({ front_cover: 'card', back_cover: '', finishing: '  ' })).toEqual({
      front_cover: 'card',
    });
    expect(buildExtrasPayload({})).toBeUndefined();
    expect(buildExtrasPayload(null)).toBeUndefined();
  });

  it('selects, clears and keeps the other sections', () => {
    const one = selectExtra({ front_cover: 'card' }, 'finishing', 'x');

    expect(one).toEqual({ front_cover: 'card', finishing: 'x' });
    expect(selectExtra(one, 'front_cover', '')).toEqual({ finishing: 'x' });
  });

  it('allows one choice per transparency list', () => {
    const group = buildExtraGroups(extras)[1]!;
    const first = selectExtraInGroup({}, group, 'front_transparency_required', 'f1');
    const second = selectExtraInGroup(first, group, 'front_transparency_optional', 'f2');

    expect(second).toEqual({ front_transparency_optional: 'f2' });
  });

  it('prunes choices the server no longer offers', () => {
    expect(pruneExtras({ front_cover: 'card', finishing: 'gone', zzz: 'a' }, extras)).toEqual({
      front_cover: 'card',
    });
  });

  it('signature ignores order and empty values', () => {
    expect(extrasSignature({ b: '2', a: '1', c: '' })).toBe(extrasSignature({ a: '1', b: '2' }));
    expect(extrasSignature({})).not.toBe(extrasSignature({ a: '1' }));
  });
});

describe('extras request bodies', () => {
  function draftWith(selection: Record<string, string>, upload = false): PrintDraft {
    const source = upload
      ? ({
          kind: 'upload',
          file: { uri: 'file:///a.pdf', name: 'a.pdf', type: 'application/pdf', size: 10 },
        } as const)
      : ({ kind: 'library', id: 5, title: 'x' } as const);

    return { ...createEmptyDraft(), items: [{ ...newCartItem(source), extras: selection }] };
  }

  it('sends extras as an object in JSON and leaves it out when empty', () => {
    const body = buildQuoteBody(draftWith({ front_cover: 'card', finishing: '' })) as {
      items: Record<string, unknown>[];
    };

    expect(body.items[0]?.extras).toEqual({ front_cover: 'card' });
    expect(
      (buildQuoteBody(draftWith({})) as { items: Record<string, unknown>[] }).items[0],
    ).not.toHaveProperty('extras');
  });

  it('sends extras as a JSON string in multipart', () => {
    const form = buildOrderBody(draftWith({ final_delivery: 'boxed' }, true)) as FormData;

    expect(form.get('items[0]extras')).toBe('{"final_delivery":"boxed"}');
  });

  it('a different choice makes an earlier quote stale', () => {
    expect(draftSignature(draftWith({ front_cover: 'card' }))).not.toBe(
      draftSignature(draftWith({})),
    );
  });
});

describe('extras price lines', () => {
  it('writes the price with its unit', () => {
    expect(formatExtraPrice(opt('x', '1500'), '1,500 ل.س', units, 'مجاني')).toBe(
      '1,500 ل.س للنسخة',
    );
    expect(formatExtraPrice(opt('x', '20', 'per_50_sheets'), '$20', units, 'مجاني')).toMatch(
      /^\$20.*لكل 50 ورقة$/u,
    );
    expect(formatExtraPrice(opt('x', '3', 'per_sheet'), '$3', units, 'مجاني')).toMatch(/للورقة$/u);
  });

  it('says free for a zero price', () => {
    expect(formatExtraPrice(opt('x', '0.00'), '0 ل.س', units, 'بدون رسوم')).toBe('بدون رسوم');
  });
});

describe('receipt lines', () => {
  it('sorts quoted extras in form order', () => {
    expect(
      orderExtras([
        { section: 'final_delivery' },
        { section: 'front_cover' },
        { section: 'zzz' },
      ]).map((e) => e.section),
    ).toEqual(['front_cover', 'final_delivery', 'zzz']);
  });

  it('names a stored choice from the shop list, or falls back to the code', () => {
    expect(describeExtras({ final_delivery: 'boxed', front_cover: 'gone' }, extras)).toEqual([
      { section: 'front_cover', label: 'نوع الغلاف الأمامي', name: 'gone' },
      { section: 'final_delivery', label: 'التسليم النهائي', name: 'اسم boxed' },
    ]);
    expect(describeExtras(null, extras)).toEqual([]);
    expect(describeExtras({ finishing: 'a' }, undefined)[0]?.label).toBe('الإخراج الفني');
  });
});
