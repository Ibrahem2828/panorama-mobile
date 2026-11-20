jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { extra: { apiBaseUrl: 'https://api.example.com' } } },
}));

import { ApiClientError } from '../../../api';
import { ar } from '../../../i18n/locales/ar';
import { en } from '../../../i18n/locales/en';
import type { StoreCart, StoreCartItem, StoreOrder, StoreVariant } from '../../../api';
import {
  addToCartBlock,
  canCheckout,
  canSubmitReview,
  cartLineIssue,
  cartTotalsFor,
  checkoutFingerprint,
  clampQuantity,
  colourOptions,
  findVariant,
  formatRatingValue,
  formatStoreMoney,
  initialSelection,
  isLightHex,
  lineTotal,
  lowStockRemaining,
  maxAddable,
  parseStoreError,
  reviewUiState,
  safeHex,
  selectColour,
  selectSize,
  sizeOptions,
  starFills,
  storeOrderIdFromPush,
  storeProgress,
  storeStatusPresentation,
  storeTimeline,
  canCancelStoreOrder,
  isStoreOrderActive,
  isStoreOrderPush,
  unitsInCart,
} from '../services';

function variant(overrides: Partial<StoreVariant> & { id: number }): StoreVariant {
  return {
    sku: `SKU-${overrides.id}`,
    colour_name: 'أزرق',
    colour_hex: '#0033cc',
    size_label: 'M',
    prices: { SYP: '15000.00', USD: '1.50' },
    available: 10,
    in_stock: true,
    max_per_order: 20,
    image_id: null,
    ...overrides,
  };
}

const BLUE_S = variant({ id: 1, size_label: 'S' });
const BLUE_M = variant({ id: 2, size_label: 'M', available: 0, in_stock: false });
const RED_S = variant({ id: 3, colour_name: 'أحمر', colour_hex: '#cc0000', size_label: 'S' });
const RED_L = variant({
  id: 4,
  colour_name: 'أحمر',
  colour_hex: '#cc0000',
  size_label: 'L',
  prices: { SYP: '16000.00', USD: null },
});
const VARIANTS = [BLUE_S, BLUE_M, RED_S, RED_L];

describe('variant selection', () => {
  it('starts on the first variant that can be bought', () => {
    expect(initialSelection([BLUE_M, RED_S], 'SYP')).toEqual({
      colour: 'أحمر|#cc0000',
      size: 'S',
    });
    expect(initialSelection([], 'SYP')).toEqual({ colour: '', size: '' });
  });

  it('lists each colour once and marks colours that are sold out entirely', () => {
    const soldOutRed = [BLUE_S, { ...RED_S, available: 0, in_stock: false }];
    const options = colourOptions(soldOutRed, { colour: 'أزرق|#0033cc', size: 'S' }, 'SYP');

    expect(options.map((option) => [option.name, option.state, option.selected])).toEqual([
      ['أزرق', 'available', true],
      ['أحمر', 'outOfStock', false],
    ]);
  });

  it('judges sizes inside the chosen colour and disables dead combinations', () => {
    const sizes = sizeOptions(VARIANTS, { colour: 'أزرق|#0033cc', size: 'S' }, 'SYP');

    expect(sizes.map((size) => [size.label, size.state])).toEqual([
      ['S', 'available'],
      ['M', 'outOfStock'],
      // Blue does not come in L at all.
      ['L', 'unavailable'],
    ]);
  });

  it('a size priced only in the other currency is unavailable, not sold out', () => {
    const sizes = sizeOptions(VARIANTS, { colour: 'أحمر|#cc0000', size: 'S' }, 'USD');

    expect(sizes.find((size) => size.label === 'L')?.state).toBe('unavailable');
    expect(sizes.find((size) => size.label === 'S')?.state).toBe('available');
  });

  it('keeps the size when the new colour has it, else moves to a size that exists', () => {
    expect(
      selectColour(VARIANTS, { colour: 'أزرق|#0033cc', size: 'S' }, 'أحمر|#cc0000', 'SYP'),
    ).toEqual({ colour: 'أحمر|#cc0000', size: 'S' });
    expect(
      selectColour(VARIANTS, { colour: 'أحمر|#cc0000', size: 'L' }, 'أزرق|#0033cc', 'SYP'),
    ).toEqual({ colour: 'أزرق|#0033cc', size: 'S' });
  });

  it('picking a size only available in another colour switches the colour with it', () => {
    expect(selectSize(VARIANTS, { colour: 'أزرق|#0033cc', size: 'S' }, 'L', 'SYP')).toEqual({
      colour: 'أحمر|#cc0000',
      size: 'L',
    });
  });

  it('finds the exact variant for a selection', () => {
    expect(findVariant(VARIANTS, { colour: 'أحمر|#cc0000', size: 'L' })?.id).toBe(4);
    expect(findVariant(VARIANTS, { colour: 'أزرق|#0033cc', size: 'L' })).toBeNull();
  });

  it('a product without colours or sizes still selects its single variant', () => {
    const plain = variant({ id: 9, colour_name: '', colour_hex: '', size_label: '' });
    const selection = initialSelection([plain], 'SYP');

    expect(selection).toEqual({ colour: '', size: '' });
    expect(findVariant([plain], selection)?.id).toBe(9);
    expect(colourOptions([plain], selection, 'SYP')).toEqual([]);
    expect(sizeOptions([plain], selection, 'SYP')).toEqual([]);
  });
});

