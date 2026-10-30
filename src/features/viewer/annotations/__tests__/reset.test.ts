import {
  addAnnotation,
  applySyncResponse,
  buildSyncSnapshot,
  canRedo,
  canUndo,
  countVisible,
  emptyState,
  fromPersisted,
  hasPendingChanges,
  MAX_OPS_PER_SYNC,
  mergeServerItems,
  redo,
  removeAnnotation,
  resetAll,
  toPersisted,
  undo,
  visibleOnPage,
  type Annotation,
  type DocumentState,
  type ServerItem,
} from '../model';

function mark(id: string, page = 1, kind: Annotation['kind'] = 'highlight'): Annotation {
  const data =
    kind === 'pen'
      ? {
          points: [
            [0.1, 0.1],
            [0.2, 0.2],
          ] as [number, number][],
        }
      : kind === 'note'
        ? { x: 0.5, y: 0.5, text: 'n' }
        : { rects: [[0.1, 0.1, 0.4, 0.05]] as [number, number, number, number][] };

  return {
    clientId: id,
    page,
    kind,
    color: 'yellow',
    width: 1,
    data,
    version: null,
    deleted: false,
  };
}

function serverCopy(item: Annotation, version: number, deleted = false): ServerItem {
  return {
    client_id: item.clientId,
    page_number: item.page,
    kind: item.kind,
    color: item.color,
    width: item.width,
    data: item.data,
    version,
    deleted,
  };
}

/** A file whose marks were all uploaded (versions assigned, nothing dirty). */
function syncedState(ids: string[]): DocumentState {
  let state = emptyState();

  for (const [index, id] of ids.entries()) {
    state = addAnnotation(state, mark(id, (index % 3) + 1));
  }

  let revision = 0;

  while (hasPendingChanges(state)) {
    const snapshot = buildSyncSnapshot(state);
    const changes = snapshot.payload.upserts.map((op) => {
      revision += 1;

      return serverCopy(state.items[op.client_id], revision);
    });

    state = applySyncResponse(state, { revision, conflicts: [], changes }, snapshot);
  }

  return state;
}

describe('undo across types and pages', () => {
  it('walks back through every kind, page by page, in reverse order', () => {
    let state = emptyState();
    const kinds: Annotation['kind'][] = ['highlight', 'underline', 'pen', 'note'];

    kinds.forEach((kind, index) => {
      state = addAnnotation(state, mark(`m${index}`, index + 1, kind));
    });

    expect(countVisible(state)).toBe(4);

    for (let step = 3; step >= 0; step -= 1) {
      state = undo(state);
      expect(state.items[`m${step}`].deleted).toBe(true);
    }

    expect(canUndo(state)).toBe(false);
    expect(countVisible(state)).toBe(0);
    expect(undo(state)).toBe(state);
    expect(canRedo(state)).toBe(true);
    expect(visibleOnPage(redo(state), 1)).toHaveLength(1);
  });

  it('undoing an erase brings the mark back', () => {
    let state = addAnnotation(emptyState(), mark('a'));

    state = removeAnnotation(state, 'a');
    state = undo(state);

    expect(state.items.a.deleted).toBe(false);
  });

  it('keeps the history after a save/restore of the file state (viewer reopened)', () => {
    const state = addAnnotation(addAnnotation(emptyState(), mark('a')), mark('b', 2));
    const restored = fromPersisted(JSON.parse(JSON.stringify(toPersisted(state))));

    expect(canUndo(restored)).toBe(true);
    expect(countVisible(undo(undo(restored)))).toBe(0);
  });

  it('ignores damaged or dangling history entries on restore', () => {
    const persisted = {
      ...toPersisted(addAnnotation(emptyState(), mark('a'))),
      undoStack: [
        { type: 'add', id: 'a' },
        { type: 'add', id: 'ghost' },
        'junk',
        { type: 'x', id: 'a' },
      ],
      redoStack: 'nope',
    };
    const restored = fromPersisted(persisted);

    expect(restored.undoStack).toEqual([{ type: 'add', id: 'a' }]);
    expect(restored.redoStack).toEqual([]);
  });

  it('restores old saves that have no history', () => {
    const old: Record<string, unknown> = { ...toPersisted(addAnnotation(emptyState(), mark('a'))) };

    delete old.undoStack;
    delete old.redoStack;

    expect(canUndo(fromPersisted(old))).toBe(false);
  });
});

