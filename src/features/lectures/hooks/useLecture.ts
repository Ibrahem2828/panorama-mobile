import { useCallback, useEffect, useState } from 'react';

import { lectureErrorKind, type LectureErrorKind } from '../logic';
import { fetchLecture } from '../services/lecturesService';
import { useLecturesStore } from '../store';
import type { Lecture, LectureId } from '../types';

type LectureState = {
  lecture: Lecture | null;
  isLoading: boolean;
  errorKind: LectureErrorKind | null;
  reload: () => void;
  /** Replaces the loaded lecture (e.g. after processing finished). */
  setLecture: (lecture: Lecture) => void;
};

/** Loads one lecture. The shared list is only used to paint the header instantly while the detail loads. */
export function useLecture(lectureId: LectureId): LectureState {
  const cached = useLecturesStore((state) =>
    state.lectures.find((item) => String(item.id) === String(lectureId)),
  );
  const [lecture, setLecture] = useState<Lecture | null>(null);
  const [errorKind, setErrorKind] = useState<LectureErrorKind | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setErrorKind(null);
    fetchLecture(lectureId).then(
      (result) => {
        if (cancelled) return;
        setLecture(result);
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
  }, [lectureId, attempt]);

  const reload = useCallback(() => setAttempt((value) => value + 1), []);

  return {
    lecture: lecture ?? (errorKind ? null : (cached ?? null)),
    isLoading: isLoading && !lecture,
    errorKind,
    reload,
    setLecture,
  };
}
