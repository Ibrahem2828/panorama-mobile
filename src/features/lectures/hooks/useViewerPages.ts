import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { asDocRef, docKey, type DocRef } from '../../viewer/types';

import { lectureErrorKind, type LectureErrorKind } from '../logic';
import { ViewerSessionManager } from '../sessionManager';
import {
  buildPageImageSource,
  createViewerSession,
  fetchPageText,
  fetchProcessingStatus,
} from '../services/lecturesService';
import type { LectureId, PageKind, PageText, ViewerImageSource } from '../types';

const MAX_CACHED_SOURCES = 200;

export type ViewerPages = {
  /** True once a viewer session exists and image sources can be built. */
  ready: boolean;
  sessionError: LectureErrorKind | null;
  /** Source for the native `Image` (null while the session is being issued or renewed). Counts one request per source. */
  getSource: (kind: PageKind, page: number) => ViewerImageSource | null;
  /** Key that changes whenever the source for `kind`/`page` must be re-requested. */
  sourceKey: (kind: PageKind, page: number) => string;
  /**
   * The page image failed to load (the native loader reports no status). Probes the API (which also refreshes an
   * expired access token), renews an old session and retries once. Returns null while retrying, otherwise the error
   * to show.
   */
  onPageImageError: (page: number) => Promise<LectureErrorKind | null>;
  /** Manual retry of a page (or of the session when it could not start). */
  retry: (page: number) => void;
  loadText: (page: number) => Promise<PageText>;
};

/**
 * Viewer session + image sources for one lecture. Pages are streamed by the native image loader with the
 * `X-Viewer-Session` header, so nothing is ever written to shared storage by the app.
 */
export function useViewerPages(target: LectureId | DocRef, page: number): ViewerPages {
  const key = docKey(asDocRef(target));
  const lectureId = useMemo(() => asDocRef(target), [key]);
  const managerRef = useRef<ViewerSessionManager | null>(null);
  if (managerRef.current === null) {
    managerRef.current = new ViewerSessionManager({
      createSession: () => createViewerSession(lectureId),
      now: () => Date.now(),
    });
  }
  const manager = managerRef.current;
  const [token, setToken] = useState<string | null>(null);
  const [sessionError, setSessionError] = useState<LectureErrorKind | null>(null);
  const [sessionAttempt, setSessionAttempt] = useState(0);
  const epochRef = useRef(0);
  const [, forceRender] = useState(0);
  const cacheRef = useRef(new Map<string, ViewerImageSource>());
  const autoRetried = useRef(new Set<number>());

  // Make sure a valid session exists before the current page is requested (renews it before expiry/exhaustion).
  useEffect(() => {
    let cancelled = false;
    manager.ensure().then(
      (session) => {
        if (cancelled) return;
        setSessionError(null);
        setToken(session.token);
      },
      (error: unknown) => {
        if (cancelled) return;
        setSessionError(lectureErrorKind(error));
      },
    );
    return () => {
      cancelled = true;
    };
  }, [manager, page, sessionAttempt]);

  useEffect(() => {
    const cache = cacheRef.current;
    return () => {
      manager.reset();
      cache.clear();
    };
  }, [manager]);

  const sourceKey = useCallback(
    (kind: PageKind, target: number) =>
      `${kind}:${target}:${manager.current?.token ?? 'none'}:${epochRef.current}`,
    [manager],
  );

  const getSource = useCallback<ViewerPages['getSource']>(
    (kind, target) => {
      const current = manager.current;
      if (!current) return null;
      const cache = cacheRef.current;
      const key = sourceKey(kind, target);
      const cached = cache.get(key);
      if (cached) return cached;
      if (manager.needsRenewal()) return null;
      manager.consume();
      if (cache.size >= MAX_CACHED_SOURCES) cache.clear();
      const source = buildPageImageSource(lectureId, kind, target, current.token);
      cache.set(key, source);
      return source;
    },
    [lectureId, manager, sourceKey],
  );

  const onPageImageError = useCallback<ViewerPages['onPageImageError']>(
    async (target) => {
      if (autoRetried.current.has(target)) return 'unknown';
      autoRetried.current.add(target);
      const failedToken = manager.current?.token;
      try {
        await fetchProcessingStatus(lectureId);
      } catch (error) {
        return lectureErrorKind(error);
      }
      try {
        const renewed = failedToken ? await manager.renewAfterFailure(failedToken) : false;
        if (!renewed) {
          // A fresh session / valid token: only the access token may have been refreshed by the probe above.
          epochRef.current += 1;
          forceRender((value) => value + 1);
          return null;
        }
        setToken(manager.current?.token ?? null);
      } catch (error) {
        return lectureErrorKind(error);
      }
      epochRef.current += 1;
      forceRender((value) => value + 1);
      return null;
    },
    [lectureId, manager],
  );

  const retry = useCallback(
    (target: number) => {
      autoRetried.current.delete(target);
      epochRef.current += 1;
      forceRender((value) => value + 1);
      if (!manager.current) setSessionAttempt((value) => value + 1);
    },
    [manager],
  );

  const loadText = useCallback(
    (target: number) =>
      manager.run('text', (viewerToken) => fetchPageText(lectureId, target, viewerToken)),
    [lectureId, manager],
  );

  return {
    ready: token !== null && manager.current !== null,
    sessionError,
    getSource,
    sourceKey,
    onPageImageError,
    retry,
    loadText,
  };
}
