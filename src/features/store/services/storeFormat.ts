import type {
  StoreCart,
  StoreCartItem,
  StoreCartTotals,
  StoreCurrency,
  StoreOrdering,
  StorePriceMap,
} from '../../../api';
import { formatPrintMoney, formatRounding } from '../../printing/services/printingService';

export const STORE_CURRENCIES: readonly StoreCurrency[] = ['SYP', 'USD'];

export function isStoreCurrency(value: unknown): value is StoreCurrency {
  return value === 'SYP' || value === 'USD';
}

export const STORE_ORDERINGS: readonly StoreOrdering[] = [
  'popular',
  'newest',
  'rating',
  'price_asc',
  'price_desc',
];

/** `15000.00` as `15,000 ل.س`, `3.5` as `$3.50`; null when the shop does not sell it in this currency. */
export function formatStoreMoney(
  value: string | number | null | undefined,
  currency: StoreCurrency,
): string | null {
  return formatPrintMoney(value, currency);
}

/** The signed rounding line (`+6 ل.س`), or null when the total was not rounded. */
export function formatStoreRounding(
  value: string | number | null | undefined,
  currency: StoreCurrency,
): string | null {
  return formatRounding(value, currency);
}

export function priceIn(prices: StorePriceMap | undefined, currency: StoreCurrency) {
  return prices?.[currency] ?? null;
}

/** Average rating as one decimal (`4.5`); 0 when nobody rated. */
export function formatRatingValue(value: string | number | null | undefined): string {
  const number = Number(value);

  return Number.isFinite(number) && number > 0 ? number.toFixed(1) : '0.0';
}

export type StarFill = 'full' | 'half' | 'empty';

/** Five stars for an average: halves are rounded to the nearest 0.5. */
export function starFills(value: string | number | null | undefined): StarFill[] {
  const number = Number(value);
  const rounded = Number.isFinite(number)
    ? Math.round(Math.min(Math.max(number, 0), 5) * 2) / 2
    : 0;

  return Array.from({ length: 5 }, (_, index) => {
    if (rounded >= index + 1) return 'full';
    if (rounded >= index + 0.5) return 'half';

    return 'empty';
  });
}

/** `#RRGGBB` only; anything else gets a neutral grey so a bad value never breaks the swatch. */
export function safeHex(value: string | null | undefined, fallback = '#98A2B3'): string {
  return typeof value === 'string' && /^#[0-9a-f]{6}$/iu.test(value.trim())
    ? value.trim()
    : fallback;
}

/** Perceived brightness: tells whether a check mark on the swatch should be dark or light. */
export function isLightHex(hex: string): boolean {
  const value = safeHex(hex).slice(1);
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);

  return (r * 299 + g * 587 + b * 114) / 1000 > 150;
}

export type CartTotalsView = {
  subtotal: string;
  total: string;
  /** Signed, formatted rounding line; null when the total equals the subtotal. */
  rounding: string | null;
};

/** Totals for the chosen currency, or null when a line has no price in it (checkout is blocked then). */
export function cartTotalsFor(
  cart: Pick<StoreCart, 'totals'> | null,
  currency: StoreCurrency,
): CartTotalsView | null {
  const totals: StoreCartTotals | null | undefined = cart?.totals?.[currency];

  if (!totals) return null;

  const subtotal = formatStoreMoney(totals.subtotal, currency);
  const total = formatStoreMoney(totals.total, currency);

  if (subtotal === null || total === null) return null;

  return { subtotal, total, rounding: formatStoreRounding(totals.rounding_adjustment, currency) };
}

export function lineTotal(item: StoreCartItem, currency: StoreCurrency): string | null {
  const unit = Number(item.prices?.[currency]);

  return Number.isFinite(unit) && item.prices?.[currency] !== null
    ? formatStoreMoney(unit * item.quantity, currency)
    : null;
}

export type CartLineIssue = 'noPrice' | 'unavailable' | 'insufficient';

/** What is wrong with a cart line (null = fine): no price in the currency, gone, or fewer units than the line asks. */
export function cartLineIssue(item: StoreCartItem, currency: StoreCurrency): CartLineIssue | null {
  if (item.prices?.[currency] === null || item.prices?.[currency] === undefined) return 'noPrice';
  if (item.available <= 0) return 'unavailable';
  if (!item.orderable) return 'insufficient';

  return null;
}

export function canCheckout(cart: StoreCart | null, currency: StoreCurrency): boolean {
  if (!cart || cart.items.length === 0) return false;
  if (!cart.totals?.[currency]) return false;

  return cart.items.every((item) => cartLineIssue(item, currency) === null);
}

/** Units of one variant already in the cart (add-to-cart merges into that line). */
export function unitsInCart(cart: StoreCart | null, variantId: number): number {
  return cart?.items.find((item) => item.variant.id === variantId)?.quantity ?? 0;
}

/** A stable text for "this cart, this currency, these notes": a changed cart is a new checkout attempt. */
export function checkoutFingerprint(
  cart: StoreCart,
  currency: StoreCurrency,
  notes: string,
): { currency: StoreCurrency; notes: string; lines: [number, number][] } {
  return {
    currency,
    notes: notes.trim(),
    lines: cart.items
      .map((item): [number, number] => [item.variant.id, item.quantity])
      .sort((a, b) => a[0] - b[0]),
  };
}
