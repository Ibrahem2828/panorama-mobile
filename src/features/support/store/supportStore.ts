import { create } from 'zustand';

import { useLocaleStore } from '../../../i18n';

import { useAuthStore } from '../../auth/store';
import {
  addSupportTicketMessage,
  canReplyToSupportTicket,
  createSupportTicket,
  isUploadCancelled,
  loadMySupportTickets,
  loadSupportTicketDetail,
  toSafeSupportErrorMessage,
} from '../services';
import type { LocalFile } from '../../attachments/services/localFile';
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
  replyAttachment: LocalFile | null;
  uploadPercent: number | null;
  nextTicketsPage: number | null;
  statusFilter: string;
  isLoadingMoreTickets: boolean;
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

  loadMyTickets: (status?: string) => Promise<void>;
  loadMoreTickets: () => Promise<void>;
  cancelUpload: () => void;
  setAttachment: (file: LocalFile | null) => void;
  setReplyAttachment: (file: LocalFile | null) => void;
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
  reset: () => void;
};

const DEFAULT_DRAFT: SupportTicketDraft = {
  category: 'technical',
  subject: '',
  message: '',
  attachment: null,
};

function getInitialSupportState() {
  return {
    tickets: [],
    selectedTicket: null,
    createDraft: { ...DEFAULT_DRAFT },
    replyMessage: '',
    replyAttachment: null,
    uploadPercent: null,
    nextTicketsPage: null,
    statusFilter: '',
    isLoadingMoreTickets: false,
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
  };
}

// Read when the action runs so the message follows the current locale.
function supportCatalog() {
  return useLocaleStore.getState().t.support;
}

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
    validation.category = supportCatalog().validation.categoryRequired;
  }

  if (!draft.subject.trim()) {
    validation.subject = supportCatalog().validation.subjectRequired;
  }

  if (!draft.message.trim()) {
    validation.message = supportCatalog().validation.messageRequired;
  }

  return validation;
}

function hasValidationErrors(validation: SupportTicketDraftValidation): boolean {
  return Boolean(
    validation.category || validation.subject || validation.message || validation.replyMessage,
  );
}

/** One attachment upload at a time; this is the handle the cancel button aborts. */
let activeUpload: AbortController | null = null;

type SetState = (partial: Partial<SupportState>) => void;

function startUpload(set: SetState, hasAttachment: boolean) {
  activeUpload?.abort();

  const controller = new AbortController();
  let lastPercent = -1;

  activeUpload = controller;
  set({ uploadPercent: hasAttachment ? 0 : null });

  return {
    signal: controller.signal,
    options: {
      signal: controller.signal,
      onUploadProgress: ({ loaded, total }: { loaded: number; total: number }) => {
        const percent = total > 0 ? Math.min(100, Math.round((loaded / total) * 100)) : 0;

        if (hasAttachment && percent !== lastPercent) {
          lastPercent = percent;
          set({ uploadPercent: percent });
        }
      },
    },
    finish: () => {
      if (activeUpload === controller) {
        activeUpload = null;
      }

      set({ uploadPercent: null });
    },
  };
}