describe('quantity limits', () => {
  it('caps a line at the per-order limit and at what is on the shelf', () => {
    expect(maxAddable(variant({ id: 1, available: 50, max_per_order: 20 }))).toBe(20);
    expect(maxAddable(variant({ id: 1, available: 3, max_per_order: 20 }))).toBe(3);
    expect(maxAddable(variant({ id: 1, available: 50, max_per_order: 5 }))).toBe(5);
    expect(maxAddable(variant({ id: 1, available: 50, max_per_order: 0 }))).toBe(20);
  });

  it('subtracts what the cart already holds because adding merges into the line', () => {
    const v = variant({ id: 1, available: 8, max_per_order: 6 });

    expect(maxAddable(v, 4)).toBe(2);
    expect(maxAddable(v, 6)).toBe(0);
    expect(maxAddable(v, 99)).toBe(0);
  });

  it('clamps the stepper between 1 and the maximum', () => {
    expect(clampQuantity(0, 5)).toBe(1);
    expect(clampQuantity(9, 5)).toBe(5);
    expect(clampQuantity(Number.NaN, 5)).toBe(1);
    expect(clampQuantity(3, 0)).toBe(0);
  });

  it('shows the remaining count only when the shelf is nearly empty', () => {
    expect(lowStockRemaining({ available: 3 })).toBe(3);
    expect(lowStockRemaining({ available: 5 })).toBe(5);
    expect(lowStockRemaining({ available: 6 })).toBeNull();
    expect(lowStockRemaining({ available: 0 })).toBeNull();
  });

  it('explains why add to cart is disabled', () => {
    expect(addToCartBlock(null, 'SYP', 0)).toBe('noVariant');
    expect(addToCartBlock(RED_L, 'USD', 0)).toBe('noPrice');
    expect(addToCartBlock(BLUE_M, 'SYP', 0)).toBe('outOfStock');
    expect(addToCartBlock(variant({ id: 1, available: 4, max_per_order: 4 }), 'SYP', 4)).toBe(
      'limitReached',
    );
    expect(addToCartBlock(BLUE_S, 'SYP', 0)).toBeNull();
  });
});

function cartItem(overrides: Partial<StoreCartItem> & { id: number }): StoreCartItem {
  return {
    variant: {
      id: overrides.id,
      sku: 'S',
      colour_name: 'أزرق',
      colour_hex: '#0033cc',
      size_label: 'M',
    },
    product: { id: 1, name: 'قلم', brand: 'ماركة' },
    quantity: 2,
    prices: { SYP: '1500.00', USD: '0.15' },
    orderable: true,
    available: 10,
    thumb_url: null,
    ...overrides,
  };
}

function cart(items: StoreCartItem[], totals?: StoreCart['totals']): StoreCart {
  return {
    items,
    items_count: items.reduce((sum, item) => sum + item.quantity, 0),
    max_lines: 30,
    totals: totals ?? {
      SYP: { subtotal: '3003.00', rounding_adjustment: '-3.00', total: '3000.00' },
      USD: { subtotal: '0.30', rounding_adjustment: '0.00', total: '0.30' },
    },
    payment: 'cash_on_pickup',
  };
}

