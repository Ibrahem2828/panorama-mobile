import { useCallback, useEffect, useRef, useState } from 'react';

import { generateIdempotencyKey } from '../../../api';
import { lectureErrorKind, type LectureErrorKind } from '../logic';
import {
  bookmarkForPage,
  confirmCreate,
  confirmUpdate,
  isNoteConflict,
  optimisticCreate,
  optimisticDelete,
  optimisticUpdate,
  sortNotes,
  tempNoteId,
} from '../notesLogic';
import { createNote, deleteNote, fetchNotes, updateNote } from '../services/lecturesService';
import type { LectureId, LectureNote } from '../types';

export type NoteResult = { ok: true } | { ok: false; error: unknown; conflict: boolean };

type NotesApi = {
  notes: LectureNote[];
  isLoading: boolean;
  errorKind: LectureErrorKind | null;
  reload: () => void;
  create: (input: { content: string; page_number: number | null }) => Promise<NoteResult>;
  update: (note: LectureNote, content: string) => Promise<NoteResult>;
  remove: (note: LectureNote) => Promise<NoteResult>;
  toggleFavorite: (note: LectureNote) => Promise<NoteResult>;
  /** Adds the page bookmark, or removes it when the page is already bookmarked. */
  toggleBookmark: (page: number, content: string) => Promise<NoteResult>;
};

function failure(error: unknown): NoteResult {
  return { ok: false, error, conflict: isNoteConflict(error) };
}

/** Notes of one lecture: optimistic create/update/delete with targeted rollback; a 409 reloads the server state. */
export function useLectureNotes(lectureId: LectureId, enabled = true): NotesApi {
  const [notes, setNotesState] = useState<LectureNote[]>([]);
  const [isLoading, setIsLoading] = useState(enabled);
  const [errorKind, setErrorKind] = useState<LectureErrorKind | null>(null);
  const [attempt, setAttempt] = useState(0);
  const notesRef = useRef<LectureNote[]>([]);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const setNotes = useCallback((updater: (current: LectureNote[]) => LectureNote[]) => {
    const next = updater(notesRef.current);
    notesRef.current = next;
    if (alive.current) setNotesState(next);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setIsLoading(true);
    setErrorKind(null);
    fetchNotes(lectureId).then(
      (loaded) => {
        if (cancelled) return;
        // Keep optimistic rows that are still in flight.
        const inFlight = notesRef.current.filter((note) => note.pending);
        notesRef.current = sortNotes([...inFlight, ...loaded]);
        setNotesState(notesRef.current);
        setIsLoading(false);
      },
      (error: unknown) => {
        if (cancelled) return;
        setErrorKind(lectureErrorKind(error));
        setIsLoading(false);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [lectureId, enabled, attempt]);

  const reload = useCallback(() => setAttempt((value) => value + 1), []);

  const create = useCallback<NotesApi['create']>(
    async ({ content, page_number }) => {
      const key = generateIdempotencyKey();
      const tempId = tempNoteId(key);
      const trimmed = content.trim();
      setNotes((current) =>
        optimisticCreate(
          current,
          { tempId, content: trimmed, page_number },
          new Date().toISOString(),
        ),
      );
      try {
        const saved = await createNote(lectureId, { content: trimmed, page_number }, key);
        setNotes((current) => confirmCreate(current, tempId, saved));
        return { ok: true };
      } catch (error) {
        setNotes((current) => optimisticDelete(current, tempId));
        return failure(error);
      }
    },
    [lectureId, setNotes],
  );

  const patch = useCallback(
    async (
      note: LectureNote,
      change: { content?: string; is_favorite?: boolean },
    ): Promise<NoteResult> => {
      setNotes((current) => optimisticUpdate(current, note.id, change, new Date().toISOString()));
      try {
        const saved = await updateNote(lectureId, note, change);
        setNotes((current) => confirmUpdate(current, saved));
        return { ok: true };
      } catch (error) {
        setNotes((current) => current.map((item) => (item.id === note.id ? note : item)));
        if (isNoteConflict(error)) reload();
        return failure(error);
      }
    },
    [lectureId, reload, setNotes],
  );

  const update = useCallback<NotesApi['update']>(
    (note, content) => patch(note, { content: content.trim() }),
    [patch],
  );

  const toggleFavorite = useCallback<NotesApi['toggleFavorite']>(
    (note) => patch(note, { is_favorite: !note.is_favorite }),
    [patch],
  );

  const remove = useCallback<NotesApi['remove']>(
    async (note) => {
      setNotes((current) => optimisticDelete(current, note.id));
      try {
        await deleteNote(lectureId, note.id);
        return { ok: true };
      } catch (error) {
        // Already gone on the server: nothing to restore.
        if (lectureErrorKind(error) === 'notFound') return { ok: true };
        setNotes((current) =>
          current.some((item) => item.id === note.id) ? current : sortNotes([...current, note]),
        );
        return failure(error);
      }
    },
    [lectureId, setNotes],
  );

  const toggleBookmark = useCallback<NotesApi['toggleBookmark']>(
    async (page, content) => {
      const existing = bookmarkForPage(notesRef.current, page);
      if (existing) return remove(existing);
      const key = generateIdempotencyKey();
      const tempId = tempNoteId(key);
      setNotes((current) =>
        optimisticCreate(
          current,
          { tempId, content, page_number: page, is_bookmark: true },
          new Date().toISOString(),
        ),
      );
      try {
        const saved = await createNote(
          lectureId,
          { content, page_number: page, is_bookmark: true, note_type: 'bookmark' },
          key,
        );
        setNotes((current) => confirmCreate(current, tempId, saved));
        return { ok: true };
      } catch (error) {
        setNotes((current) => optimisticDelete(current, tempId));
        return failure(error);
      }
    },
    [lectureId, remove, setNotes],
  );

  return {
    notes,
    isLoading,
    errorKind,
    reload,
    create,
    update,
    remove,
    toggleFavorite,
    toggleBookmark,
  };
}