export const useSupportStore = create<SupportState>((set, get) => {
  function requireToken(): string | null {
    const accessToken = getAccessToken();

    if (!accessToken) {
      set({
        errorMessage: supportCatalog().errors.unauthorized,
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
    const status = get().statusFilter;
    const response = await loadMySupportTickets(accessToken, {
      page: 1,
      status: status || undefined,
    });

    set({
      tickets: response.results,
      ticketsCount: response.count,
      nextTicketsPage: response.next ? 2 : null,
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
    ...getInitialSupportState(),

    async loadMyTickets(status) {
      if (status !== undefined && status !== get().statusFilter) {
        // A different filter replaces whatever load is still running.
        set({ statusFilter: status, isLoadingTickets: false });
      }

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
          errorMessage: toSafeSupportErrorMessage(error, supportCatalog()),
        });
      }
    },

    async loadMoreTickets() {
      const {
        nextTicketsPage,
        isLoadingMoreTickets,
        isLoadingTickets,
        isRefreshing,
        statusFilter,
      } = get();
      const accessToken = getAccessToken();

      if (
        nextTicketsPage === null ||
        isLoadingMoreTickets ||
        isLoadingTickets ||
        isRefreshing ||
        !accessToken
      ) {
        return;
      }

      set({ isLoadingMoreTickets: true, errorMessage: null });

      try {
        const response = await loadMySupportTickets(accessToken, {
          page: nextTicketsPage,
          status: statusFilter || undefined,
        });

        set((state) => {
          const known = new Set(state.tickets.map((ticket) => String(ticket.id)));

          return {
            tickets: [
              ...state.tickets,
              ...response.results.filter((ticket) => !known.has(String(ticket.id))),
            ],
            ticketsCount: response.count,
            nextTicketsPage: response.next ? nextTicketsPage + 1 : null,
            isLoadingMoreTickets: false,
          };
        });
      } catch (error) {
        set({
          isLoadingMoreTickets: false,
          errorMessage: toSafeSupportErrorMessage(error, supportCatalog()),
        });
      }
    },

    cancelUpload() {
      activeUpload?.abort();
    },

    setAttachment(file) {
      set((state) => ({ createDraft: { ...state.createDraft, attachment: file } }));
    },

    setReplyAttachment(file) {
      set({ replyAttachment: file });
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
          errorMessage: toSafeSupportErrorMessage(error, supportCatalog()),
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
          errorMessage: toSafeSupportErrorMessage(error, supportCatalog()),
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

      const upload = startUpload(set, Boolean(draft.attachment));

      try {
        const ticket = await createSupportTicket(
          {
            category: draft.category,
            subject: draft.subject.trim(),
            message: draft.message.trim(),
            attachment: draft.attachment,
          },
          accessToken,
          upload.options,
        );

        set((state) => ({
          tickets: upsertTicket(state.tickets, ticket),
          selectedTicket: ticket,
          createDraft: DEFAULT_DRAFT,
          validation: {},
          isCreating: false,
          successMessage: supportCatalog().messages.createSuccess,
        }));

        await reloadTickets(accessToken);

        return ticket;
      } catch (error) {
        set({
          isCreating: false,
          errorMessage: isUploadCancelled(error, upload.signal)
            ? null
            : toSafeSupportErrorMessage(error, supportCatalog()),
        });
        return null;
      } finally {
        upload.finish();
      }
    },

    async addMessage(ticketId) {
      if (get().isSendingMessage) {
        return;
      }

      const selectedTicket = get().selectedTicket;

      if (selectedTicket && !canReplyToSupportTicket(selectedTicket)) {
        set({
          errorMessage: supportCatalog().validation.closedTicket,
          validation: { replyMessage: supportCatalog().validation.closedTicket },
        });
        return;
      }

      const message = get().replyMessage.trim();

      if (!message) {
        set({ validation: { replyMessage: supportCatalog().validation.replyRequired } });
        return;
      }

      const accessToken = requireToken();

      if (!accessToken) {
        return;
      }

      set({ isSendingMessage: true, errorMessage: null, successMessage: null });

      const attachment = get().replyAttachment;
      const upload = startUpload(set, Boolean(attachment));

      try {
        await addSupportTicketMessage(
          ticketId,
          { message, attachment },
          accessToken,
          upload.options,
        );
        await reloadDetail(ticketId, accessToken);
        set({
          replyMessage: '',
          replyAttachment: null,
          validation: {},
          isSendingMessage: false,
          successMessage: supportCatalog().messages.sendSuccess,
        });
      } catch (error) {
        set({
          isSendingMessage: false,
          errorMessage: isUploadCancelled(error, upload.signal)
            ? null
            : toSafeSupportErrorMessage(error, supportCatalog()),
        });
      } finally {
        upload.finish();
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

    reset() {
      activeUpload?.abort();
      set(getInitialSupportState());
    },
  };
});