describe('price formatting per currency', () => {
  it('SYP has no decimals noise, USD always has cents', () => {
    expect(formatStoreMoney('15000.00', 'SYP')).toBe('15,000 ل.س');
    expect(formatStoreMoney('1500.50', 'SYP')).toBe('1,500.5 ل.س');
    expect(formatStoreMoney('3.5', 'USD')).toBe('$3.50');
    expect(formatStoreMoney(null, 'USD')).toBeNull();
  });

  it('formats ratings and star fills', () => {
    expect(formatRatingValue('4.50')).toBe('4.5');
    expect(formatRatingValue(0)).toBe('0.0');
    expect(starFills('3.5')).toEqual(['full', 'full', 'full', 'half', 'empty']);
    expect(starFills(4.8)).toEqual(['full', 'full', 'full', 'full', 'full']);
    expect(starFills(null)).toEqual(['empty', 'empty', 'empty', 'empty', 'empty']);
  });

  it('keeps swatch colours safe', () => {
    expect(safeHex('#A1B2C3')).toBe('#A1B2C3');
    expect(safeHex('red')).toBe('#98A2B3');
    expect(isLightHex('#ffffff')).toBe(true);
    expect(isLightHex('#002b7f')).toBe(false);
  });
});

describe('cart totals and rounding display', () => {
  it('shows the rounding line only when the total was rounded', () => {
    const syp = cartTotalsFor(cart([cartItem({ id: 1 })]), 'SYP');

    expect(syp).toEqual({ subtotal: '3,003 ل.س', total: '3,000 ل.س', rounding: '-3 ل.س' });
    expect(cartTotalsFor(cart([cartItem({ id: 1 })]), 'USD')?.rounding).toBeNull();
  });

  it('a currency with no total (a line has no price) has no totals view and blocks checkout', () => {
    const noUsd = cart([cartItem({ id: 1, prices: { SYP: '1500.00', USD: null } })], {
      SYP: { subtotal: '3000.00', rounding_adjustment: '0.00', total: '3000.00' },
      USD: null,
    });

    expect(cartTotalsFor(noUsd, 'USD')).toBeNull();
    expect(canCheckout(noUsd, 'USD')).toBe(false);
    expect(canCheckout(noUsd, 'SYP')).toBe(true);
  });

  it('line total multiplies the unit price and keeps cents', () => {
    expect(lineTotal(cartItem({ id: 1, quantity: 3 }), 'SYP')).toBe('4,500 ل.س');
    expect(lineTotal(cartItem({ id: 1, quantity: 3 }), 'USD')).toBe('$0.45');
    expect(lineTotal(cartItem({ id: 1, prices: { SYP: null, USD: '1' } }), 'SYP')).toBeNull();
  });

  it('flags the lines that stop checkout', () => {
    expect(cartLineIssue(cartItem({ id: 1 }), 'SYP')).toBeNull();
    expect(cartLineIssue(cartItem({ id: 1, prices: { SYP: null, USD: '1' } }), 'SYP')).toBe(
      'noPrice',
    );
    expect(cartLineIssue(cartItem({ id: 1, available: 0, orderable: false }), 'SYP')).toBe(
      'unavailable',
    );
    expect(cartLineIssue(cartItem({ id: 1, available: 1, orderable: false }), 'SYP')).toBe(
      'insufficient',
    );
    expect(canCheckout(cart([cartItem({ id: 1, orderable: false, available: 1 })]), 'SYP')).toBe(
      false,
    );
    expect(canCheckout(cart([]), 'SYP')).toBe(false);
    expect(canCheckout(null, 'SYP')).toBe(false);
  });

  it('knows how many units of a variant are already in the cart', () => {
    const c = cart([cartItem({ id: 7, quantity: 4 })]);

    expect(unitsInCart(c, 7)).toBe(4);
    expect(unitsInCart(c, 8)).toBe(0);
    expect(unitsInCart(null, 7)).toBe(0);
  });
});

function envelopeError(status: number, code: string, errors: Record<string, unknown> = {}) {
  return new ApiClientError({
    code: status === 409 ? 'CONFLICT' : status === 429 ? 'RATE_LIMITED' : 'VALIDATION_ERROR',
    status,
    message: 'x',
    errorCode: code,
    raw: { success: false, code, message: 'x', errors },
  });
}

