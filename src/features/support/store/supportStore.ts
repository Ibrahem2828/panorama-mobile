import { create } from 'zustand';

import { useAuthStore } from '../../auth/store';
import {
  addSupportTicketMessage,
  canReplyToSupportTicket,
  createSupportTicket,
  loadMySupportTickets,
  loadSupportTicketDetail,
  toSafeSupportErrorMessage,
} from '../services';
import type {
  Id,
  SupportTicket,
  SupportTicketCategory,
  SupportTicketDraft,
  SupportTicketDraftValidation,
} from '../types';

type SupportState = {
  tickets: SupportTicket[];
  selectedTicket: SupportTicket | null;
  createDraft: SupportTicketDraft;
  replyMessage: string;
  validation: SupportTicketDraftValidation;
  isLoadingTickets: boolean;
  isLoadingDetail: boolean;
  isCreating: boolean;
  isSendingMessage: boolean;
  isRefreshing: boolean;
  errorMessage: string | null;
  successMessage: string | null;
  lastLoadedAt: string | null;
  ticketsCount: number;

  loadMyTickets: () => Promise<void>;
  refreshMyTickets: () => Promise<void>;
  loadTicketDetail: (ticketId: Id) => Promise<void>;
  createTicket: () => Promise<SupportTicket | null>;
  addMessage: (ticketId: Id) => Promise<void>;
  setCategory: (category: SupportTicketCategory) => void;
  setSubject: (subject: string) => void;
  setMessage: (message: string) => void;
  setReplyMessage: (message: string) => void;
  resetCreateDraft: () => void;
  resetReplyDraft: () => void;
  clearError: () => void;
  clearMessages: () => void;
  setSelectedTicket: (ticket: SupportTicket | null) => void;
};

const DEFAULT_DRAFT: SupportTicketDraft = {
  category: 'technical',
  subject: '',
  message: '',
};

const MISSING_SESSION_MESSAGE = 'انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى.';
const CREATE_SUCCESS_MESSAGE = 'تم إنشاء تذكرة الدعم.';
const MESSAGE_SUCCESS_MESSAGE = 'تم إرسال الرسالة.';
const CATEGORY_REQUIRED_MESSAGE = 'يرجى اختيار التصنيف.';
const SUBJECT_REQUIRED_MESSAGE = 'يرجى إدخال عنوان المشكلة.';
const MESSAGE_REQUIRED_MESSAGE = 'يرجى كتابة تفاصيل المشكلة.';
const REPLY_REQUIRED_MESSAGE = 'يرجى كتابة الرسالة قبل الإرسال.';
const CLOSED_TICKET_MESSAGE = 'لا يمكن إضافة رسائل جديدة على تذكرة مغلقة أو محلولة.';

function getAccessToken(): string | null {
  return useAuthStore.getState().accessToken;
}

function isSameId(left: Id, right: Id): boolean {
  return String(left) === String(right);
}

function upsertTicket(tickets: SupportTicket[], nextTicket: SupportTicket): SupportTicket[] {
  const existingIndex = tickets.findIndex((ticket) => isSameId(ticket.id, nextTicket.id));

  if (existingIndex === -1) {
    return [nextTicket, ...tickets];
  }

  return tickets.map((ticket, index) => (index === existingIndex ? nextTicket : ticket));
}

function validateCreateDraft(draft: SupportTicketDraft): SupportTicketDraftValidation {
  const validation: SupportTicketDraftValidation = {};

  if (!draft.category.trim()) {
    validation.category = CATEGORY_REQUIRED_MESSAGE;
  }

  if (!draft.subject.trim()) {
    validation.subject = SUBJECT_REQUIRED_MESSAGE;
  }

  if (!draft.message.trim()) {
    validation.message = MESSAGE_REQUIRED_MESSAGE;
  }

  return validation;
}

function hasValidationErrors(validation: SupportTicketDraftValidation): boolean {
  return Boolean(
    validation.category || validation.subject || validation.message || validation.replyMessage,
  );
}

