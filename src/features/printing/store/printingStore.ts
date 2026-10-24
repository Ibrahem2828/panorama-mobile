import { create } from 'zustand';

import { printingService as apiPrinting, type PrintOptionsResponse } from '../../../api';
import type { PrintProduct } from '../types';

import { useAuthStore } from '../../auth/store';
import { useFeedbackStore } from '../../feedback/store';
import { useLocaleStore } from '../../../i18n';
import {
  MAX_COPIES,
  MAX_PRINT_ITEMS,
  calculatePrintQuote,
  cancelPrintOrder,
  createEmptyDraft,
  createPrintOrder,
  draftSignature,
  isUserAbort,
  loadMyPrintOrders,
  readStoredPrintCurrency,
  storePrintCurrency,
  loadPickupLocations,
  loadPrintOrderDetail,
  newCartItem,
  sourceName,
  toSafePrintingErrorMessage,
  uploadPercent,
  validateDraft,
} from '../services';
import type {
  Id,
  PrintCartItem,
  PrintCurrency,
  PrintDraft,
  PrintDraftValidation,
  PrintOrder,
  PrintPickupLocation,
  PrintQuoteState,
  PrintSource,
  PrintTransferPhase,
  PrintTransferState,
} from '../types';

type State = {
  orders: PrintOrder[];
  ordersCount: number;
  nextOrdersPage: number | null;
  statusFilter: string;
  selectedOrder: PrintOrder | null;
  draft: PrintDraft;
  validation: PrintDraftValidation | null;
  quote: PrintQuoteState | null;
  pickupLocations: PrintPickupLocation[];
  /** The shop's binding types and covers (null until loaded). */
  options: PrintOptionsResponse | null;
  products: PrintProduct[];
  isLoadingProducts: boolean;
  transfer: PrintTransferState | null;
  isLoadingOrders: boolean;
  isLoadingMoreOrders: boolean;
  isRefreshing: boolean;
  isLoadingDetail: boolean;
  isCancelling: boolean;
  isQuoting: boolean;
  isSubmitting: boolean;
  isLoadingPickupLocations: boolean;
  hasLoadedOrders: boolean;
  ordersError: string | null;
  detailError: string | null;
  draftError: string | null;
  pickupError: string | null;
  successMessage: string | null;
  lastLoadedAt: string | null;

  loadMyOrders: (status?: string) => Promise<void>;
  refreshMyOrders: () => Promise<void>;
  loadMoreOrders: () => Promise<void>;
  loadOrderDetail: (id: Id, options?: { silent?: boolean }) => Promise<void>;
  loadPrintingConfiguration: () => Promise<void>;
  loadProducts: () => Promise<void>;
  addItem: (source?: PrintSource) => void;
  removeItem: (key: string) => void;
  updateItem: (key: string, patch: Partial<Omit<PrintCartItem, 'key'>>) => void;
  prefillLibraryFile: (id: Id, title: string) => void;
  setPickupLocation: (id: Id | null) => void;
  setNotes: (notes: string) => void;
  setCurrency: (currency: PrintCurrency) => void;
  loadStoredCurrency: () => Promise<void>;
  validateDraft: () => boolean;
  calculateQuote: () => Promise<boolean>;
  createOrder: () => Promise<PrintOrder | null>;
  cancelTransfer: () => void;
  cancelOrder: (id: Id) => Promise<void>;
  resetDraft: () => void;
  clearMessages: () => void;
  setSelectedOrder: (order: PrintOrder | null) => void;
  reset: () => void;
};

function initial() {
  return {
    orders: [] as PrintOrder[],
    ordersCount: 0,
    nextOrdersPage: null as number | null,
    statusFilter: '',
    selectedOrder: null,
    draft: createEmptyDraft(),
    validation: null,
    quote: null,
    pickupLocations: [] as PrintPickupLocation[],
    options: null as PrintOptionsResponse | null,
    products: [] as PrintProduct[],
    isLoadingProducts: false,
    transfer: null,
    isLoadingOrders: false,
    isLoadingMoreOrders: false,
    isRefreshing: false,
    isLoadingDetail: false,
    isCancelling: false,
    isQuoting: false,
    isSubmitting: false,
    isLoadingPickupLocations: false,
    hasLoadedOrders: false,
    ordersError: null,
    detailError: null,
    draftError: null,
    pickupError: null,
    successMessage: null,
    lastLoadedAt: null,
  };
}

