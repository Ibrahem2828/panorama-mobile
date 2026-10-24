import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { generateIdempotencyKey } from '../../../api/idempotency';
import { useAuthStore } from '../../auth/store';
import { docKey, type DocRef } from '../types';
import { fetchAnnotations, syncAnnotations } from './annotationsService';
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
  type DocumentState,
} from './model';

const SYNC_DELAY_MS = 1500;
const MAX_ANNOTATIONS = 5000;

export type AnnotationsApi = {
  /** Marks of one page in draw order. */
  forPage: (page: number) => Annotation[];
  add: (item: Omit<Annotation, 'clientId' | 'version' | 'deleted'>) => string | null;
  remove: (clientId: string) => void;
  edit: (clientId: string, change: Partial<Pick<Annotation, 'color' | 'width' | 'data'>>) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  /** Changes made here that have not reached the server yet. */
  pending: boolean;
  /** The server refused the last upload for a reason other than being offline (e.g. the limit). */
  syncError: boolean;
  total: number;
  /** Bumps whenever marks change, so layers can re-render cheaply. */
  version: number;
};

function storageKey(userId: string | number | undefined, doc: DocRef): string {
  return `panorama.annotations.v1.${userId ?? 'anon'}.${docKey(doc)}`;
}

/**
 * The student's own marks on one document: kept in memory and in AsyncStorage (so work survives the app being closed
 * offline), uploaded in the background a moment after the last change, merged with what other devices drew.
 */
export function useAnnotations(doc: DocRef): AnnotationsApi {
  const userId = useAuthStore((state) => state.user?.id);
  const key = storageKey(userId, doc);
  const stateRef = useRef<DocumentState>(emptyState());
  const [, setTick] = useState(0);
  const [syncError, setSyncError] = useState(false);
  const inFlight = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loaded = useRef(false);
  const docRef = useRef(doc);

  docRef.current = doc;

  const rerender = useCallback(() => setTick((value) => value + 1), []);

  const persist = useCallback(() => {
    void AsyncStorage.setItem(key, JSON.stringify(toPersisted(stateRef.current))).catch(
      () => undefined,
    );
  }, [key]);

  const flush = useCallback(async () => {
    if (inFlight.current || !loaded.current || !hasPendingChanges(stateRef.current)) {
      return;
    }

    inFlight.current = true;

    try {
      // Several rounds when a lot was drawn offline (200 changes per request).
      for (let round = 0; round < 10 && hasPendingChanges(stateRef.current); round += 1) {
        const snapshot = buildSyncSnapshot(stateRef.current);

        if (snapshot.payload.upserts.length + snapshot.payload.deletes.length === 0) {
          stateRef.current = applySyncResponse(
            stateRef.current,
            { revision: stateRef.current.revision, conflicts: [], changes: [] },
            snapshot,
          );
          continue;
        }

        const response = await syncAnnotations(docRef.current, snapshot.payload);

        stateRef.current = applySyncResponse(stateRef.current, response, snapshot);
        setSyncError(false);
        rerender();
      }
    } catch {
      // Offline or refused: the changes stay queued (and saved on the device) and are retried later.
      setSyncError(true);
    } finally {
      inFlight.current = false;
      persist();
    }
  }, [persist, rerender]);

  const schedule = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
    }

    timer.current = setTimeout(() => void flush(), SYNC_DELAY_MS);
  }, [flush]);

  // Load what is saved on the device, then what the server has.
  useEffect(() => {
    let cancelled = false;

    loaded.current = false;
    stateRef.current = emptyState();

    void (async () => {
      try {
        const saved = await AsyncStorage.getItem(key);

        if (saved && !cancelled) {
          stateRef.current = fromPersisted(JSON.parse(saved));
          rerender();
        }
      } catch {
        // A damaged local copy is simply ignored; the server copy follows.
      }

      try {
        const remote = await fetchAnnotations(docRef.current, stateRef.current.revision);

        if (!cancelled) {
          stateRef.current = mergeServerItems(stateRef.current, remote.items, remote.revision);
          rerender();
        }
      } catch {
        // Offline: keep working with the local copy.
      }

      if (!cancelled) {
        loaded.current = true;
        persist();
        void flush();
      }
    })();

    return () => {
      cancelled = true;

      if (timer.current) {
        clearTimeout(timer.current);
      }

      void flush();
    };
  }, [key, flush, persist, rerender]);

  // Push pending work before the app goes to the background.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next) => {
      if (next !== 'active') {
        persist();
        void flush();
      }
    });

    return () => subscription.remove();
  }, [flush, persist]);

  const commit = useCallback(
    (next: DocumentState) => {
      stateRef.current = next;
      rerender();
      persist();
      schedule();
    },
    [persist, rerender, schedule],
  );

  return useMemo<AnnotationsApi>(() => {
    const state = stateRef.current;

    return {
      forPage: (page) => visibleOnPage(stateRef.current, page),
      add: (item) => {
        if (countVisible(stateRef.current) >= MAX_ANNOTATIONS) {
          return null;
        }

        const clientId = generateIdempotencyKey();

        commit(
          addAnnotation(stateRef.current, { ...item, clientId, version: null, deleted: false }),
        );

        return clientId;
      },
      remove: (clientId) => commit(removeAnnotation(stateRef.current, clientId)),
      edit: (clientId, change) => commit(editAnnotation(stateRef.current, clientId, change)),
      undo: () => commit(undo(stateRef.current)),
      redo: () => commit(redo(stateRef.current)),
      canUndo: canUndo(state),
      canRedo: canRedo(state),
      pending: hasPendingChanges(state),
      syncError,
      total: countVisible(state),
      version: state.stamp + state.revision,
    };
    // `state` is read from the ref on purpose: every commit re-renders, and the memo key below changes with it.
  }, [commit, syncError, stateRef.current]);
}
