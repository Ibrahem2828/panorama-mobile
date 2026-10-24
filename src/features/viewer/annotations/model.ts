/**
 * Pure model of one document's annotations on this device: the marks, undo/redo, and what still has to reach the server.
 * No React and no network here, so the sync rules are unit tested (see __tests__/model.test.ts).
 */

export type AnnotationKind = 'highlight' | 'underline' | 'pen' | 'note';

/** Geometry in page-relative coordinates (0..1), so a mark is exact at any zoom and on any device. */
export type AnnotationData =
  | { rects: [number, number, number, number][] }
  | { points: [number, number][] }
  | { x: number; y: number; text: string };

export type Annotation = {
  clientId: string;
  page: number;
  kind: AnnotationKind;
  color: string;
  /** 1 = thin, 2 = thick (pen only). */
  width: number;
  data: AnnotationData;
  /** Server version this copy is based on; null until the server has seen it. */
  version: number | null;
  deleted: boolean;
};

type Command = { type: 'add' | 'remove'; id: string };

export type DocumentState = {
  items: Record<string, Annotation>;
  /** Draw order (oldest first). */
  order: string[];
  undoStack: Command[];
  redoStack: Command[];
  /** id -> local change counter at the moment it became dirty (cleared only when that exact change was synced). */
  dirty: Record<string, number>;
  stamp: number;
  /** Last server revision merged into this state. */
  revision: number;
};

export const MAX_HISTORY = 100;

export function emptyState(): DocumentState {
  return { items: {}, order: [], undoStack: [], redoStack: [], dirty: {}, stamp: 0, revision: 0 };
}

function touch(state: DocumentState, id: string): DocumentState {
  const stamp = state.stamp + 1;

  return { ...state, stamp, dirty: { ...state.dirty, [id]: stamp } };
}

function pushUndo(state: DocumentState, command: Command): DocumentState {
  return {
    ...state,
    undoStack: [...state.undoStack, command].slice(-MAX_HISTORY),
    redoStack: [],
  };
}

export function visibleOnPage(state: DocumentState, page: number): Annotation[] {
  const out: Annotation[] = [];

  for (const id of state.order) {
    const item = state.items[id];

    if (item && !item.deleted && item.page === page) {
      out.push(item);
    }
  }

  return out;
}

export function countVisible(state: DocumentState): number {
  return state.order.reduce((sum, id) => sum + (state.items[id]?.deleted ? 0 : 1), 0);
}

export function addAnnotation(state: DocumentState, item: Annotation): DocumentState {
  const next = touch(
    {
      ...state,
      items: { ...state.items, [item.clientId]: { ...item, deleted: false } },
      order: state.order.includes(item.clientId) ? state.order : [...state.order, item.clientId],
    },
    item.clientId,
  );

  return pushUndo(next, { type: 'add', id: item.clientId });
}

export function removeAnnotation(state: DocumentState, id: string): DocumentState {
  const item = state.items[id];

  if (!item || item.deleted) {
    return state;
  }

  const next = touch({ ...state, items: { ...state.items, [id]: { ...item, deleted: true } } }, id);

  return pushUndo(next, { type: 'remove', id });
}

/** Replaces a note's text (or colour) in place; counts as one undoable add of the new state is not needed: it is a plain edit. */
export function editAnnotation(
  state: DocumentState,
  id: string,
  change: Partial<Pick<Annotation, 'color' | 'width' | 'data'>>,
): DocumentState {
  const item = state.items[id];

  if (!item || item.deleted) {
    return state;
  }

  return touch({ ...state, items: { ...state.items, [id]: { ...item, ...change } } }, id);
}

export function canUndo(state: DocumentState): boolean {
  return state.undoStack.length > 0;
}

export function canRedo(state: DocumentState): boolean {
  return state.redoStack.length > 0;
}

function setDeleted(state: DocumentState, id: string, deleted: boolean): DocumentState {
  const item = state.items[id];

  if (!item) {
    return state;
  }

  return touch({ ...state, items: { ...state.items, [id]: { ...item, deleted } } }, id);
}

export function undo(state: DocumentState): DocumentState {
  const command = state.undoStack[state.undoStack.length - 1];

  if (!command) {
    return state;
  }

  // Undoing an add hides the mark; undoing a removal brings it back.
  const next = setDeleted(state, command.id, command.type === 'add');

  return {
    ...next,
    undoStack: state.undoStack.slice(0, -1),
    redoStack: [...state.redoStack, command].slice(-MAX_HISTORY),
  };
}

export function redo(state: DocumentState): DocumentState {
  const command = state.redoStack[state.redoStack.length - 1];

  if (!command) {
    return state;
  }

  const next = setDeleted(state, command.id, command.type === 'remove');

  return {
    ...next,
    redoStack: state.redoStack.slice(0, -1),
    undoStack: [...state.undoStack, command].slice(-MAX_HISTORY),
  };
}

// ---- sync ------------------------------------------------------------------------------------------------------------

export type SyncUpsert = {
  client_id: string;
  page_number: number;
  kind: AnnotationKind;
  color: string;
  width: number;
  data: AnnotationData;
  version?: number;
};

export type SyncPayload = {
  base_revision: number;
  upserts: SyncUpsert[];
  deletes: string[];
};