// Store actions run outside render, so the catalog is read when the action fires
// rather than captured at module load, which would pin messages to the startup locale.
function printingCatalog() {
  return useLocaleStore.getState().t.printing;
}

function token() {
  return useAuthStore.getState().accessToken;
}
function sameId(a: Id, b: Id) {
  return String(a) === String(b);
}
function upsert(items: PrintOrder[], item: PrintOrder) {
  return items.some((candidate) => sameId(candidate.id, item.id))
    ? items.map((candidate) => (sameId(candidate.id, item.id) ? item : candidate))
    : [item, ...items];
}

/** One upload at a time; this is the handle the "cancel" button aborts. */
let activeTransfer: AbortController | null = null;

export function isQuoteFresh(state: Pick<State, 'quote' | 'draft'>): boolean {
  return state.quote !== null && state.quote.signature === draftSignature(state.draft);
}

export const usePrintingStore = create<State>((set, get) => {
  function runTransfer(phase: PrintTransferPhase) {
    activeTransfer?.abort();
    const controller = new AbortController();
    let lastPercent = -1;

    activeTransfer = controller;
    set({ transfer: { phase, loaded: 0, total: 0 } });

    return {
      signal: controller.signal,
      onUploadProgress: ({ loaded, total }: { loaded: number; total: number }) => {
        const percent = uploadPercent(loaded, total);

        // Progress events are frequent; only re-render when the visible percentage moves.
        if (percent !== lastPercent) {
          lastPercent = percent;
          set({ transfer: { phase, loaded, total } });
        }
      },
      finish: () => {
        if (activeTransfer === controller) {
          activeTransfer = null;
        }
        set({ transfer: null });
      },
    };
  }

  return {
    ...initial(),

    async loadMyOrders(status) {
      const authToken = token();
      if (!authToken || get().isLoadingOrders) return;
      const filter = status ?? get().statusFilter;
      set({ isLoadingOrders: true, ordersError: null, statusFilter: filter });
      try {
        const response = await loadMyPrintOrders(authToken, {
          page: 1,
          status: filter || undefined,
        });
        set({
          orders: response.results,
          ordersCount: response.count,
          nextOrdersPage: response.next ? 2 : null,
          isLoadingOrders: false,
          hasLoadedOrders: true,
          lastLoadedAt: new Date().toISOString(),
        });
      } catch (error) {
        set({
          isLoadingOrders: false,
          ordersError: toSafePrintingErrorMessage(error, printingCatalog()),
        });
      }
    },
    async refreshMyOrders() {
      if (get().isRefreshing) return;
      set({ isRefreshing: true });
      // `loadMyOrders` ignores a call while one is running, so clear its flag first.
      set({ isLoadingOrders: false });
      await get().loadMyOrders();
      set({ isRefreshing: false });
    },
    async loadMoreOrders() {
      const authToken = token();
      const { nextOrdersPage, isLoadingMoreOrders, isLoadingOrders, statusFilter } = get();
      if (!authToken || nextOrdersPage === null || isLoadingMoreOrders || isLoadingOrders) return;
      set({ isLoadingMoreOrders: true, ordersError: null });
      try {
        const response = await loadMyPrintOrders(authToken, {
          page: nextOrdersPage,
          status: statusFilter || undefined,
        });
        set((state) => {
          const known = new Set(state.orders.map((order) => String(order.id)));
          return {
            orders: [
              ...state.orders,
              ...response.results.filter((order) => !known.has(String(order.id))),
            ],
            ordersCount: response.count,
            nextOrdersPage: response.next ? nextOrdersPage + 1 : null,
            isLoadingMoreOrders: false,
          };
        });
      } catch (error) {
        set({
          isLoadingMoreOrders: false,
          ordersError: toSafePrintingErrorMessage(error, printingCatalog()),
        });
      }
    },
    async loadOrderDetail(id, options) {
      const authToken = token();
      if (!authToken || get().isLoadingDetail) return;
      set(options?.silent ? { detailError: null } : { isLoadingDetail: true, detailError: null });
      try {
        const order = await loadPrintOrderDetail(id, authToken);
        set((state) => ({
          selectedOrder: order,
          orders: upsert(state.orders, order),
          isLoadingDetail: false,
        }));
      } catch (error) {
        set({
          isLoadingDetail: false,
          detailError: toSafePrintingErrorMessage(error, printingCatalog()),
        });
      }
    },
    async loadPrintingConfiguration() {
      const authToken = token();
      if (!authToken || get().isLoadingPickupLocations) return;
      set({ isLoadingPickupLocations: true, pickupError: null });
      // The shop's own binding types and covers: without them the built-in choices are shown and the server still prices them.
      void apiPrinting
        .getPrintOptions(authToken)
        .then((options) => set({ options }))
        .catch(() => undefined);
      try {
        const locations = await loadPickupLocations(authToken);
        const defaultPickupLocation = locations[0];
        set((state) => ({
          pickupLocations: locations,
          isLoadingPickupLocations: false,
          draft:
            state.draft.pickupLocationId == null && defaultPickupLocation
              ? { ...state.draft, pickupLocationId: defaultPickupLocation.id }
              : state.draft,
        }));
      } catch (error) {
        set({
          isLoadingPickupLocations: false,
          pickupError: toSafePrintingErrorMessage(error, printingCatalog()),
        });
      }
    },

    async loadProducts() {
      const authToken = token();
      if (!authToken || get().isLoadingProducts) return;
      set({ isLoadingProducts: true });
      try {
        const response: unknown = await apiPrinting.listPrintProducts(authToken);
        const list = Array.isArray(response)
          ? response
          : Array.isArray((response as { results?: unknown })?.results)
            ? (response as { results: unknown[] }).results
            : [];
        set({ products: list as PrintProduct[], isLoadingProducts: false });
      } catch {
        set({ isLoadingProducts: false });
      }
    },

    addItem(source = null) {
      set((state) =>
        state.draft.items.length >= MAX_PRINT_ITEMS
          ? state
          : { draft: { ...state.draft, items: [...state.draft.items, newCartItem(source)] } },
      );
    },
    removeItem(key) {
      set((state) =>
        state.draft.items.length <= 1
          ? { draft: { ...state.draft, items: [newCartItem()] } }
          : { draft: { ...state.draft, items: state.draft.items.filter((i) => i.key !== key) } },
      );
    },
    updateItem(key, patch) {
      const normalized =
        patch.copies === undefined
          ? patch
          : { ...patch, copies: Math.max(1, Math.min(MAX_COPIES, Math.round(patch.copies))) };
      set((state) => ({
        draft: {
          ...state.draft,
          items: state.draft.items.map((item) =>
            item.key === key ? { ...item, ...normalized } : item,
          ),
        },
        draftError: null,
      }));
    },
    prefillLibraryFile(id, title) {
      set((state) => {
        const already = state.draft.items.some(
          (item) => item.source?.kind === 'library' && sameId(item.source.id, id),
        );
        if (already) return state;
        const source: PrintSource = { kind: 'library', id, title };
        const emptyIndex = state.draft.items.findIndex((item) => item.source === null);
        const items =
          emptyIndex >= 0
            ? state.draft.items.map((item, index) =>
                index === emptyIndex ? { ...item, source } : item,
              )
            : [...state.draft.items, newCartItem(source)].slice(0, MAX_PRINT_ITEMS);
        return { draft: { ...state.draft, items } };
      });
    },
    setPickupLocation(id) {
      set((state) => ({ draft: { ...state.draft, pickupLocationId: id } }));
    },
    setNotes(notes) {
      set((state) => ({ draft: { ...state.draft, userNotes: notes } }));
    },
    setCurrency(currency) {
      // A different currency changes the draft signature, so any earlier quote becomes stale.
      set((state) => ({ draft: { ...state.draft, currency }, draftError: null }));
      void storePrintCurrency(currency);
    },
    async loadStoredCurrency() {
      const stored = await readStoredPrintCurrency();
      if (stored) {
        set((state) =>
          state.draft.currency === stored ? state : { draft: { ...state.draft, currency: stored } },
        );
      }
    },
    validateDraft() {
      const validation = validateDraft(get().draft);
      set({ validation });
      return validation.valid;
    },

    async calculateQuote() {
      const authToken = token();
      if (!authToken || get().isQuoting || get().isSubmitting) return false;
      if (!get().validateDraft()) {
        if (get().validation?.uploadsTooLarge) {
          set({ draftError: printingCatalog().errors.uploadsTooLarge });
        }
        return false;
      }
      const draft = get().draft;
      const transfer = runTransfer('quote');
      set({ isQuoting: true, draftError: null });
      try {
        const value = await calculatePrintQuote(draft, authToken, transfer);
        if (value.items.length !== draft.items.length) {
          set({
            isQuoting: false,
            quote: null,
            draftError: printingCatalog().errors.quoteMismatch,
          });
          return false;
        }
        set({
          quote: {
            value,
            signature: draftSignature(draft),
            names: draft.items.map((item) => sourceName(item.source) ?? ''),
          },
          isQuoting: false,
        });
        void useFeedbackStore
          .getState()
          .requestPrompt({ context: 'printing', actionKey: 'printing.quote.completed' });
        return true;
      } catch (error) {
        set({
          isQuoting: false,
          draftError: isUserAbort(error, transfer.signal)
            ? null
            : toSafePrintingErrorMessage(error, printingCatalog()),
        });
        return false;
      } finally {
        transfer.finish();
      }
    },

    async createOrder() {
      const authToken = token();
      const state = get();
      if (!authToken || state.isSubmitting || state.isQuoting) return null;
      if (!state.validateDraft()) return null;
      if (!isQuoteFresh(get())) {
        set({ draftError: printingCatalog().errors.quoteStale });
        return null;
      }
      const draft = get().draft;
      const transfer = runTransfer('order');
      set({ isSubmitting: true, draftError: null, successMessage: null });
      try {
        const order = await createPrintOrder(draft, authToken, transfer);
        set((current) => ({
          orders: upsert(current.orders, order),
          ordersCount: current.ordersCount + 1,
          selectedOrder: order,
          // The draft and quote stay until the caller leaves the form (see `resetDraft`), so the
          // summary screen never flashes an empty state while it navigates away.
          isSubmitting: false,
          successMessage: printingCatalog().create.submitSuccess,
        }));
        void useFeedbackStore.getState().requestPrompt({
          context: 'printing',
          actionKey: 'printing.order.created',
          objectType: 'print_order',
          objectId: order.id,
        });
        return order;
      } catch (error) {
        set({
          isSubmitting: false,
          draftError: isUserAbort(error, transfer.signal)
            ? null
            : toSafePrintingErrorMessage(error, printingCatalog()),
        });
        return null;
      } finally {
        transfer.finish();
      }
    },
    cancelTransfer() {
      activeTransfer?.abort();
    },
    async cancelOrder(id) {
      const authToken = token();
      if (!authToken || get().isCancelling) return;
      set({ isCancelling: true, detailError: null });
      try {
        await cancelPrintOrder(id, authToken);
        set({ isLoadingDetail: false });
        await get().loadOrderDetail(id);
        set({ isCancelling: false, successMessage: printingCatalog().details.cancelSuccess });
      } catch (error) {
        set({
          isCancelling: false,
          detailError: toSafePrintingErrorMessage(error, printingCatalog()),
        });
      }
    },
    resetDraft() {
      set({
        draft: {
          ...createEmptyDraft(get().draft.currency),
          pickupLocationId: get().draft.pickupLocationId,
        },
        validation: null,
        quote: null,
        draftError: null,
        successMessage: null,
      });
    },
    clearMessages() {
      set({ draftError: null, detailError: null, ordersError: null, successMessage: null });
    },
    setSelectedOrder(order) {
      set({ selectedOrder: order });
    },
    reset() {
      activeTransfer?.abort();
      activeTransfer = null;
      set(initial());
    },
  };
});
