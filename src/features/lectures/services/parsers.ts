import type {
  Lecture,
  LectureNote,
  PageText,
  ProcessingStatus,
  ViewerSessionPayload,
} from '../types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function text(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

/** A positive integer id, or `null` (never 0) when the value is missing or not an id. */
function nullableId(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.trunc(value);
  if (typeof value === 'string' && /^\d+$/.test(value.trim())) return Number(value.trim());
  return null;
}

function int(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.trunc(value) : fallback;
}

/** Accepts a DRF page (`{results, next}`) or a bare array and returns the rows. */
export function extractResults(data: unknown): { results: unknown[]; hasNext: boolean } {
  if (Array.isArray(data)) return { results: data, hasNext: false };
  if (isRecord(data) && Array.isArray(data.results)) {
    return {
      results: data.results,
      hasNext: typeof data.next === 'string' && data.next.length > 0,
    };
  }
  return { results: [], hasNext: false };
}

export function parseLecture(value: unknown): Lecture | null {
  if (!isRecord(value)) return null;
  const id = value.id;
  if (typeof id !== 'number' && typeof id !== 'string') return null;
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) return null;
  const subject = nullableId(value.subject);
  return {
    id: numericId,
    subject,
    subject_name: text(value.subject_name)?.trim() || null,
    faculty: nullableId(value.faculty),
    faculty_name: text(value.faculty_name)?.trim() || null,
    is_general: typeof value.is_general === 'boolean' ? value.is_general : subject === null,
    title: text(value.title)?.trim() || null,
    description: text(value.description)?.trim() || null,
    status: text(value.status) ?? 'unknown',
    page_count: Math.max(0, int(value.page_count)),
    is_published: value.is_published !== false,
    published_at: text(value.published_at),
    can_view: value.can_view !== false,
    created_at: text(value.created_at),
    updated_at: text(value.updated_at),
  };
}

export function parseLectures(data: unknown): Lecture[] {
  return extractResults(data)
    .results.map(parseLecture)
    .filter((lecture): lecture is Lecture => lecture !== null);
}

export function parseNote(value: unknown): LectureNote | null {
  if (!isRecord(value)) return null;
  const id = value.id;
  if (typeof id !== 'number' && typeof id !== 'string') return null;
  const page = value.page_number;
  return {
    id,
    page_number: typeof page === 'number' && Number.isFinite(page) ? Math.trunc(page) : null,
    content: text(value.content) ?? '',
    version: Math.max(1, int(value.version, 1)),
    is_bookmark: value.is_bookmark === true,
    is_favorite: value.is_favorite === true,
    created_at: text(value.created_at),
    updated_at: text(value.updated_at),
  };
}

export function parseNotes(data: unknown): LectureNote[] {
  return extractResults(data)
    .results.map(parseNote)
    .filter((note): note is LectureNote => note !== null);
}

export function parseViewerSession(value: unknown): ViewerSessionPayload {
  if (!isRecord(value) || typeof value.session_token !== 'string' || !value.session_token) {
    throw new Error('INVALID_VIEWER_SESSION');
  }
  return {
    session_token: value.session_token,
    expires_at: text(value.expires_at) ?? '',
  };
}

export function parseProcessingStatus(value: unknown): ProcessingStatus {
  const record = isRecord(value) ? value : {};
  const status = text(record.status) ?? 'unknown';
  return {
    status,
    page_count: Math.max(0, int(record.page_count)),
    is_ready: record.is_ready === true || status === 'ready',
  };
}

export function parsePageText(value: unknown, fallbackPage: number): PageText {
  const record = isRecord(value) ? value : {};
  return {
    lecture_id: int(record.lecture_id),
    page_number: int(record.page_number, fallbackPage),
    text: text(record.text) ?? '',
  };
}
