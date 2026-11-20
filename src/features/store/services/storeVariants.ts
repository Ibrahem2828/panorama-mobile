import type { StoreCurrency, StoreVariant } from '../../../api';

/** Remaining units are shown to the student only when the shelf is nearly empty. */
export const LOW_STOCK_THRESHOLD = 5;

/** The shop's own cap when a variant has no `max_per_order` of its own. */
export const DEFAULT_MAX_PER_LINE = 20;

export type VariantSelection = {
  /** Colour key (`colourKey`) or '' when the product has no colours. */
  colour: string;
  /** Size label or '' when the product has no sizes. */
  size: string;
};

export type VariantOptionState = 'available' | 'outOfStock' | 'unavailable';

export type ColourOption = {
  key: string;
  name: string;
  hex: string;
  state: VariantOptionState;
  selected: boolean;
};

export type SizeOption = {
  label: string;
  state: VariantOptionState;
  selected: boolean;
};

export function colourKey(variant: Pick<StoreVariant, 'colour_name' | 'colour_hex'>): string {
  const name = variant.colour_name.trim();
  const hex = variant.colour_hex.trim().toLowerCase();

  return name || hex ? `${name}|${hex}` : '';
}

export function hasPrice(variant: StoreVariant, currency: StoreCurrency): boolean {
  return variant.prices[currency] !== null && variant.prices[currency] !== undefined;
}

/** A variant the student can put in the cart right now in this currency. */
export function isVariantOrderable(variant: StoreVariant, currency: StoreCurrency): boolean {
  return variant.in_stock && variant.available > 0 && hasPrice(variant, currency);
}

function stateOf(variants: StoreVariant[], currency: StoreCurrency): VariantOptionState {
  if (variants.length === 0) return 'unavailable';
  if (variants.some((variant) => isVariantOrderable(variant, currency))) return 'available';
  // Every combination exists but none can be bought: either empty shelf or no price in this currency.
  return variants.some((variant) => hasPrice(variant, currency)) ? 'outOfStock' : 'unavailable';
}

export function findVariant(
  variants: StoreVariant[],
  selection: VariantSelection,
): StoreVariant | null {
  return (
    variants.find(
      (variant) =>
        colourKey(variant) === selection.colour && variant.size_label.trim() === selection.size,
    ) ?? null
  );
}

/** The variant to show first: the first one in stock (and priced), else the first one. */
export function initialSelection(
  variants: StoreVariant[],
  currency: StoreCurrency,
): VariantSelection {
  const first = variants.find((variant) => isVariantOrderable(variant, currency)) ?? variants[0];

  return first
    ? { colour: colourKey(first), size: first.size_label.trim() }
    : { colour: '', size: '' };
}

export function colourOptions(
  variants: StoreVariant[],
  selection: VariantSelection,
  currency: StoreCurrency,
): ColourOption[] {
  const seen = new Map<string, StoreVariant[]>();

  for (const variant of variants) {
    const key = colourKey(variant);
    if (!key) continue;
    seen.set(key, [...(seen.get(key) ?? []), variant]);
  }

  return [...seen.entries()].map(([key, group]) => ({
    key,
    name: group[0]!.colour_name.trim(),
    hex: group[0]!.colour_hex.trim(),
    // A colour is judged across all its sizes; with a size picked it must also fit that size.
    state: stateOf(group, currency),
    selected: key === selection.colour,
  }));
}

export function sizeOptions(
  variants: StoreVariant[],
  selection: VariantSelection,
  currency: StoreCurrency,
): SizeOption[] {
  const labels: string[] = [];

  for (const variant of variants) {
    const label = variant.size_label.trim();
    if (label && !labels.includes(label)) labels.push(label);
  }

  return labels.map((label) => {
    // Sizes are judged within the chosen colour: a size the chosen colour does not come in is unavailable.
    const group = variants.filter(
      (variant) =>
        variant.size_label.trim() === label &&
        (selection.colour === '' || colourKey(variant) === selection.colour),
    );

    return { label, state: stateOf(group, currency), selected: label === selection.size };
  });
}

/**
 * Picks a colour. When the size already chosen does not exist (or is sold out) in the new colour, the nearest valid size
 * of that colour is chosen so the student never lands on a dead combination.
 */
export function selectColour(
  variants: StoreVariant[],
  selection: VariantSelection,
  key: string,
  currency: StoreCurrency,
): VariantSelection {
  const inColour = variants.filter((variant) => colourKey(variant) === key);
  const keep = inColour.find(
    (variant) =>
      variant.size_label.trim() === selection.size && isVariantOrderable(variant, currency),
  );

  if (keep) return { colour: key, size: selection.size };

  const next = inColour.find((variant) => isVariantOrderable(variant, currency)) ?? inColour[0];

  return { colour: key, size: next ? next.size_label.trim() : selection.size };
}

export function selectSize(
  variants: StoreVariant[],
  selection: VariantSelection,
  label: string,
  currency: StoreCurrency,
): VariantSelection {
  const inSize = variants.filter((variant) => variant.size_label.trim() === label);
  const keep = inSize.find(
    (variant) => colourKey(variant) === selection.colour && isVariantOrderable(variant, currency),
  );

  if (keep) return { colour: selection.colour, size: label };

  const next = inSize.find((variant) => isVariantOrderable(variant, currency)) ?? inSize[0];

  return { colour: next ? colourKey(next) : selection.colour, size: label };
}

/** Most units one cart line may hold for this variant: the per-order cap, never more than the shelf has. */
export function lineCap(variant: Pick<StoreVariant, 'available' | 'max_per_order'>): number {
  const cap = variant.max_per_order > 0 ? variant.max_per_order : DEFAULT_MAX_PER_LINE;

  return Math.max(0, Math.min(cap, variant.available));
}

/** How many more units can be added when the cart already holds `inCart` of this variant (adding merges lines). */
export function maxAddable(
  variant: Pick<StoreVariant, 'available' | 'max_per_order'>,
  inCart = 0,
): number {
  return Math.max(0, lineCap(variant) - Math.max(0, inCart));
}

export function clampQuantity(quantity: number, max: number): number {
  if (!Number.isFinite(quantity)) return max >= 1 ? 1 : 0;

  return Math.min(Math.max(Math.trunc(quantity), max >= 1 ? 1 : 0), Math.max(max, 0));
}

/** The remaining count to show ("بقي 3"), or null while the shelf is comfortably full or empty. */
export function lowStockRemaining(variant: Pick<StoreVariant, 'available'>): number | null {
  return variant.available > 0 && variant.available <= LOW_STOCK_THRESHOLD
    ? variant.available
    : null;
}

export type AddToCartBlock = 'noVariant' | 'noPrice' | 'outOfStock' | 'limitReached' | null;

/** Why the add-to-cart button is disabled (null = enabled). */
export function addToCartBlock(
  variant: StoreVariant | null,
  currency: StoreCurrency,
  inCart: number,
): AddToCartBlock {
  if (!variant) return 'noVariant';
  if (!hasPrice(variant, currency)) return 'noPrice';
  if (!variant.in_stock || variant.available <= 0) return 'outOfStock';
  if (maxAddable(variant, inCart) <= 0) return 'limitReached';

  return null;
}