describe('checkout error mapping', () => {
  it('INSUFFICIENT_STOCK names the line and what is left, and asks for a cart refresh', () => {
    expect(
      parseStoreError(envelopeError(409, 'INSUFFICIENT_STOCK', { variant: 4, available: 2 })),
    ).toEqual({
      kind: 'insufficientStock',
      variantId: 4,
      available: 2,
      maxPerOrder: null,
      refreshCart: true,
    });
  });

  it('QUANTITY_LIMIT carries the cap', () => {
    const info = parseStoreError(
      envelopeError(400, 'QUANTITY_LIMIT', { variant: [5], max_per_order: '6' }),
    );

    expect(info).toMatchObject({
      kind: 'quantityLimit',
      variantId: 5,
      maxPerOrder: 6,
      refreshCart: true,
    });
  });

  it.each([
    ['VARIANT_UNAVAILABLE', 'variantUnavailable', true],
    ['PRICE_UNAVAILABLE', 'priceUnavailable', true],
    ['CART_EMPTY', 'cartEmpty', true],
    ['CART_FULL', 'cartFull', false],
    ['TOO_MANY_OPEN_ORDERS', 'tooManyOpenOrders', false],
    ['ORDER_NOT_CANCELLABLE', 'orderNotCancellable', false],
    ['REVIEW_NOT_ELIGIBLE', 'reviewNotEligible', false],
    ['REVIEW_EXISTS', 'reviewExists', false],
    ['REVIEW_EDIT_LIMIT', 'reviewEditLimit', false],
  ])('%s maps to %s (refresh cart: %s)', (code, kind, refresh) => {
    const info = parseStoreError(envelopeError(code.startsWith('TOO') ? 409 : 400, code));

    expect(info.kind).toBe(kind);
    expect(info.refreshCart).toBe(refresh);
  });

  it('falls back by transport failure, rate limit and unknown codes', () => {
    expect(parseStoreError(new ApiClientError({ code: 'NETWORK_ERROR', message: 'x' })).kind).toBe(
      'network',
    );
    expect(
      parseStoreError(
        new ApiClientError({ code: 'NETWORK_ERROR', message: 'x', details: { offline: true } }),
      ).kind,
    ).toBe('offline');
    expect(parseStoreError(envelopeError(429, 'RATE_LIMITED')).kind).toBe('rateLimited');
    expect(parseStoreError(new Error('boom')).kind).toBe('generic');
  });

  it('every error kind has a message in Arabic and English, none of it empty', () => {
    for (const catalog of [ar.store.errors, en.store.errors]) {
      expect(catalog.insufficientStock(2)).toContain('2');
      expect(catalog.insufficientStock(null).length).toBeGreaterThan(5);
      expect(catalog.quantityLimit(6)).toContain('6');
      for (const key of [
        'variantUnavailable',
        'priceUnavailable',
        'cartEmpty',
        'cartFull',
        'tooManyOpenOrders',
        'generic',
      ] as const) {
        expect(catalog[key].length).toBeGreaterThan(5);
      }
    }
  });
});

describe('checkout idempotency', () => {
  it('the same cart, currency and note give the same fingerprint, whatever the line order', () => {
    const a = cart([cartItem({ id: 1 }), cartItem({ id: 2, quantity: 1 })]);
    const b = cart([cartItem({ id: 2, quantity: 1 }), cartItem({ id: 1 })]);

    expect(checkoutFingerprint(a, 'SYP', ' hi ')).toEqual(checkoutFingerprint(b, 'SYP', 'hi'));
  });

  it('a changed cart, currency or note is a new attempt', () => {
    const base = checkoutFingerprint(cart([cartItem({ id: 1 })]), 'SYP', '');

    expect(checkoutFingerprint(cart([cartItem({ id: 1, quantity: 3 })]), 'SYP', '')).not.toEqual(
      base,
    );
    expect(checkoutFingerprint(cart([cartItem({ id: 1 })]), 'USD', '')).not.toEqual(base);
    expect(checkoutFingerprint(cart([cartItem({ id: 1 })]), 'SYP', 'x')).not.toEqual(base);
  });
});

function review(overrides: Partial<{ rating: number; text: string; edited: boolean }> = {}) {
  return {
    id: 1,
    rating: 4,
    text: 'جيد',
    author: 'سمير',
    edited: false,
    created_at: '2026-11-01T10:00:00Z',
    updated_at: '2026-11-01T10:00:00Z',
    ...overrides,
  };
}

describe('review eligibility UI state', () => {
  it('locks the form until the student collected an order', () => {
    expect(reviewUiState({ canReview: false, mine: null, mineLoaded: true })).toBe('locked');
  });

  it('waits for the own review before offering the form', () => {
    expect(reviewUiState({ canReview: true, mine: null, mineLoaded: false })).toBe('loading');
    expect(reviewUiState({ canReview: true, mine: null, mineLoaded: true })).toBe('write');
  });

  it('offers one edit, then it is done', () => {
    expect(reviewUiState({ canReview: true, mine: review(), mineLoaded: true })).toBe('edit');
    expect(
      reviewUiState({ canReview: true, mine: review({ edited: true }), mineLoaded: true }),
    ).toBe('done');
  });

  it('an existing review stays visible even when can_review is false', () => {
    expect(reviewUiState({ canReview: false, mine: review(), mineLoaded: true })).toBe('edit');
  });

  it('validates the form and requires a change when editing', () => {
    expect(canSubmitReview({ rating: 0, text: '' })).toBe(false);
    expect(canSubmitReview({ rating: 5, text: '' })).toBe(true);
    expect(canSubmitReview({ rating: 5, text: 'x'.repeat(1001) })).toBe(false);
    expect(canSubmitReview({ rating: 4, text: 'جيد', original: review() })).toBe(false);
    expect(canSubmitReview({ rating: 5, text: 'جيد', original: review() })).toBe(true);
  });
});

