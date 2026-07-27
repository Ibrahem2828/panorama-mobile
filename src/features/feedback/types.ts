export type FeedbackKind = 'rating' | 'suggestion' | 'issue' | 'complaint' | 'praise';
export type FeedbackContext =
  | 'registration'
  | 'verification'
  | 'subject'
  | 'group'
  | 'chat'
  | 'file'
  | 'printing'
  | 'support'
  | 'search'
  | 'app'
  | string;

export type FeedbackPromptPolicy = {
  id: number;
  context: FeedbackContext;
  action_key: string;
  title: string;
  question: string;
  allow_comment: boolean;
  allow_suggestion: boolean;
};

export type FeedbackPromptEligibility = {
  should_prompt: boolean;
  policy: FeedbackPromptPolicy | null;
};

export type FeedbackPromptRequest = {
  context: FeedbackContext;
  actionKey: string;
  objectType?: string;
  objectId?: string | number;
  metadata?: Record<string, string | number | boolean | null>;
};

export type FeedbackSubmitPayload = {
  kind: FeedbackKind;
  context: FeedbackContext;
  action_key: string;
  object_type?: string;
  object_id?: string;
  rating?: number;
  title?: string;
  comment?: string;
  suggestion?: string;
  app_version: string;
  build_number: string;
  platform: string;
  locale: string;
  device_model: string;
  metadata?: Record<string, string | number | boolean | null>;
};

export type FeedbackRecord = FeedbackSubmitPayload & {
  id: number;
  status: string;
  resolution_message?: string | null;
  votes_count?: number;
  has_voted?: boolean;
  created_at: string;
  updated_at: string;
};

export type PublicSuggestion = {
  id: number;
  context: string;
  title: string;
  suggestion: string;
  status: string;
  resolution_message?: string | null;
  votes_count: number;
  has_voted: boolean;
  created_at: string;
  updated_at: string;
};