describe('resetAll', () => {
  it('is a no-op on an empty file', () => {
    expect(countVisible(resetAll(emptyState()))).toBe(0);
    expect(hasPendingChanges(resetAll(emptyState()))).toBe(false);
  });

  it('deletes everything on every page and clears the history', () => {
    const state = resetAll(syncedState(['a', 'b', 'c', 'd']));

    expect(countVisible(state)).toBe(0);
    expect([1, 2, 3].flatMap((page) => visibleOnPage(state, page))).toHaveLength(0);
    expect(canUndo(state)).toBe(false);
    expect(canRedo(state)).toBe(false);
  });

  it('turns each uploaded mark into exactly one tombstone for the sync API', () => {
    const { payload } = buildSyncSnapshot(resetAll(syncedState(['a', 'b', 'c'])));

    expect(payload.upserts).toEqual([]);
    expect([...payload.deletes].sort()).toEqual(['a', 'b', 'c']);
  });

  it('sends nothing for marks the server never saw, and is idempotent', () => {
    const state = resetAll(addAnnotation(emptyState(), mark('local')));

    expect(buildSyncSnapshot(state).payload.deletes).toEqual([]);

    const again = resetAll(state);

    expect(again.items).toEqual(state.items);
    expect(again.dirty).toEqual(state.dirty);
    expect(again.stamp).toBe(state.stamp);
  });

  it('queues offline: pending deletes survive a restart and are sent later', () => {
    const state = resetAll(syncedState(['a', 'b']));

    expect(hasPendingChanges(state)).toBe(true);

    const restored = fromPersisted(JSON.parse(JSON.stringify(toPersisted(state))));

    expect(countVisible(restored)).toBe(0);
    expect([...buildSyncSnapshot(restored).payload.deletes].sort()).toEqual(['a', 'b']);
  });

  it('clears the queue once the server confirmed, and a repeat does nothing', () => {
    let state = resetAll(syncedState(['a', 'b']));
    const snapshot = buildSyncSnapshot(state);

    state = applySyncResponse(
      state,
      {
        revision: 10,
        conflicts: [],
        changes: [serverCopy(state.items.a, 2, true), serverCopy(state.items.b, 3, true)],
      },
      snapshot,
    );

    expect(hasPendingChanges(state)).toBe(false);
    expect(hasPendingChanges(resetAll(state))).toBe(false);
  });

  it('does not resurrect marks from a stale pull while deletes are pending', () => {
    const synced = syncedState(['a', 'b']);
    const merged = mergeServerItems(
      resetAll(synced),
      [serverCopy(synced.items.a, 1), serverCopy(synced.items.b, 2)],
      2,
    );

    expect(countVisible(merged)).toBe(0);
    expect(buildSyncSnapshot(merged).payload.deletes).toHaveLength(2);
  });

  it('keeps pending deletes outside the sent batch when a stale answer arrives', () => {
    const ids = Array.from({ length: MAX_OPS_PER_SYNC + 20 }, (_, i) => `m${i}`);
    let state = resetAll(syncedState(ids));
    const first = buildSyncSnapshot(state);

    expect(first.payload.deletes).toHaveLength(MAX_OPS_PER_SYNC);

    const stale = ids.slice(MAX_OPS_PER_SYNC).map((id) => serverCopy(state.items[id], 1));
    const confirmed = first.payload.deletes.map((id) => serverCopy(state.items[id], 9, true));

    state = applySyncResponse(
      state,
      { revision: 50, conflicts: [], changes: [...confirmed, ...stale] },
      first,
    );

    expect(countVisible(state)).toBe(0);

    const second = buildSyncSnapshot(state);

    expect(second.payload.deletes).toHaveLength(20);

    state = applySyncResponse(
      state,
      {
        revision: 51,
        conflicts: [],
        changes: second.payload.deletes.map((id) => serverCopy(state.items[id], 9, true)),
      },
      second,
    );

    expect(hasPendingChanges(state)).toBe(false);
    expect(countVisible(state)).toBe(0);
  });

  it('a mark drawn after the reset is a normal new mark', () => {
    const state = addAnnotation(resetAll(syncedState(['a'])), mark('fresh'));

    expect(countVisible(state)).toBe(1);
    expect(canUndo(state)).toBe(true);
  });
});
