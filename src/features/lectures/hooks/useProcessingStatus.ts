import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { isTerminalStatus, lectureErrorKind, pollDelayMs, type LectureErrorKind } from '../logic';
import { fetchProcessingStatus } from '../services/lecturesService';
import type { DocRef } from '../../viewer/types';
import type { LectureId, ProcessingStatus } from '../types';

type ProcessingState = {
  status: ProcessingStatus | null;
  errorKind: LectureErrorKind | null;
  isChecking: boolean;
  checkNow: () => void;
};

/**
 * Polls `processing-status` with exponential backoff while the lecture is not terminal. Polling pauses while the app is
 * in the background and resumes (with an immediate check) when it comes back.
 */
export function useProcessingStatus(
  lectureId: LectureId | DocRef,
  enabled: boolean,
  onTerminal?: (status: ProcessingStatus) => void,
): ProcessingState {
  const [status, setStatus] = useState<ProcessingStatus | null>(null);
  const [errorKind, setErrorKind] = useState<LectureErrorKind | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [manual, setManual] = useState(0);
  const onTerminalRef = useRef(onTerminal);

  useEffect(() => {
    onTerminalRef.current = onTerminal;
  });

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let attempt = 0;

    const clear = () => {
      if (timer) clearTimeout(timer);
      timer = null;
    };

    const tick = async () => {
      clear();
      if (cancelled) return;
      setIsChecking(true);
      try {
        const next = await fetchProcessingStatus(lectureId);
        if (cancelled) return;
        setStatus(next);
        setErrorKind(null);
        if (isTerminalStatus(next.status)) {
          setIsChecking(false);
          onTerminalRef.current?.(next);
          return;
        }
      } catch (error) {
        if (cancelled) return;
        setErrorKind(lectureErrorKind(error));
      }
      setIsChecking(false);
      attempt += 1;
      if (AppState.currentState === 'active') {
        timer = setTimeout(() => void tick(), pollDelayMs(attempt));
      }
    };

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        attempt = 0;
        void tick();
      } else {
        clear();
      }
    });

    void tick();
    return () => {
      cancelled = true;
      clear();
      subscription.remove();
    };
  }, [lectureId, enabled, manual]);

  const checkNow = useCallback(() => setManual((value) => value + 1), []);

  return { status, errorKind, isChecking, checkNow };
}