function order(overrides: Partial<StoreOrder> = {}): StoreOrder {
  return {
    id: 5,
    code: 'ST-000005',
    status: 'pending',
    currency: 'SYP',
    total: '3000.00',
    items_count: 2,
    created_at: '2026-11-01T10:00:00Z',
    subtotal: '3003.00',
    rounding_adjustment: '-3.00',
    notes: '',
    cancel_reason: '',
    cancelled_by_customer: false,
    confirmed_at: null,
    ready_at: null,
    picked_up_at: null,
    cancelled_at: null,
    can_cancel: true,
    payment: 'cash_on_pickup',
    items: [],
    history: [],
    ...overrides,
  };
}

describe('order status labels and timeline', () => {
  it('has a label and a hint for every status, in both languages', () => {
    for (const catalog of [ar.store.orders.status, en.store.orders.status]) {
      for (const status of [
        'pending',
        'confirmed',
        'ready_for_pickup',
        'picked_up',
        'cancelled',
      ] as const) {
        const presentation = storeStatusPresentation(status, catalog, '?');

        expect(presentation.label.length).toBeGreaterThan(1);
        expect(presentation.hint.length).toBeGreaterThan(5);
      }
    }
    expect(storeStatusPresentation('ready_for_pickup', ar.store.orders.status, '?').variant).toBe(
      'brand',
    );
    expect(storeStatusPresentation('weird', ar.store.orders.status, '?').label).toBe('weird');
  });

  it('only a pending order that the server allows can be cancelled', () => {
    expect(canCancelStoreOrder(order())).toBe(true);
    expect(canCancelStoreOrder(order({ status: 'confirmed', can_cancel: false }))).toBe(false);
    expect(canCancelStoreOrder(order({ can_cancel: false }))).toBe(false);
    expect(isStoreOrderActive('ready_for_pickup')).toBe(true);
    expect(isStoreOrderActive('picked_up')).toBe(false);
  });

  it('lists the history newest first and falls back to the creation', () => {
    const history = [
      {
        old_status: '',
        new_status: 'pending' as const,
        note: '',
        created_at: '2026-11-01T10:00:00Z',
      },
      {
        old_status: 'pending',
        new_status: 'confirmed' as const,
        note: '',
        created_at: '2026-11-01T12:00:00Z',
      },
    ];

    expect(storeTimeline(order({ history })).map((entry) => entry.new_status)).toEqual([
      'confirmed',
      'pending',
    ]);
    expect(storeTimeline(order()).map((entry) => entry.new_status)).toEqual(['pending']);
  });

  it('progress marks steps done, current and todo; a cancelled order shows how far it got', () => {
    expect(storeProgress(order({ status: 'confirmed' })).map((step) => step.state)).toEqual([
      'done',
      'current',
      'todo',
      'todo',
    ]);
    expect(storeProgress(order({ status: 'picked_up' })).map((step) => step.state)).toEqual([
      'done',
      'done',
      'done',
      'done',
    ]);
    expect(
      storeProgress(
        order({
          status: 'cancelled',
          history: [
            { old_status: '', new_status: 'pending', note: '', created_at: 'a' },
            { old_status: 'pending', new_status: 'cancelled', note: '', created_at: 'b' },
          ],
        }),
      ).map((step) => step.state),
    ).toEqual(['done', 'todo', 'todo', 'todo']);
  });

  it('recognises a store status push and reads its order id safely', () => {
    const data = { kind: 'store_order_status', store_order_id: 12, status: 'ready_for_pickup' };

    expect(isStoreOrderPush(data)).toBe(true);
    expect(isStoreOrderPush({ kind: 'chat' })).toBe(false);
    expect(storeOrderIdFromPush(data)).toBe('12');
    expect(storeOrderIdFromPush({ store_order_id: '../x' })).toBeNull();
    expect(storeOrderIdFromPush(null)).toBeNull();
  });
});
