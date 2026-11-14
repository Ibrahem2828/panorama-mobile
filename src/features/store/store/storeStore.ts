import { create } from 'zustand';

import {
  resetIdempotencyKeys,
  runIdempotentAction,
  storeService,
  type StoreCart,
  type StoreCurrency,
  type StoreOrder,
  type StoreOrderSummary,
} from '../../../api';
import { useAuthStore } from '../../auth/store';
import {
  readStoredPrintCurrency,
  storePrintCurrency,
} from '../../printing/services/printCurrencyStorage';
import { checkoutFingerprint, parseStoreError, type StoreErrorInfo } from '../services';

export type StoreActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; info: StoreErrorInfo };

const CHECKOUT_SCOPE = 'store-checkout';

type State = {
  currency: StoreCurrency;
  currencyLoaded: boolean;
  cart: StoreCart | null;
  isLoadingCart: boolean;
  cartError: unknown;
  /** Cart lines (variant ids) a failed action pointed at: the cart screen highlights them. */
  highlightedVariants: number[];
  /** The line currently being changed (item id), so its stepper can show progress. */
  busyItemId: number | null;
  isPlacingOrder: boolean;
  lastOrder: StoreOrder | null;

  orders: StoreOrderSummary[];
  ordersCount: number;
  nextOrdersPage: number | null;
  ordersStatus: string;
  hasLoadedOrders: boolean;
  isLoadingOrders: boolean;
  isLoadingMoreOrders: boolean;
  ordersError: unknown;
  /** Bumped when a status push arrives or the app returns to the foreground: open screens refetch. */
  ordersVersion: number;
  orderDetails: Record<string, StoreOrder>;

  loadCurrency: () => Promise<void>;
  setCurrency: (currency: StoreCurrency) => void;
  loadCart: (options?: { silent?: boolean }) => Promise<void>;
  addToCart: (variantId: number, quantity: number) => Promise<StoreActionResult<StoreCart>>;
  setQuantity: (itemId: number, quantity: number) => Promise<StoreActionResult<StoreCart>>;
  removeItem: (itemId: number) => Promise<StoreActionResult<StoreCart>>;
  clearHighlights: () => void;
  placeOrder: (notes: string) => Promise<StoreActionResult<StoreOrder>>;
  clearLastOrder: () => void;

  loadOrders: (options?: { status?: string; silent?: boolean }) => Promise<void>;
  loadMoreOrders: () => Promise<void>;
  loadOrder: (orderId: string | number, options?: { silent?: boolean }) => Promise<boolean>;
  cancelOrder: (
    orderId: string | number,
    reason?: string,
  ) => Promise<StoreActionResult<StoreOrder>>;
  bumpOrders: () => void;
  reset: () => void;
};

function token(): string | null {
  return useAuthStore.getState().accessToken;
}

const NO_SESSION: StoreErrorInfo = {
  kind: 'unauthorized',
  variantId: null,
  available: null,
  maxPerOrder: null,
  refreshCart: false,
};

function initial() {
  return {
    currency: 'SYP' as StoreCurrency,
    currencyLoaded: false,
    cart: null as StoreCart | null,
    isLoadingCart: false,
    cartError: null as unknown,
    highlightedVariants: [] as number[],
    busyItemId: null as number | null,
    isPlacingOrder: false,
    lastOrder: null as StoreOrder | null,
    orders: [] as StoreOrderSummary[],
    ordersCount: 0,
    nextOrdersPage: null as number | null,
    ordersStatus: '',
    hasLoadedOrders: false,
    isLoadingOrders: false,
    isLoadingMoreOrders: false,
    ordersError: null as unknown,
    ordersVersion: 0,
    orderDetails: {} as Record<string, StoreOrder>,
  };
}

