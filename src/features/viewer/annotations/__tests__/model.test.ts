import {
  fitRect,
  hitsAnnotation,
  rectFromPoints,
  simplifyStroke,
  toRelative,
  topmostHit,
  underlineRect,
} from '../geometry';
import {
  addAnnotation,
  applySyncResponse,
  buildSyncSnapshot,
  canRedo,
  canUndo,
  countVisible,
  editAnnotation,
  emptyState,
  fromPersisted,
  hasPendingChanges,
  mergeServerItems,
  redo,
  removeAnnotation,
  toPersisted,
  undo,
  visibleOnPage,
  type Annotation,
  type ServerItem,
} from '../model';

function mark(id: string, page = 1, extra: Partial<Annotation> = {}): Annotation {
  return {
    clientId: id,
    page,
    kind: 'highlight',
    color: 'yellow',
    width: 1,
    data: { rects: [[0.1, 0.1, 0.4, 0.05]] },
    version: null,
    deleted: false,
    ...extra,
  };
}

function server(id: string, version: number, extra: Partial<ServerItem> = {}): ServerItem {
  return {
    client_id: id,
    page_number: 1,
    kind: 'highlight',
    color: 'yellow',
    width: 1,
    data: { rects: [[0.1, 0.1, 0.4, 0.05]] },
    version,
    deleted: false,
    ...extra,
  };
}

describe('undo / redo', () => {
  it('undoes and redoes an add', () => {
    let state = addAnnotation(emptyState(), mark('a'));

    expect(countVisible(state)).toBe(1);
    expect(canUndo(state)).toBe(true);
    state = undo(state);
    expect(countVisible(state)).toBe(0);
    expect(canRedo(state)).toBe(true);
    state = redo(state);
    expect(countVisible(state)).toBe(1);
  });

  it('undoes an erase and clears redo after a new action', () => {
    let state = addAnnotation(emptyState(), mark('a'));

    state = removeAnnotation(state, 'a');
    expect(visibleOnPage(state, 1)).toHaveLength(0);
    state = undo(state);
    expect(visibleOnPage(state, 1)).toHaveLength(1);
    state = undo(state);
    expect(canRedo(state)).toBe(true);
    state = addAnnotation(state, mark('b'));
    expect(canRedo(state)).toBe(false);
  });

  it('keeps marks per page', () => {
    const state = addAnnotation(addAnnotation(emptyState(), mark('a', 1)), mark('b', 2));

    expect(visibleOnPage(state, 2).map((item) => item.clientId)).toEqual(['b']);
  });

  it('removing something that is not there is a no-op', () => {
    const state = emptyState();

    expect(removeAnnotation(state, 'missing')).toBe(state);
  });
});

describe('sync snapshots', () => {
  it('sends new marks without a version and known ones with it', () => {
    let state = addAnnotation(emptyState(), mark('new'));

    state = {
      ...state,
      items: { ...state.items, old: mark('old', 1, { version: 3 }) },
      order: [...state.order, 'old'],
    };
    state = editAnnotation(state, 'old', { color: 'green' });

    const { payload } = buildSyncSnapshot(state);
    const byId = Object.fromEntries(payload.upserts.map((op) => [op.client_id, op]));

    expect(byId.new?.version).toBeUndefined();
    expect(byId.old?.version).toBe(3);
    expect(payload.deletes).toEqual([]);
  });

  it('never uploads a mark that was drawn and erased before the server saw it', () => {
    let state = addAnnotation(emptyState(), mark('a'));

    state = removeAnnotation(state, 'a');
    const { payload, sent } = buildSyncSnapshot(state);

    expect(payload.upserts).toEqual([]);
    expect(payload.deletes).toEqual([]);
    expect(sent.a).toBeDefined(); // still cleared after the (empty) round trip
  });

  it('sends deletes for marks the server knows', () => {
    let state = mergeServerItems(emptyState(), [server('a', 1)], 1);

    state = removeAnnotation(state, 'a');
    expect(buildSyncSnapshot(state).payload.deletes).toEqual(['a']);
  });

  it('caps one request at 200 changes', () => {
    let state = emptyState();

    for (let index = 0; index < 250; index += 1) {
      state = addAnnotation(state, mark(`m${index}`));
    }

    const { payload } = buildSyncSnapshot(state);

    expect(payload.upserts.length + payload.deletes.length).toBe(200);
  });

  it('only clears changes that were sent, keeping edits made while the request was in flight', () => {
    let state = addAnnotation(emptyState(), mark('a'));
    const snapshot = buildSyncSnapshot(state);

    state = editAnnotation(state, 'a', { color: 'pink' }); // edited again before the answer arrives
    state = addAnnotation(state, mark('b'));
    state = applySyncResponse(
      state,
      { revision: 1, conflicts: [], changes: [server('a', 1)] },
      snapshot,
    );

    expect(Object.keys(state.dirty).sort()).toEqual(['a', 'b']);
    expect(state.items.a?.color).toBe('pink'); // the newer local edit survives
    expect(state.items.a?.version).toBe(1); // but it now knows the server version
    expect(state.revision).toBe(1);
  });

  it('adopts the server copy of a conflict and drops the local change', () => {
    let state = mergeServerItems(emptyState(), [server('a', 1)], 1);

    state = editAnnotation(state, 'a', { color: 'pink' });
    const snapshot = buildSyncSnapshot(state);

    state = applySyncResponse(
      state,
      {
        revision: 2,
        conflicts: [server('a', 2, { color: 'green' })],
        changes: [server('a', 2, { color: 'green' })],
      },
      snapshot,
    );

    expect(state.items.a?.color).toBe('green');
    expect(hasPendingChanges(state)).toBe(false);
  });

  it('merges marks drawn on another device and their deletions', () => {
    let state = emptyState();
    const snapshot = buildSyncSnapshot(state);

    state = applySyncResponse(
      state,
      { revision: 3, conflicts: [], changes: [server('x', 1), server('y', 2, { deleted: true })] },
      snapshot,
    );

    expect(visibleOnPage(state, 1).map((item) => item.clientId)).toEqual(['x']);
    expect(state.revision).toBe(3);
  });

  it('first load does not overwrite unsynced local work', () => {
    let state = addAnnotation(emptyState(), mark('local'));

    state = mergeServerItems(
      state,
      [server('local', 5, { color: 'blue' }), server('remote', 1)],
      4,
    );
    expect(state.items.local?.color).toBe('yellow');
    expect(state.items.remote).toBeDefined();
  });
});

