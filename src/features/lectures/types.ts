export type LectureId = number | string;

export const LECTURE_STATUSES = [
  'uploaded',
  'queued',
  'scanning',
  'converting',
  'extracting',
  'rendering',
  'ready',
  'failed',
  'quarantined',
] as const;

export type LectureStatus = (typeof LECTURE_STATUSES)[number];

/** `LectureSerializer` (student read-only). Status is kept as a string: unknown values must not crash the UI. */
export type Lecture = {
  id: number;
  /** `null` for a general lecture that is not linked to any subject. */
  subject: number | null;
  subject_name: string | null;
  faculty: number | null;
  faculty_name: string | null;
  /** True when the lecture is not linked to a subject (derived from `subject` when absent). */
  is_general: boolean;
  title: string | null;
  description: string | null;
  status: string;
  page_count: number;
  is_published: boolean;
  published_at: string | null;
  can_view: boolean;
  created_at: string | null;
  updated_at: string | null;
};

/** `POST viewer/session/` data. */
export type ViewerSessionPayload = {
  session_token: string;
  expires_at: string;
};

/** `GET processing-status/` data. */
export type ProcessingStatus = {
  status: string;
  page_count: number;
  is_ready: boolean;
};

/** `GET viewer/pages/{n}/text/` data. */
export type PageText = {
  lecture_id: number;
  page_number: number;
  text: string;
};

/** `LectureNoteSerializer`. `version` is the optimistic-locking counter required by PATCH. */
export type LectureNote = {
  id: number | string;
  page_number: number | null;
  content: string;
  version: number;
  is_bookmark: boolean;
  is_favorite: boolean;
  created_at: string | null;
  updated_at: string | null;
  /** Client only: optimistic row the server has not confirmed yet. */
  pending?: boolean;
};

export type PageKind = 'page' | 'thumbnail';

export type ViewerImageSource = { uri: string; headers: Record<string, string> };
