import { useCallback, useEffect, useState } from 'react';

/** Counts down once per second from `seconds`; `restart` begins again (after a resend). */
export function useResendCountdown(seconds: number) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    if (remaining <= 0) return undefined;
    const timer = setInterval(() => setRemaining((value) => Math.max(0, value - 1)), 1000);
    return () => clearInterval(timer);
  }, [remaining <= 0]);

  const restart = useCallback(() => setRemaining(seconds), [seconds]);

  return { remaining, restart };
}

/** 75 -> "1:15", 9 -> "0:09". */
export function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
