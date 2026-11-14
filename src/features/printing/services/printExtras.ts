/**
 * The shop's paper options by section (cover paper, transparency, finishing, delivery). The server lists what is offered
 * (`GET /printing/options/` → `extras`) and prices the choice; this file only groups the sections the way the shop's own
 * form does, builds the `extras` payload and writes the price lines.
 */
import type { PrintChosenExtra } from '../types';
import type { PrintExtraOption, PrintExtraPriceUnit, PrintExtraSection } from '../../../api/types';

export type PrintExtraSelection = Record<string, string>;

/**
 * What the customer sees, in the order of the shop's legacy form. The required / not-required transparency sections of a
 * side are one choice list with two headings. `design_paper` ("other services: paper type") has no place in the app's
 * flow yet, so it is left out on purpose (the payload and the receipt still handle any section the server knows).
 */
export const PRINT_EXTRA_GROUPS = [
  { key: 'front_cover', sections: ['front_cover'] },
  { key: 'back_cover', sections: ['back_cover'] },
  {
    key: 'front_transparency',
    sections: ['front_transparency_required', 'front_transparency_optional'],
  },
  {
    key: 'back_transparency',
    sections: ['back_transparency_required', 'back_transparency_optional'],
  },
  { key: 'finishing', sections: ['finishing'] },
  { key: 'final_delivery', sections: ['final_delivery'] },
] as const;

export type PrintExtraGroupKey = (typeof PRINT_EXTRA_GROUPS)[number]['key'];

export type PrintExtraGroup = {
  key: PrintExtraGroupKey;
  /** The sections that make up this list, in order, each with the options the shop offers (empty ones dropped). */
  sections: PrintExtraSection[];
};

/** The groups to draw: only those with at least one offered option, in the shop's order. */
export function buildExtraGroups(
  extras: readonly PrintExtraSection[] | undefined,
): PrintExtraGroup[] {
  const bySection = new Map((extras ?? []).map((entry) => [entry.section, entry]));

  return PRINT_EXTRA_GROUPS.flatMap((group) => {
    const sections = group.sections
      .map((name) => bySection.get(name))
      .filter((entry): entry is PrintExtraSection => Boolean(entry && entry.options.length > 0));

    return sections.length > 0 ? [{ key: group.key, sections }] : [];
  });
}

/** Sets (or, for an empty code, clears) the choice of one section without touching the others. */
export function selectExtra(
  selection: PrintExtraSelection,
  section: string,
  code: string,
): PrintExtraSelection {
  const next = { ...selection };

  if (code) {
    next[section] = code;
  } else {
    delete next[section];
  }

  return next;
}

/** A transparency list holds two sections: choosing in one clears the other (one choice per list). */
export function selectExtraInGroup(
  selection: PrintExtraSelection,
  group: PrintExtraGroup,
  section: string,
  code: string,
): PrintExtraSelection {
  let next = selection;

  for (const entry of group.sections) {
    next = selectExtra(next, entry.section, entry.section === section ? code : '');
  }

  return next;
}

/** The `extras` field of an order item: empty selections are dropped; undefined when nothing is chosen. */
export function buildExtrasPayload(
  selection: PrintExtraSelection | null | undefined,
): PrintExtraSelection | undefined {
  const entries = Object.entries(selection ?? {}).filter(
    ([section, code]) => Boolean(section) && typeof code === 'string' && code.trim() !== '',
  );

  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

/** Stable text for the quote signature (sorted so the order a customer tapped in does not matter). */
export function extrasSignature(selection: PrintExtraSelection | null | undefined): string {
  return JSON.stringify(
    Object.entries(buildExtrasPayload(selection) ?? {}).sort(([a], [b]) => a.localeCompare(b)),
  );
}

/** Drops choices the server no longer offers (a shop changed its list, or the currency changed). */
export function pruneExtras(
  selection: PrintExtraSelection,
  extras: readonly PrintExtraSection[] | undefined,
): PrintExtraSelection {
  if (!extras) {
    return selection;
  }

  const offered = new Map(
    extras.map((entry) => [entry.section, new Set(entry.options.map((o) => o.code))]),
  );

  return Object.fromEntries(
    Object.entries(selection).filter(([section, code]) => offered.get(section)?.has(code)),
  );
}

export type PrintExtraUnitLabels = Record<PrintExtraPriceUnit, string>;

/** "15,000 ل.س للنسخة" from the already formatted price; the free label when the option costs nothing. */
export function formatExtraPrice(
  option: Pick<PrintExtraOption, 'price' | 'price_unit'>,
  money: string | null,
  units: PrintExtraUnitLabels,
  freeLabel: string,
): string {
  if (Number(option.price) === 0 || !money) {
    return freeLabel;
  }

  return `${money} ${units[option.price_unit] ?? ''}`.trim();
}

/** Name and price line of every chosen option of a quote, in the order of the shop's form. */
export function orderExtras<T extends { section: string }>(
  chosen: readonly T[] | null | undefined,
): T[] {
  const rank = new Map<string, number>(
    PRINT_EXTRA_GROUPS.flatMap((group) => group.sections).map((name, index) => [name, index]),
  );

  return [...(chosen ?? [])].sort(
    (a, b) => (rank.get(a.section) ?? 99) - (rank.get(b.section) ?? 99),
  );
}

/**
 * Receipt lines for an order item: the section name and the option's name. Prefers what the quote priced; for a stored
 * order only `{section: code}` is known, so the name comes from the shop's list (the code when it is gone).
 */
export function describeExtras(
  chosen: Record<string, string> | null | undefined,
  extras: readonly PrintExtraSection[] | undefined,
): { section: string; label: string; name: string }[] {
  const sections = new Map((extras ?? []).map((entry) => [entry.section, entry]));
  const lines = Object.entries(chosen ?? {})
    .filter(([, code]) => Boolean(code))
    .map(([section, code]) => {
      const entry = sections.get(section);

      return {
        section,
        label: entry?.label ?? SECTION_LABEL_FALLBACK[section] ?? section,
        name: entry?.options.find((option) => option.code === code)?.name ?? code,
      };
    });

  return orderExtras(lines);
}

const SECTION_LABEL_FALLBACK: Record<string, string> = {
  front_cover: 'نوع الغلاف الأمامي',
  back_cover: 'نوع الغلاف الخلفي',
  front_transparency_required: 'الشفافية الأمامية - مطلوبة',
  front_transparency_optional: 'الشفافية الأمامية - غير مطلوبة',
  back_transparency_required: 'الشفافية الخلفية - مطلوبة',
  back_transparency_optional: 'الشفافية الخلفية - غير مطلوبة',
  final_delivery: 'التسليم النهائي',
  finishing: 'الإخراج الفني',
  design_paper: 'خدمات أخرى: نوع الورق',
};

export type { PrintChosenExtra };
