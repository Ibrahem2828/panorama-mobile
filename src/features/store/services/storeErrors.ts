import { normalizeApiError } from '../../../api';
import { classifyApiError, type ErrorKind } from '../../../api/errorKind';

export type StoreErrorKind =
  | 'insufficientStock'
  | 'quantityLimit'
  | 'variantUnavailable'
  | 'priceUnavailable'
  | 'cartEmpty'
  | 'cartFull'
  | 'cartItemMissing'
  | 'tooManyOpenOrders'
  | 'orderNotCancellable'
  | 'reviewNotEligible'
  | 'reviewExists'
  | 'reviewEditLimit'
  | 'rateLimited'
  | 'offline'
  | 'network'
  | 'unauthorized'
  | 'notFound'
  | 'generic';

export type StoreErrorInfo = {
  kind: StoreErrorKind;
  /** The cart line / variant the server blames, when it names one. */
  variantId: number | null;
  /** Units left on the shelf (INSUFFICIENT_STOCK). */
  available: number | null;
  /** The per-order cap (QUANTITY_LIMIT). */
  maxPerOrder: number | null;
  /** The cart changed under the student: reload it and highlight the line. */
  refreshCart: boolean;
};

const BY_CODE: Record<string, StoreErrorKind> = {
  INSUFFICIENT_STOCK: 'insufficientStock',
  QUANTITY_LIMIT: 'quantityLimit',
  VARIANT_UNAVAILABLE: 'variantUnavailable',
  PRICE_UNAVAILABLE: 'priceUnavailable',
  CART_EMPTY: 'cartEmpty',
  CART_FULL: 'cartFull',
  CART_ITEM_NOT_FOUND: 'cartItemMissing',
  TOO_MANY_OPEN_ORDERS: 'tooManyOpenOrders',
  ORDER_NOT_CANCELLABLE: 'orderNotCancellable',
  REVIEW_NOT_ELIGIBLE: 'reviewNotEligible',
  REVIEW_EXISTS: 'reviewExists',
  REVIEW_EDIT_LIMIT: 'reviewEditLimit',
  RATE_LIMITED: 'rateLimited',
};

const REFRESH_KINDS: readonly StoreErrorKind[] = [
  'insufficientStock',
  'quantityLimit',
  'variantUnavailable',
  'priceUnavailable',
  'cartItemMissing',
  'cartEmpty',
];

function numberOrNull(value: unknown): number | null {
  const raw = Array.isArray(value) ? value[0] : value;
  const number = typeof raw === 'string' && raw.trim() === '' ? NaN : Number(raw);

  return Number.isFinite(number) ? number : null;
}

function errorsBlock(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === 'object' && 'errors' in raw) {
    const block = (raw as { errors?: unknown }).errors;

    return block && typeof block === 'object' ? (block as Record<string, unknown>) : {};
  }

  return {};
}

/** Reads the machine code (and its numbers) the store API puts in the error envelope. */
export function parseStoreError(error: unknown): StoreErrorInfo {
  const normalized = normalizeApiError(error);
  const block = errorsBlock(normalized.raw);
  let kind: StoreErrorKind | undefined = normalized.errorCode
    ? BY_CODE[normalized.errorCode]
    : undefined;

  if (!kind) {
    if (normalized.code === 'RATE_LIMITED') kind = 'rateLimited';
    else if (normalized.code === 'UNAUTHORIZED') kind = 'unauthorized';
    else if (normalized.code === 'NETWORK_ERROR' || normalized.code === 'TIMEOUT') {
      kind = (normalized.details as { offline?: boolean } | undefined)?.offline
        ? 'offline'
        : 'network';
    } else if (normalized.code === 'NOT_FOUND') kind = 'notFound';
    else kind = 'generic';
  }

  return {
    kind,
    variantId: numberOrNull(block.variant),
    available: numberOrNull(block.available),
    maxPerOrder: numberOrNull(block.max_per_order),
    refreshCart: REFRESH_KINDS.includes(kind),
  };
}

/** The illustrated error state for a failed read. */
export function storeErrorKind(error: unknown, deviceOnline: boolean): ErrorKind {
  return classifyApiError(error, { deviceOnline });
}
