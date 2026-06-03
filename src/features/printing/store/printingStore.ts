import { create } from 'zustand';

import { useAuthStore } from '../../auth/store';
import {
  buildCreatePrintOrderRequest,
  cancelPrintOrder,
  createPrintOrder,
  hasPrintDraftValidationErrors,
  loadMyPrintOrders,
  loadPrintOrderDetail,
  toSafePrintingErrorMessage,
  validatePrintDraft,
} from '../services';
import type { Id, PrintDraft, PrintDraftValidation, PrintOrder } from '../types';

type PrintingState = {
  orders: PrintOrder[];
  selectedOrder: PrintOrder | null;
  draft: PrintDraft;
  validation: PrintDraftValidation;
  isLoadingOrders: boolean;
  isLoadingDetail: boolean;
  isRefreshing: boolean;
  isSubmitting: boolean;
  isCancelling: boolean;
  errorMessage: string | null;
  successMessage: string | null;
  lastLoadedAt: string | null;
  ordersCount: number;

  loadMyOrders: () => Promise<void>;
  refreshMyOrders: () => Promise<void>;
  loadOrderDetail: (orderId: Id) => Promise<void>;
  createOrder: () => Promise<PrintOrder | null>;
  cancelOrder: (orderId: Id) => Promise<void>;
  setDraftFile: (fileId: Id | null, fileTitle?: string | null) => void;
  setDraftCopies: (copies: number) => void;
  incrementCopies: () => void;
  decrementCopies: () => void;
  setDraftNotes: (notes: string) => void;
  validateDraft: () => boolean;
  resetDraft: () => void;
  clearError: () => void;
  clearMessages: () => void;
  setSelectedOrder: (order: PrintOrder | null) => void;
};

const DEFAULT_DRAFT: PrintDraft = {
  sourceFileId: null,
  sourceFileTitle: null,
  copies: 1,
  userNotes: '',
};

const MISSING_SESSION_MESSAGE = 'انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى.';
const CREATE_SUCCESS_MESSAGE = 'تم إرسال طلب الطباعة.';
const CANCEL_SUCCESS_MESSAGE = 'تم إلغاء طلب الطباعة.';

function getAccessToken(): string | null {
  return useAuthStore.getState().accessToken;
}

function isSameId(left: Id, right: Id): boolean {
  return String(left) === String(right);
}

function upsertOrder(orders: PrintOrder[], nextOrder: PrintOrder): PrintOrder[] {
  const existingIndex = orders.findIndex((order) => isSameId(order.id, nextOrder.id));

  if (existingIndex === -1) {
    return [nextOrder, ...orders];
  }

  return orders.map((order, index) => (index === existingIndex ? nextOrder : order));
}

function clampCopies(copies: number): number {
  if (!Number.isFinite(copies)) {
    return 1;
  }

  return Math.max(1, Math.min(99, Math.round(copies)));
}

