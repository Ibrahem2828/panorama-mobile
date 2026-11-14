import { useMemo } from 'react';

import { useNetworkStore } from '../../../offline/networkStore';
import { deriveItemState, keyOf, type ItemState, type TransferState } from './licenseLogic';
import { useOfflineLibrary } from './offlineLibrary';

const IDLE: TransferState = { kind: 'idle' };

/** Offline state of one lecture for buttons and rows (re-evaluated whenever the inventory, a transfer or the clock mark changes). */
export function useOfflineItem(lectureId: number): {
  state: ItemState;
  isOnline: boolean;
  ready: boolean;
} {
  const key = keyOf(lectureId);
  const entry = useOfflineLibrary((library) => library.entries[key]);
  const transfer = useOfflineLibrary((library) => library.transfers[key]) ?? IDLE;
  const guard = useOfflineLibrary((library) => library.guard);
  const ready = useOfflineLibrary((library) => library.ready);
  const isOnline = useNetworkStore((network) => network.isOnline);
  const state = useMemo(
    () => deriveItemState(entry, transfer, Date.now(), guard),
    [entry, transfer, guard],
  );

  return { state, isOnline, ready };
}