describe('persistence', () => {
  it('round-trips and tolerates garbage', () => {
    const state = addAnnotation(emptyState(), mark('a'));
    const restored = fromPersisted(JSON.parse(JSON.stringify(toPersisted(state))));

    expect(restored.items.a).toBeDefined();
    expect(hasPendingChanges(restored)).toBe(true);
    expect(canUndo(restored)).toBe(true); // history is saved with the marks
    expect(fromPersisted(null)).toEqual(emptyState());
    expect(fromPersisted({ items: 5 })).toEqual(emptyState());
  });
});

describe('geometry', () => {
  it('fits a page inside its container (contain)', () => {
    expect(fitRect({ width: 400, height: 800 }, { width: 100, height: 100 })).toEqual({
      x: 0,
      y: 200,
      width: 400,
      height: 400,
    });
    expect(fitRect({ width: 400, height: 300 }, { width: 0, height: 0 })).toEqual({
      x: 0,
      y: 0,
      width: 400,
      height: 300,
    });
  });

  it('converts touches to page-relative coordinates and clamps them', () => {
    expect(toRelative({ x: 50, y: 100 }, { width: 200, height: 400 })).toEqual({
      x: 0.25,
      y: 0.25,
    });
    expect(toRelative({ x: -5, y: 500 }, { width: 200, height: 400 })).toEqual({ x: 0, y: 1 });
  });

  it('builds highlight and underline rectangles from a drag', () => {
    expect(rectFromPoints({ x: 0.5, y: 0.2 }, { x: 0.1, y: 0.3 })).toEqual([
      0.1,
      0.2,
      0.4,
      expect.closeTo(0.1, 5),
    ]);
    expect(underlineRect({ x: 0.5, y: 0.2 }, { x: 0.1, y: 0.3 })[1]).toBe(0.3);
  });

  it('thins out pen strokes but keeps the last point', () => {
    const points = Array.from({ length: 100 }, (_, i) => ({ x: i / 10000, y: 0 }));
    const simple = simplifyStroke(points, 0.002);

    expect(simple.length).toBeLessThan(points.length / 2);
    expect(simple[simple.length - 1]).toBe(points[points.length - 1]);
  });

  it('hit-tests rectangles, strokes and notes for the eraser', () => {
    const rect = mark('r');
    const stroke = mark('s', 1, {
      kind: 'pen',
      data: {
        points: [
          [0.5, 0.5],
          [0.9, 0.5],
        ],
      },
    });
    const note = mark('n', 1, { kind: 'note', data: { x: 0.2, y: 0.8, text: 'x' } });

    expect(hitsAnnotation(rect, { x: 0.2, y: 0.12 }, 0.01)).toBe(true);
    expect(hitsAnnotation(rect, { x: 0.9, y: 0.9 }, 0.01)).toBe(false);
    expect(hitsAnnotation(stroke, { x: 0.7, y: 0.505 }, 0.01)).toBe(true);
    expect(hitsAnnotation(stroke, { x: 0.7, y: 0.6 }, 0.01)).toBe(false);
    expect(hitsAnnotation(note, { x: 0.21, y: 0.81 }, 0.02)).toBe(true);
    expect(
      topmostHit([rect, { ...rect, clientId: 'top' }], { x: 0.2, y: 0.12 }, 0.01)?.clientId,
    ).toBe('top');
  });
});