export const useStoreStore = create<State>((set, get) => ({
  ...initial(),

  async loadCurrency() {
    if (get().currencyLoaded) return;
    const stored = await readStoredPrintCurrency();
    set({ currency: stored ?? 'SYP', currencyLoaded: true });
  },

  setCurrency(currency) {
    set({ currency, currencyLoaded: true });
    void storePrintCurrency(currency);
  },

  async loadCart(options) {
    const authToken = token();
    if (!authToken) return;
    if (!options?.silent) set({ isLoadingCart: true });
    try {
      const cart = await storeService.getCart(authToken);
      set({ cart, isLoadingCart: false, cartError: null });
    } catch (error) {
      // A silent refresh (badge, focus) must not replace a good cart with an error screen.
      set({ isLoadingCart: false, cartError: options?.silent && get().cart ? null : error });
    }
  },

  async addToCart(variantId, quantity) {
    const authToken = token();
    if (!authToken) return { ok: false, info: NO_SESSION };
    try {
      const cart = await storeService.addCartItem(variantId, quantity, authToken);
      set({ cart, cartError: null, highlightedVariants: [] });
      return { ok: true, data: cart };
    } catch (error) {
      const info = parseStoreError(error);
      if (info.refreshCart) void get().loadCart({ silent: true });
      return { ok: false, info };
    }
  },

  async setQuantity(itemId, quantity) {
    const authToken = token();
    if (!authToken) return { ok: false, info: NO_SESSION };
    set({ busyItemId: itemId });
    try {
      const cart = await storeService.setCartItemQuantity(itemId, quantity, authToken);
      set({ cart, busyItemId: null, highlightedVariants: [] });
      return { ok: true, data: cart };
    } catch (error) {
      const info = parseStoreError(error);
      set({
        busyItemId: null,
        highlightedVariants: info.variantId !== null ? [info.variantId] : [],
      });
      if (info.refreshCart) await get().loadCart({ silent: true });
      return { ok: false, info };
    }
  },

  async removeItem(itemId) {
    const authToken = token();
    if (!authToken) return { ok: false, info: NO_SESSION };
    set({ busyItemId: itemId });
    try {
      const cart = await storeService.removeCartItem(itemId, authToken);
      set({ cart, busyItemId: null, highlightedVariants: [] });
      return { ok: true, data: cart };
    } catch (error) {
      const info = parseStoreError(error);
      set({ busyItemId: null });
      if (info.refreshCart) await get().loadCart({ silent: true });
      return { ok: false, info };
    }
  },

  clearHighlights() {
    set({ highlightedVariants: [] });
  },

  async placeOrder(notes) {
    const authToken = token();
    const { cart, currency, isPlacingOrder } = get();
    if (!authToken || !cart) return { ok: false, info: NO_SESSION };
    if (isPlacingOrder) return { ok: false, info: { ...NO_SESSION, kind: 'generic' } };
    set({ isPlacingOrder: true });
    try {
      // One key per attempt: a retry of the same cart, currency and note re-sends it, so the order is never doubled.
      const order = await runIdempotentAction(
        CHECKOUT_SCOPE,
        checkoutFingerprint(cart, currency, notes),
        (key) =>
          storeService.checkout(
            { currency, ...(notes.trim() ? { notes: notes.trim() } : {}) },
            authToken,
            key,
          ),
      );
      set({
        isPlacingOrder: false,
        lastOrder: order,
        cart: { ...cart, items: [], items_count: 0, totals: { SYP: null, USD: null } },
        highlightedVariants: [],
        orderDetails: { ...get().orderDetails, [String(order.id)]: order },
        ordersVersion: get().ordersVersion + 1,
      });
      void get().loadCart({ silent: true });
      return { ok: true, data: order };
    } catch (error) {
      const info = parseStoreError(error);
      set({
        isPlacingOrder: false,
        highlightedVariants: info.variantId !== null ? [info.variantId] : [],
      });
      if (info.refreshCart) await get().loadCart({ silent: true });
      return { ok: false, info };
    }
  },

  clearLastOrder() {
    set({ lastOrder: null });
  },

  async loadOrders(options) {
    const authToken = token();
    if (!authToken) return;
    const status = options?.status ?? get().ordersStatus;
    if (!options?.silent) set({ isLoadingOrders: true });
    set({ ordersStatus: status, ordersError: null });
    try {
      const page = await storeService.listOrders(1, authToken, status || undefined);
      // The filter may have changed while this was in flight.
      if (get().ordersStatus !== status) return;
      set({
        orders: page.results,
        ordersCount: page.count,
        nextOrdersPage: page.next ? 2 : null,
        isLoadingOrders: false,
        hasLoadedOrders: true,
      });
    } catch (error) {
      set({
        isLoadingOrders: false,
        ordersError: options?.silent && get().hasLoadedOrders ? null : error,
      });
    }
  },

  async loadMoreOrders() {
    const authToken = token();
    const { nextOrdersPage, isLoadingMoreOrders, isLoadingOrders, ordersStatus } = get();
    if (!authToken || nextOrdersPage === null || isLoadingMoreOrders || isLoadingOrders) return;
    set({ isLoadingMoreOrders: true, ordersError: null });
    try {
      const page = await storeService.listOrders(
        nextOrdersPage,
        authToken,
        ordersStatus || undefined,
      );
      const known = new Set(get().orders.map((order) => order.id));
      set({
        orders: [...get().orders, ...page.results.filter((order) => !known.has(order.id))],
        ordersCount: page.count,
        nextOrdersPage: page.next ? nextOrdersPage + 1 : null,
        isLoadingMoreOrders: false,
      });
    } catch (error) {
      set({ isLoadingMoreOrders: false, ordersError: error });
    }
  },

  async loadOrder(orderId, options) {
    const authToken = token();
    if (!authToken) return false;
    try {
      const order = await storeService.getOrder(orderId, authToken);
      set({ orderDetails: { ...get().orderDetails, [String(orderId)]: order } });
      return true;
    } catch (error) {
      if (!options?.silent) set({ ordersError: error });
      return false;
    }
  },

  async cancelOrder(orderId, reason) {
    const authToken = token();
    if (!authToken) return { ok: false, info: NO_SESSION };
    try {
      const order = await storeService.cancelOrder(orderId, reason?.trim() || undefined, authToken);
      set({
        orderDetails: { ...get().orderDetails, [String(orderId)]: order },
        ordersVersion: get().ordersVersion + 1,
      });
      return { ok: true, data: order };
    } catch (error) {
      const info = parseStoreError(error);
      // Someone moved the order meanwhile (it is no longer pending): show its real state.
      if (info.kind === 'orderNotCancellable') void get().loadOrder(orderId, { silent: true });
      return { ok: false, info };
    }
  },

  bumpOrders() {
    set({ ordersVersion: get().ordersVersion + 1 });
  },

  reset() {
    resetIdempotencyKeys();
    set({ ...initial(), currencyLoaded: get().currencyLoaded, currency: get().currency });
  },
}));

// Another account on the same phone must never see this account's cart or orders.
let lastUserId: string | number | null | undefined;
useAuthStore.subscribe((state) => {
  const userId = state.status === 'authenticated' ? (state.user?.id ?? null) : null;

  if (lastUserId !== undefined && userId !== lastUserId) {
    useStoreStore.getState().reset();
  }
  lastUserId = userId;
});
