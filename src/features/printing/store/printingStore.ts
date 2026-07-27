import { create } from 'zustand';

import { useAuthStore } from '../../auth/store';
import { useFeedbackStore } from '../../feedback/store';
import {
  buildCreatePrintOrderRequest,
  calculatePrintQuote,
  cancelPrintOrder,
  createPrintOrder,
  hasPrintDraftValidationErrors,
  loadMyPrintOrders,
  loadPickupLocations,
  loadPrintOrderDetail,
  toSafePrintingErrorMessage,
  validatePrintDraft,
} from '../services';
import type {
  Id,
  PrintDraft,
  PrintDraftValidation,
  PrintOrder,
  PrintPickupLocation,
  PrintQuote,
} from '../types';

const DEFAULT_DRAFT: PrintDraft = {
  sourceFileId: null,
  sourceFileTitle: null,
  copies: 1,
  colorMode: 'black_white',
  paperSize: 'a4',
  sides: 'single',
  binding: 'none',
  pickupLocationId: null,
  userNotes: '',
};

type State = {
  orders: PrintOrder[];
  selectedOrder: PrintOrder | null;
  draft: PrintDraft;
  validation: PrintDraftValidation;
  quote: PrintQuote | null;
  pickupLocations: PrintPickupLocation[];
  isLoadingOrders: boolean;
  isLoadingDetail: boolean;
  isRefreshing: boolean;
  isSubmitting: boolean;
  isCancelling: boolean;
  isQuoting: boolean;
  isLoadingPickupLocations: boolean;
  errorMessage: string | null;
  successMessage: string | null;
  lastLoadedAt: string | null;
  ordersCount: number;
  loadMyOrders: () => Promise<void>;
  refreshMyOrders: () => Promise<void>;
  loadOrderDetail: (id: Id) => Promise<void>;
  loadPrintingConfiguration: () => Promise<void>;
  calculateQuote: () => Promise<PrintQuote | null>;
  createOrder: () => Promise<PrintOrder | null>;
  cancelOrder: (id: Id) => Promise<void>;
  setDraftFile: (id: Id | null, title?: string | null) => void;
  setDraftCopies: (copies: number) => void;
  incrementCopies: () => void;
  decrementCopies: () => void;
  setDraftNotes: (notes: string) => void;
  setDraftOption: <K extends keyof PrintDraft>(key: K, value: PrintDraft[K]) => void;
  validateDraft: () => boolean;
  resetDraft: () => void;
  clearError: () => void;
  clearMessages: () => void;
  setSelectedOrder: (order: PrintOrder | null) => void;
  reset: () => void;
};

