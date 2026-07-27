import { create } from 'zustand';

import { useAuthStore } from '../../auth/store';
import {
  checkPromptEligibility,
  recordPromptEvent,
  submitFeedback,
  toSafeFeedbackErrorMessage,
} from '../services';
import type { FeedbackPromptPolicy, FeedbackPromptRequest } from '../types';

type ActivePrompt = FeedbackPromptRequest & { policy: FeedbackPromptPolicy };

type FeedbackState = {
  activePrompt: ActivePrompt | null;
  isChecking: boolean;
  isSubmitting: boolean;
  errorMessage: string | null;
  successMessage: string | null;
  requestPrompt: (request: FeedbackPromptRequest) => Promise<void>;
  dismissPrompt: () => Promise<void>;
  submitRating: (rating: number, comment?: string) => Promise<void>;
  clearMessages: () => void;
};

export const useFeedbackStore = create<FeedbackState>((set, get) => ({
  activePrompt: null,
  isChecking: false,
  isSubmitting: false,
  errorMessage: null,
  successMessage: null,

  async requestPrompt(request) {
    const token = useAuthStore.getState().accessToken;
    if (!token || get().activePrompt || get().isChecking) return;
    set({ isChecking: true, errorMessage: null });
    try {
      const result = await checkPromptEligibility(request, token);
      if (result.should_prompt && result.policy) {
        const activePrompt = { ...request, policy: result.policy };
        set({ activePrompt });
        await recordPromptEvent(result.policy.id, 'shown', token);
      }
    } catch {
      // Feedback prompts are non-blocking and must never interrupt the core journey.
    } finally {
      set({ isChecking: false });
    }
  },

  async dismissPrompt() {
    const prompt = get().activePrompt;
    const token = useAuthStore.getState().accessToken;
    set({ activePrompt: null, errorMessage: null });
    if (prompt && token) {
      try {
        await recordPromptEvent(prompt.policy.id, 'dismissed', token);
      } catch {
        /* no-op */
      }
    }
  },

  async submitRating(rating, comment = '') {
    const prompt = get().activePrompt;
    const token = useAuthStore.getState().accessToken;
    if (!prompt || !token || get().isSubmitting) return;
    set({ isSubmitting: true, errorMessage: null });
    try {
      await submitFeedback(
        {
          kind: 'rating',
          context: prompt.context,
          action_key: prompt.actionKey,
          object_type: prompt.objectType,
          object_id: prompt.objectId === undefined ? undefined : String(prompt.objectId),
          rating,
          comment: comment.trim() || undefined,
          metadata: prompt.metadata,
        },
        token,
      );
      set({ activePrompt: null, successMessage: 'شكرًا لمساعدتنا في تطوير بانوراما.' });
    } catch (error) {
      set({ errorMessage: toSafeFeedbackErrorMessage(error) });
    } finally {
      set({ isSubmitting: false });
    }
  },

  clearMessages() {
    set({ errorMessage: null, successMessage: null });
  },
}));