export const usePrintingStore = create<PrintingState>((set, get) => {
  function requireToken(): string | null {
    const accessToken = getAccessToken();

    if (!accessToken) {
      set({
        errorMessage: MISSING_SESSION_MESSAGE,
        isLoadingOrders: false,
        isLoadingDetail: false,
        isRefreshing: false,
        isSubmitting: false,
        isCancelling: false,
      });
      return null;
    }

    return accessToken;
  }

  async function reloadOrders(accessToken: string) {
    const response = await loadMyPrintOrders(accessToken);

    set({
      orders: response.results,
      ordersCount: response.count,
      lastLoadedAt: new Date().toISOString(),
    });
  }

  async function reloadDetail(orderId: Id, accessToken: string) {
    const order = await loadPrintOrderDetail(orderId, accessToken);

    set((state) => ({
      selectedOrder: order,
      orders: upsertOrder(state.orders, order),
      lastLoadedAt: new Date().toISOString(),
    }));
  }

  return {
    orders: [],
    selectedOrder: null,
    draft: DEFAULT_DRAFT,
    validation: {},
    isLoadingOrders: false,
    isLoadingDetail: false,
    isRefreshing: false,
    isSubmitting: false,
    isCancelling: false,
    errorMessage: null,
    successMessage: null,
    lastLoadedAt: null,
    ordersCount: 0,

    async loadMyOrders() {
      if (get().isLoadingOrders) {
        return;
      }

      const accessToken = requireToken();

      if (!accessToken) {
        return;
      }

      set({ isLoadingOrders: true, errorMessage: null, successMessage: null });

      try {
        await reloadOrders(accessToken);
        set({ isLoadingOrders: false });
      } catch (error) {
        set({
          isLoadingOrders: false,
          errorMessage: toSafePrintingErrorMessage(error),
        });
      }
    },

    async refreshMyOrders() {
      if (get().isRefreshing) {
        return;
      }

      const accessToken = requireToken();

      if (!accessToken) {
        return;
      }

      set({ isRefreshing: true, errorMessage: null, successMessage: null });

      try {
        await reloadOrders(accessToken);
        set({ isRefreshing: false });
      } catch (error) {
        set({
          isRefreshing: false,
          errorMessage: toSafePrintingErrorMessage(error),
        });
      }
    },

    async loadOrderDetail(orderId) {
      if (get().isLoadingDetail) {
        return;
      }

      const accessToken = requireToken();

      if (!accessToken) {
        return;
      }

      set({ isLoadingDetail: true, errorMessage: null, successMessage: null });

      try {
        await reloadDetail(orderId, accessToken);
        set({ isLoadingDetail: false });
      } catch (error) {
        set({
          isLoadingDetail: false,
          errorMessage: toSafePrintingErrorMessage(error),
        });
      }
    },

    async createOrder() {
      if (get().isSubmitting) {
        return null;
      }

      const isValid = get().validateDraft();

      if (!isValid) {
        return null;
      }

      const accessToken = requireToken();

      if (!accessToken) {
        return null;
      }

      const request = buildCreatePrintOrderRequest(get().draft);

      if (!request) {
        return null;
      }

      set({ isSubmitting: true, errorMessage: null, successMessage: null });

      try {
        const order = await createPrintOrder(request, accessToken);

        set((state) => ({
          orders: upsertOrder(state.orders, order),
          selectedOrder: order,
          ordersCount: Math.max(state.ordersCount, state.orders.length + 1),
          draft: DEFAULT_DRAFT,
          validation: {},
          isSubmitting: false,
          successMessage: CREATE_SUCCESS_MESSAGE,
        }));

        await reloadOrders(accessToken);

        return order;
      } catch (error) {
        set({
          isSubmitting: false,
          errorMessage: toSafePrintingErrorMessage(error),
        });
        return null;
      }
    },

    async cancelOrder(orderId) {
      if (get().isCancelling) {
        return;
      }

      const accessToken = requireToken();

      if (!accessToken) {
        return;
      }

      set({ isCancelling: true, errorMessage: null, successMessage: null });

      try {
        await cancelPrintOrder(orderId, accessToken);
        await Promise.all([reloadOrders(accessToken), reloadDetail(orderId, accessToken)]);

        set({
          isCancelling: false,
          successMessage: CANCEL_SUCCESS_MESSAGE,
        });
      } catch (error) {
        set({
          isCancelling: false,
          errorMessage: toSafePrintingErrorMessage(error),
        });
      }
    },

    setDraftFile(fileId, fileTitle) {
      set((state) => ({
        draft: {
          ...state.draft,
          sourceFileId: fileId,
          sourceFileTitle: fileTitle ?? null,
        },
        validation: {
          ...state.validation,
          sourceFileId: undefined,
        },
      }));
    },

    setDraftCopies(copies) {
      set((state) => ({
        draft: {
          ...state.draft,
          copies: clampCopies(copies),
        },
        validation: {
          ...state.validation,
          copies: undefined,
        },
      }));
    },

    incrementCopies() {
      get().setDraftCopies(get().draft.copies + 1);
    },

    decrementCopies() {
      get().setDraftCopies(get().draft.copies - 1);
    },

    setDraftNotes(notes) {
      set((state) => ({
        draft: {
          ...state.draft,
          userNotes: notes,
        },
      }));
    },

    validateDraft() {
      const validation = validatePrintDraft(get().draft);

      set({ validation });

      return !hasPrintDraftValidationErrors(validation);
    },

    resetDraft() {
      set({ draft: DEFAULT_DRAFT, validation: {}, errorMessage: null, successMessage: null });
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
  };
});
