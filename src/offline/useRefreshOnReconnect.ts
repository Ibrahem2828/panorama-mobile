import { useEffect, useRef } from 'react';

import { useNetworkStore } from './networkStore';

/** Runs `refresh` each time the device comes back online (not on mount), so screens that showed saved data update by themselves. */
export function useRefreshOnReconnect(refresh: () => void): void {
  const reconnects = useNetworkStore((state) => state.reconnects);
  const latest = useRef(refresh);
  const seen = useRef(reconnects);

  latest.current = refresh;

  useEffect(() => {
    if (reconnects !== seen.current) {
      seen.current = reconnects;
      latest.current();
    }
  }, [reconnects]);
}