export const useSupportStore = create<SupportState>((set, get) => {
  function requireToken(): string | null {
    const accessToken = getAccessToken();

    if (!accessToken) {
      set({
        errorMessage: MISSING_SESSION_MESSAGE,
        isLoadingTickets: false,
        isLoadingDetail: false,
        isCreating: false,
        isSendingMessage: false,
        isRefreshing: false,
      });
      return null;
    }

    return accessToken;
  }

  async function reloadTickets(accessToken: string) {
    const response = await loadMySupportTickets(accessToken);

    set({
      tickets: response.results,
      ticketsCount: response.count,
      lastLoadedAt: new Date().toISOString(),
    });
  }

  async function reloadDetail(ticketId: Id, accessToken: string) {
    const ticket = await loadSupportTicketDetail(ticketId, accessToken);

    set((state) => ({
      selectedTicket: ticket,
      tickets: upsertTicket(state.tickets, ticket),
      lastLoadedAt: new Date().toISOString(),
    }));
  }

  return {
    tickets: [],
    selectedTicket: null,
    createDraft: DEFAULT_DRAFT,
    replyMessage: '',
    validation: {},
    isLoadingTickets: false,
    isLoadingDetail: false,
    isCreating: false,
    isSendingMessage: false,
    isRefreshing: false,
    errorMessage: null,
    successMessage: null,
    lastLoadedAt: null,
    ticketsCount: 0,

    async loadMyTickets() {
      if (get().isLoadingTickets) {
        return;
      }

      const accessToken = requireToken();

      if (!accessToken) {
        return;
      }

      set({ isLoadingTickets: true, errorMessage: null, successMessage: null });

      try {
        await reloadTickets(accessToken);
        set({ isLoadingTickets: false });
      } catch (error) {
        set({
          isLoadingTickets: false,
          errorMessage: toSafeSupportErrorMessage(error),
        });
      }
    },

    async refreshMyTickets() {
      if (get().isRefreshing) {
        return;
      }

      const accessToken = requireToken();

      if (!accessToken) {
        return;
      }

      set({ isRefreshing: true, errorMessage: null, successMessage: null });

      try {
        await reloadTickets(accessToken);
        const selectedTicket = get().selectedTicket;

        if (selectedTicket) {
          await reloadDetail(selectedTicket.id, accessToken);
        }

        set({ isRefreshing: false });
      } catch (error) {
        set({
          isRefreshing: false,
          errorMessage: toSafeSupportErrorMessage(error),
        });
      }
    },

    async loadTicketDetail(ticketId) {
      if (get().isLoadingDetail) {
        return;
      }

      const accessToken = requireToken();

      if (!accessToken) {
        return;
      }

      set({ isLoadingDetail: true, errorMessage: null, successMessage: null });

      try {
        await reloadDetail(ticketId, accessToken);
        set({ isLoadingDetail: false });
      } catch (error) {
        set({
          isLoadingDetail: false,
          errorMessage: toSafeSupportErrorMessage(error),
        });
      }
    },

    async createTicket() {
      if (get().isCreating) {
        return null;
      }

      const draft = get().createDraft;
      const validation = validateCreateDraft(draft);

      set({ validation });

      if (hasValidationErrors(validation)) {
        return null;
      }

      const accessToken = requireToken();

      if (!accessToken) {
        return null;
      }

      set({ isCreating: true, errorMessage: null, successMessage: null });

      try {
        const ticket = await createSupportTicket(
          {
            category: draft.category,
            subject: draft.subject.trim(),
            message: draft.message.trim(),
          },
          accessToken,
        );

        set((state) => ({
          tickets: upsertTicket(state.tickets, ticket),
          selectedTicket: ticket,
          createDraft: DEFAULT_DRAFT,
          validation: {},
          isCreating: false,
          successMessage: CREATE_SUCCESS_MESSAGE,
        }));

        await reloadTickets(accessToken);

        return ticket;
      } catch (error) {
        set({
          isCreating: false,
          errorMessage: toSafeSupportErrorMessage(error),
        });
        return null;
      }
    },

    async addMessage(ticketId) {
      if (get().isSendingMessage) {
        return;
      }

      const selectedTicket = get().selectedTicket;

      if (selectedTicket && !canReplyToSupportTicket(selectedTicket)) {
        set({
          errorMessage: CLOSED_TICKET_MESSAGE,
          validation: { replyMessage: CLOSED_TICKET_MESSAGE },
        });
        return;
      }

      const message = get().replyMessage.trim();

      if (!message) {
        set({ validation: { replyMessage: REPLY_REQUIRED_MESSAGE } });
        return;
      }

      const accessToken = requireToken();

      if (!accessToken) {
        return;
      }

      set({ isSendingMessage: true, errorMessage: null, successMessage: null });

      try {
        await addSupportTicketMessage(ticketId, { message }, accessToken);
        await reloadDetail(ticketId, accessToken);
        set({
          replyMessage: '',
          validation: {},
          isSendingMessage: false,
          successMessage: MESSAGE_SUCCESS_MESSAGE,
        });
      } catch (error) {
        set({
          isSendingMessage: false,
          errorMessage: toSafeSupportErrorMessage(error),
        });
      }
    },

    setCategory(category) {
      set((state) => ({
        createDraft: { ...state.createDraft, category },
        validation: { ...state.validation, category: undefined },
      }));
    },

    setSubject(subject) {
      set((state) => ({
        createDraft: { ...state.createDraft, subject },
        validation: { ...state.validation, subject: undefined },
      }));
    },

    setMessage(message) {
      set((state) => ({
        createDraft: { ...state.createDraft, message },
        validation: { ...state.validation, message: undefined },
      }));
    },

    setReplyMessage(message) {
      set((state) => ({
        replyMessage: message,
        validation: { ...state.validation, replyMessage: undefined },
      }));
    },

    resetCreateDraft() {
      set({ createDraft: DEFAULT_DRAFT, validation: {}, errorMessage: null, successMessage: null });
    },

    resetReplyDraft() {
      set((state) => ({
        replyMessage: '',
        validation: { ...state.validation, replyMessage: undefined },
      }));
    },

    clearError() {
      set({ errorMessage: null });
    },

    clearMessages() {
      set({ errorMessage: null, successMessage: null });
    },

    setSelectedTicket(ticket) {
      set({ selectedTicket: ticket });
    },
  };
});
