import { normalizeApiError } from '../../api/errors';
import type { LectureNote } from './types';

export const NOTE_MAX_LENGTH = 10_000;

export type NoteValidation = 'empty' | 'tooLong' | null;

/** Mirrors `LectureNoteSerializer.validate_content` (trimmed, 1..10000 chars). */
export function validateNoteContent(content: string): NoteValidation {
  const trimmed = content.trim();
  if (!trimmed) return 'empty';
  if (trimmed.length > NOTE_MAX_LENGTH) return 'tooLong';
  return null;
}

/** The backend answers a stale `version` with 409 (`NoteVersionConflict`). */
export function isNoteConflict(error: unknown): boolean {
  return normalizeApiError(error).status === 409;
}

export function tempNoteId(key: string): string {
  return `tmp-${key}`;
}

export function isTempNote(note: Pick<LectureNote, 'id'>): boolean {
  return typeof note.id === 'string' && note.id.startsWith('tmp-');
}

function time(value: string | null | undefined): number {
  const parsed = value ? Date.parse(value) : NaN;
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Newest first, like the backend (`-updated_at`); optimistic rows (no server timestamp) stay on top. */
export function sortNotes(notes: readonly LectureNote[]): LectureNote[] {
  return [...notes].sort((a, b) => {
    const pendingDelta = Number(Boolean(b.pending)) - Number(Boolean(a.pending));
    if (pendingDelta) return pendingDelta;
    return time(b.updated_at) - time(a.updated_at);
  });
}

export type NoteDraft = {
  tempId: string;
  content: string;
  page_number: number | null;
  is_bookmark?: boolean;
};

export function optimisticCreate(
  notes: readonly LectureNote[],
  draft: NoteDraft,
  nowIso: string,
): LectureNote[] {
  const note: LectureNote = {
    id: draft.tempId,
    content: draft.content,
    page_number: draft.page_number,
    version: 1,
    is_bookmark: draft.is_bookmark ?? false,
    is_favorite: false,
    created_at: nowIso,
    updated_at: nowIso,
    pending: true,
  };
  return sortNotes([note, ...notes.filter((item) => item.id !== draft.tempId)]);
}

/** Replaces the optimistic row by the server note (idempotent: a duplicate id from a refetch is merged). */
export function confirmCreate(
  notes: readonly LectureNote[],
  tempId: string,
  saved: LectureNote,
): LectureNote[] {
  const rest = notes.filter((item) => item.id !== tempId && item.id !== saved.id);
  return sortNotes([{ ...saved, pending: false }, ...rest]);
}

export type NotePatch = { content?: string; page_number?: number | null; is_favorite?: boolean };

export function optimisticUpdate(
  notes: readonly LectureNote[],
  id: LectureNote['id'],
  patch: NotePatch,
  nowIso: string,
): LectureNote[] {
  return sortNotes(
    notes.map((item) =>
      item.id === id ? { ...item, ...patch, updated_at: nowIso, pending: true } : item,
    ),
  );
}

export function confirmUpdate(notes: readonly LectureNote[], saved: LectureNote): LectureNote[] {
  return sortNotes(
    notes.map((item) => (item.id === saved.id ? { ...saved, pending: false } : item)),
  );
}

export function optimisticDelete(
  notes: readonly LectureNote[],
  id: LectureNote['id'],
): LectureNote[] {
  return notes.filter((item) => item.id !== id);
}

export type NotesFilter = 'all' | 'page' | 'bookmarks';

export function notesForFilter(
  notes: readonly LectureNote[],
  filter: NotesFilter,
  page: number,
): LectureNote[] {
  switch (filter) {
    case 'page':
      return notes.filter((item) => item.page_number === page);
    case 'bookmarks':
      return notes.filter((item) => item.is_bookmark);
    default:
      return [...notes];
  }
}

/** The bookmark note of a page (at most one is created per page by the viewer). */
export function bookmarkForPage(notes: readonly LectureNote[], page: number): LectureNote | null {
  return notes.find((item) => item.is_bookmark && item.page_number === page) ?? null;
}
