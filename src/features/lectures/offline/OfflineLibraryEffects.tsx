import { useEffect } from 'react';
import { AppState } from 'react-native';

import { useNetworkStore } from '../../../offline/networkStore';
import { useAuthStore } from '../../auth/store';
import { startOfflineLectures } from './lifecycle';

/**
 * Headless: keeps the offline library honest. At start, whenever the app returns to the foreground and whenever the connection
 * comes back it asks the server about the local licenses (purge / renew / keep). It also moves the monotonic clock mark forward
 * on every foreground, online or not, which is what makes a rolled-back clock detectable offline.
 */
export function OfflineLibraryEffects() {
  const userId = useAuthStore((state) => state.user?.id);
  const reconnects = useNetworkStore((state) => state.reconnects);

  useEffect(() => {
    if (userId === undefined || userId === null) {
      return undefined;
    }

    const run = () => {
      void import('./offlineLibrary').then(async (library) => {
        await library.initOfflineLibrary(String(userId));
        await library.touchOfflineClock();
        await library.syncOfflineLibrary();
      });
    };

    startOfflineLectures(userId);
    run();

    const subscription = AppState.addEventListener('change', (status) => {
      if (status === 'active') {
        run();
      }
    });

    return () => subscription.remove();
  }, [userId]);

  useEffect(() => {
    if (userId !== undefined && userId !== null && reconnects > 0) {
      void import('./offlineLibrary').then((library) =>
        library.syncOfflineLibrary({ force: true }),
      );
    }
  }, [reconnects, userId]);

  return null;
}
