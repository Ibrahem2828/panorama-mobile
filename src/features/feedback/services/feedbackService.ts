import { Platform } from 'react-native';
import * as Application from 'expo-application';
import * as Device from 'expo-device';
import { getLocales } from 'expo-localization';

import { apiClient, endpoints, normalizeApiError, type PaginatedResult } from '../../../api';
import type {
  FeedbackPromptEligibility,
  FeedbackPromptRequest,
  FeedbackRecord,
  FeedbackSubmitPayload,
  PublicSuggestion,
} from '../types';
import type { TranslationCatalog } from '../../../i18n';

function appMetadata() {
  const locale = getLocales()[0]?.languageTag ?? 'ar';
  return {
    app_version: Application.nativeApplicationVersion ?? '2.0.0',
    build_number: Application.nativeBuildVersion ?? '200',
    platform: Platform.OS,
    locale,
    device_model: Device.modelName ?? 'unknown',
  };
}

export function toSafeFeedbackErrorMessage(
  error: unknown,
  t: TranslationCatalog['feedback'],
): string {
  const normalized = normalizeApiError(error);
  if (normalized.code === 'NETWORK_ERROR' || normalized.code === 'TIMEOUT') {
    return t.errors.network;
  }
  if (normalized.code === 'RATE_LIMITED') return t.errors.rateLimited;
  return normalized.message || t.errors.generic;
}

export async function checkPromptEligibility(
  request: FeedbackPromptRequest,
  authToken: string,
): Promise<FeedbackPromptEligibility> {
  const meta = appMetadata();
  return apiClient.get<FeedbackPromptEligibility>(endpoints.feedback.prompt, {
    authToken,
    query: {
      context: request.context,
      action_key: request.actionKey,
      app_version: meta.app_version,
    },
  });
}

export async function recordPromptEvent(
  policyId: number,
  event: 'shown' | 'dismissed',
  authToken: string,
): Promise<void> {
  const meta = appMetadata();
  await apiClient.post(
    endpoints.feedback.promptEvent,
    {
      policy_id: policyId,
      event,
      app_version: meta.app_version,
    },
    { authToken },
  );
}

export async function submitFeedback(
  input: Omit<
    FeedbackSubmitPayload,
    'app_version' | 'build_number' | 'platform' | 'locale' | 'device_model'
  >,
  authToken: string,
): Promise<FeedbackRecord> {
  return apiClient.post<FeedbackRecord, FeedbackSubmitPayload>(
    endpoints.feedback.submit,
    { ...input, ...appMetadata() },
    { authToken },
  );
}

export function loadMyFeedback(authToken: string): Promise<PaginatedResult<FeedbackRecord>> {
  return apiClient.get(endpoints.feedback.mine, { authToken });
}

export function loadPublicSuggestions(
  authToken: string,
): Promise<PaginatedResult<PublicSuggestion>> {
  return apiClient.get(endpoints.feedback.suggestions, { authToken });
}

export function toggleSuggestionVote(feedbackId: number, authToken: string) {
  return apiClient.post<{ voted: boolean; votes_count: number }, Record<string, never>>(
    endpoints.feedback.vote(feedbackId),
    {},
    { authToken },
  );
}