function initial() {
  return {
    orders: [] as PrintOrder[],
    selectedOrder: null,
    draft: { ...DEFAULT_DRAFT },
    validation: {},
    quote: null,
    pickupLocations: [] as PrintPickupLocation[],
    isLoadingOrders: false,
    isLoadingDetail: false,
    isRefreshing: false,
    isSubmitting: false,
    isCancelling: false,
    isQuoting: false,
    isLoadingPickupLocations: false,
    errorMessage: null,
    successMessage: null,
    lastLoadedAt: null,
    ordersCount: 0,
  };
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

export const usePrintingStore = create<State>((set, get) => ({
  ...initial(),
  async loadMyOrders() {
    const authToken = token();
    if (!authToken || get().isLoadingOrders) return;
    set({ isLoadingOrders: true, errorMessage: null });
    try {
      const response = await loadMyPrintOrders(authToken);
      set({
        orders: response.results,
        ordersCount: response.count,
        isLoadingOrders: false,
        lastLoadedAt: new Date().toISOString(),
      });
    } catch (error) {
      set({ isLoadingOrders: false, errorMessage: toSafePrintingErrorMessage(error) });
    }
  },
  async refreshMyOrders() {
    if (get().isRefreshing) return;
    set({ isRefreshing: true });
    await get().loadMyOrders();
    set({ isRefreshing: false });
  },
  async loadOrderDetail(id) {
    const authToken = token();
    if (!authToken || get().isLoadingDetail) return;
    set({ isLoadingDetail: true, errorMessage: null });
    try {
      const order = await loadPrintOrderDetail(id, authToken);
      set((state) => ({
        selectedOrder: order,
        orders: upsert(state.orders, order),
        isLoadingDetail: false,
      }));
    } catch (error) {
      set({ isLoadingDetail: false, errorMessage: toSafePrintingErrorMessage(error) });
    }
  },
  async loadPrintingConfiguration() {
    const authToken = token();
    if (!authToken || get().isLoadingPickupLocations) return;
    set({ isLoadingPickupLocations: true });
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
      set({ isLoadingPickupLocations: false, errorMessage: toSafePrintingErrorMessage(error) });
    }
  },
  async calculateQuote() {
    const authToken = token();
    if (!authToken || get().isQuoting || !get().validateDraft()) return null;
    set({ isQuoting: true, errorMessage: null });
    try {
      const quote = await calculatePrintQuote(get().draft, authToken);
      set({ quote, isQuoting: false });
      void useFeedbackStore
        .getState()
        .requestPrompt({ context: 'printing', actionKey: 'printing.quote.completed' });
      return quote;
    } catch (error) {
      set({ isQuoting: false, errorMessage: toSafePrintingErrorMessage(error) });
      return null;
    }
  },
  async createOrder() {
    const authToken = token();
    if (!authToken || get().isSubmitting || !get().validateDraft()) return null;
    const request = buildCreatePrintOrderRequest(get().draft);
    if (!request) return null;
    set({ isSubmitting: true, errorMessage: null, successMessage: null });
    try {
      const order = await createPrintOrder(request, authToken);
      set((state) => ({
        orders: upsert(state.orders, order),
        selectedOrder: order,
        draft: { ...DEFAULT_DRAFT },
        quote: null,
        validation: {},
        isSubmitting: false,
        successMessage: 'تم إرسال طلب الطباعة.',
      }));
      void useFeedbackStore.getState().requestPrompt({
        context: 'printing',
        actionKey: 'printing.order.created',
        objectType: 'print_order',
        objectId: order.id,
      });
      return order;
    } catch (error) {
      set({ isSubmitting: false, errorMessage: toSafePrintingErrorMessage(error) });
      return null;
    }
  },
  async cancelOrder(id) {
    const authToken = token();
    if (!authToken || get().isCancelling) return;
    set({ isCancelling: true, errorMessage: null });
    try {
      await cancelPrintOrder(id, authToken);
      await get().loadOrderDetail(id);
      set({ isCancelling: false, successMessage: 'تم إلغاء الطلب.' });
    } catch (error) {
      set({ isCancelling: false, errorMessage: toSafePrintingErrorMessage(error) });
    }
  },
  setDraftFile(id, title) {
    set((state) => ({
      draft: { ...state.draft, sourceFileId: id, sourceFileTitle: title ?? null },
      quote: null,
      validation: { ...state.validation, sourceFileId: undefined },
    }));
  },
  setDraftCopies(copies) {
    set((state) => ({
      draft: { ...state.draft, copies: Math.max(1, Math.min(99, Math.round(copies))) },
      quote: null,
      validation: { ...state.validation, copies: undefined },
    }));
  },
  incrementCopies() {
    get().setDraftCopies(get().draft.copies + 1);
  },
  decrementCopies() {
    get().setDraftCopies(get().draft.copies - 1);
  },
  setDraftNotes(notes) {
    set((state) => ({ draft: { ...state.draft, userNotes: notes } }));
  },
  setDraftOption(key, value) {
    set((state) => ({ draft: { ...state.draft, [key]: value }, quote: null }));
  },
  validateDraft() {
    const validation = validatePrintDraft(get().draft);
    set({ validation });
    return !hasPrintDraftValidationErrors(validation);
  },
  resetDraft() {
    set({
      draft: { ...DEFAULT_DRAFT },
      validation: {},
      quote: null,
      errorMessage: null,
      successMessage: null,
    });
  },
  clearError() {
    set({ errorMessage: null });
  },
  clearMessages() {
    set({ errorMessage: null, successMessage: null });
  },
  setSelectedOrder(order) {
    set({ selectedOrder: order });
  },
  reset() {
    set(initial());
  },
}));