export type SyncSnapshot = { payload: SyncPayload; sent: Record<string, number> };

export const MAX_OPS_PER_SYNC = 200;

export function hasPendingChanges(state: DocumentState): boolean {
  return Object.keys(state.dirty).length > 0;
}

/** What to send next (at most {@link MAX_OPS_PER_SYNC} changes) plus the change counters it covers. */
export function buildSyncSnapshot(state: DocumentState): SyncSnapshot {
  const upserts: SyncUpsert[] = [];
  const deletes: string[] = [];
  const sent: Record<string, number> = {};

  for (const [id, stamp] of Object.entries(state.dirty)) {
    if (upserts.length + deletes.length >= MAX_OPS_PER_SYNC) {
      break;
    }

    const item = state.items[id];

    if (!item) {
      continue;
    }

    sent[id] = stamp;

    if (item.deleted) {
      // A mark the server never saw and that is already gone needs no round trip.
      if (item.version !== null) {
        deletes.push(id);
      }
    } else {
      upserts.push({
        client_id: id,
        page_number: item.page,
        kind: item.kind,
        color: item.color,
        width: item.width,
        data: item.data,
        ...(item.version !== null ? { version: item.version } : {}),
      });
    }
  }

  return { payload: { base_revision: state.revision, upserts, deletes }, sent };
}

export type ServerItem = {
  client_id: string;
  page_number: number;
  kind: AnnotationKind;
  color: string;
  width: number;
  data: AnnotationData;
  version: number;
  deleted: boolean;
};

export type SyncResponse = {
  revision: number;
  conflicts: ServerItem[];
  changes: ServerItem[];
};

function fromServer(item: ServerItem): Annotation {
  return {
    clientId: item.client_id,
    page: item.page_number,
    kind: item.kind,
    color: item.color,
    width: item.width,
    data: item.data,
    version: item.version,
    deleted: item.deleted,
  };
}

function adopt(state: DocumentState, item: ServerItem): DocumentState {
  return {
    ...state,
    items: { ...state.items, [item.client_id]: fromServer(item) },
    order: state.order.includes(item.client_id) ? state.order : [...state.order, item.client_id],
  };
}

/**
 * Merges the server's answer. Server copies replace local ones (they are the latest agreed state), except for marks that
 * were changed again on this device while the request was in flight: those stay dirty and are sent next time.
 */
export function applySyncResponse(
  state: DocumentState,
  response: SyncResponse,
  snapshot: SyncSnapshot,
): DocumentState {
  let next = state;
  const conflicted = new Set(response.conflicts.map((item) => item.client_id));

  for (const item of [...response.changes, ...response.conflicts]) {
    const changedSince = next.dirty[item.client_id] !== snapshot.sent[item.client_id];
    const locallyEdited = item.client_id in next.dirty && changedSince;

    if (locallyEdited && !conflicted.has(item.client_id)) {
      // Keep the newer local edit, but know the version the server now has so the next upload is not a conflict.
      const local = next.items[item.client_id];

      if (local) {
        next = {
          ...next,
          items: { ...next.items, [item.client_id]: { ...local, version: item.version } },
        };
      }

      continue;
    }

    next = adopt(next, item);
  }

  const dirty = { ...next.dirty };

  for (const [id, stamp] of Object.entries(snapshot.sent)) {
    if (dirty[id] === stamp || conflicted.has(id)) {
      delete dirty[id];
    }
  }

  // Drop history entries that point at marks the server replaced.
  const undoStack = next.undoStack.filter((command) => !conflicted.has(command.id));
  const redoStack = next.redoStack.filter((command) => !conflicted.has(command.id));

  return {
    ...next,
    dirty,
    undoStack,
    redoStack,
    revision: Math.max(next.revision, response.revision),
  };
}

/** First load / refresh: merge the server's marks without touching local unsynced ones. */
export function mergeServerItems(
  state: DocumentState,
  items: readonly ServerItem[],
  revision: number,
): DocumentState {
  let next = state;

  for (const item of items) {
    if (item.client_id in next.dirty) {
      continue;
    }

    next = adopt(next, item);
  }

  return { ...next, revision: Math.max(next.revision, revision) };
}

// ---- persistence -----------------------------------------------------------------------------------------------------

export type PersistedState = Pick<
  DocumentState,
  'items' | 'order' | 'dirty' | 'stamp' | 'revision'
>;

export function toPersisted(state: DocumentState): PersistedState {
  const { items, order, dirty, stamp, revision } = state;

  return { items, order, dirty, stamp, revision };
}

export function fromPersisted(value: unknown): DocumentState {
  if (typeof value !== 'object' || value === null) {
    return emptyState();
  }

  const raw = value as Partial<PersistedState>;

  if (
    typeof raw.items !== 'object' ||
    raw.items === null ||
    !Array.isArray(raw.order) ||
    typeof raw.dirty !== 'object' ||
    raw.dirty === null
  ) {
    return emptyState();
  }

  return {
    ...emptyState(),
    items: raw.items,
    order: raw.order.filter((id): id is string => typeof id === 'string' && id in raw.items!),
    dirty: raw.dirty,
    stamp: typeof raw.stamp === 'number' ? raw.stamp : 0,
    revision: typeof raw.revision === 'number' ? raw.revision : 0,
  };
}
