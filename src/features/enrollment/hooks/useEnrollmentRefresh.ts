import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { AppState } from 'react-native';

import type { EnrollmentRecord } from '../../../api/services/enrollment.service';
import { ENROLLMENT_POLL_MS, shouldPollEnrollment } from '../logic';
import { useEnrollmentSignalStore } from '../store/enrollmentSignalStore';

/**
 * Keeps a screen's data current without the student doing anything: `refresh` runs when the screen gains focus, when the app
 * returns to the foreground, when an enrollment push arrives, and every ENROLLMENT_POLL_MS while a request is pending (the timer
 * is torn down on blur, in the background and once it is decided).
 */
export function useEnrollmentRefresh(
  refresh: () => void,
  input: { latest: EnrollmentRecord | null; starting: boolean },
): void {
  const latest = useRef(refresh);
  const [focused, setFocused] = useState(false);
  const [appActive, setAppActive] = useState(AppState.currentState === 'active');
  const signal = useEnrollmentSignalStore((state) => state.version);
  const seenSignal = useRef(signal);

  latest.current = refresh;

  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      latest.current();

      return () => setFocused(false);
    }, []),
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      const active = state === 'active';

      setAppActive(active);

      if (active) latest.current();
    });

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (signal !== seenSignal.current) {
      seenSignal.current = signal;
      latest.current();
    }
  }, [signal]);

  const poll = shouldPollEnrollment({
    latest: input.latest,
    starting: input.starting,
    focused,
    appActive,
  });

  useEffect(() => {
    if (!poll) return undefined;

    const timer = setInterval(() => latest.current(), ENROLLMENT_POLL_MS);

    return () => clearInterval(timer);
  }, [poll]);
}
