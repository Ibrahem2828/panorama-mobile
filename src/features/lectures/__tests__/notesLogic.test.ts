import { createApiError } from '../../../api/errors';
import {
  bookmarkForPage,
  confirmCreate,
  confirmUpdate,
  isNoteConflict,
  isTempNote,
  NOTE_MAX_LENGTH,
  notesForFilter,
  optimisticCreate,
  optimisticDelete,
  optimisticUpdate,
  sortNotes,
  tempNoteId,
  validateNoteContent,
} from '../notesLogic';
import type { LectureNote } from '../types';

function note(overrides: Partial<LectureNote>): LectureNote {
  return {
    id: 1,
    page_number: null,
    content: 'text',
    version: 1,
    is_bookmark: false,
    is_favorite: false,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('validateNoteContent', () => {
  it('rejects empty and whitespace-only content', () => {
    expect(validateNoteContent('')).toBe('empty');
    expect(validateNoteContent('   \n ')).toBe('empty');
  });

  it('rejects content over the limit (after trimming)', () => {
    expect(validateNoteContent('a'.repeat(NOTE_MAX_LENGTH))).toBeNull();
    expect(validateNoteContent(`  ${'a'.repeat(NOTE_MAX_LENGTH)}  `)).toBeNull();
    expect(validateNoteContent('a'.repeat(NOTE_MAX_LENGTH + 1))).toBe('tooLong');
  });
});

describe('conflict + temp ids', () => {
  it('detects a version conflict by status', () => {
    expect(isNoteConflict(createApiError({ status: 409 }))).toBe(true);
    expect(isNoteConflict(createApiError({ status: 400 }))).toBe(false);
    expect(isNoteConflict(new Error('x'))).toBe(false);
  });

  it('marks optimistic rows with a tmp id', () => {
    expect(isTempNote({ id: tempNoteId('abc') })).toBe(true);
    expect(isTempNote({ id: 5 })).toBe(false);
    expect(isTempNote({ id: 'real' })).toBe(false);
  });
});

describe('optimistic updates', () => {
  const server = [
    note({ id: 1, updated_at: '2026-01-01T00:00:00Z' }),
    note({ id: 2, updated_at: '2026-02-01T00:00:00Z' }),
  ];

  it('sorts newest first', () => {
    expect(sortNotes(server).map((item) => item.id)).toEqual([2, 1]);
  });

  it('creates an optimistic row on top and confirms it with the server note', () => {
    const tempId = tempNoteId('k1');
    const optimistic = optimisticCreate(
      server,
      { tempId, content: 'new', page_number: 3 },
      '2026-03-01T00:00:00Z',
    );
    expect(optimistic[0]).toMatchObject({ id: tempId, pending: true, version: 1, page_number: 3 });
    const confirmed = confirmCreate(
      optimistic,
      tempId,
      note({ id: 9, content: 'new', version: 1 }),
    );
    expect(confirmed.some((item) => item.id === tempId)).toBe(false);
    expect(confirmed.find((item) => item.id === 9)?.pending).toBe(false);
    expect(confirmed).toHaveLength(3);
  });

  it('merges a duplicate server row when a refetch raced the create', () => {
    const tempId = tempNoteId('k2');
    const racing = [
      note({ id: 9 }),
      ...optimisticCreate([], { tempId, content: 'x', page_number: null }, 'now'),
    ];
    const confirmed = confirmCreate(racing, tempId, note({ id: 9 }));
    expect(confirmed.filter((item) => item.id === 9)).toHaveLength(1);
    expect(confirmed.some((item) => item.id === tempId)).toBe(false);
  });

  it('updates optimistically, then confirms with the new version', () => {
    const updated = optimisticUpdate(server, 1, { content: 'edited' }, '2026-04-01T00:00:00Z');
    expect(updated[0]).toMatchObject({ id: 1, content: 'edited', pending: true, version: 1 });
    const confirmed = confirmUpdate(updated, note({ id: 1, content: 'edited', version: 2 }));
    expect(confirmed.find((item) => item.id === 1)).toMatchObject({
      version: 2,
      pending: false,
    });
  });

  it('toggles favourite through an optimistic patch', () => {
    const updated = optimisticUpdate(server, 2, { is_favorite: true }, 'now');
    expect(updated.find((item) => item.id === 2)?.is_favorite).toBe(true);
  });

  it('deletes by id', () => {
    expect(optimisticDelete(server, 1).map((item) => item.id)).toEqual([2]);
    expect(optimisticDelete(server, 99)).toHaveLength(2);
  });
});

describe('filters and bookmarks', () => {
  const notes = [
    note({ id: 1, page_number: 2 }),
    note({ id: 2, page_number: 3, is_bookmark: true }),
    note({ id: 3, page_number: null }),
  ];

  it('filters by page and bookmarks', () => {
    expect(notesForFilter(notes, 'all', 2)).toHaveLength(3);
    expect(notesForFilter(notes, 'page', 2).map((item) => item.id)).toEqual([1]);
    expect(notesForFilter(notes, 'bookmarks', 2).map((item) => item.id)).toEqual([2]);
  });

  it('finds the bookmark of a page', () => {
    expect(bookmarkForPage(notes, 3)?.id).toBe(2);
    expect(bookmarkForPage(notes, 2)).toBeNull();
  });
});
