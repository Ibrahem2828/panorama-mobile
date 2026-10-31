import { useEffect, useState } from 'react';

import { msUntilExpiry, type ChatMutePref } from '../logic/mute';

/** setTimeout cannot wait longer than this (a signed 32-bit number of milliseconds). */
const MAX_TIMEOUT_MS = 2_147_483_647;

/**
 * The current time, refreshed once when a timed mute ends so the bell, the row and the sheet flip to "unmuted" on their own
 * instead of waiting for the next server answer.
 */
export function useMuteNow(pref: ChatMutePref | null | undefined): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const current = Date.now();
    const wait = msUntilExpiry(pref, current);

    setNow(current);

    if (wait === null) {
      return undefined;
    }

    const timer = setTimeout(() => setNow(Date.now() + 1), Math.min(wait + 50, MAX_TIMEOUT_MS));

    return () => clearTimeout(timer);
  }, [pref]);

  return now;
}
