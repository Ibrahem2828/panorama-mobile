import { useEffect } from 'react';
import { AppState } from 'react-native';

import { useAuthStore } from '../../auth/store';
import { useStoreStore } from '../store';

/**
 * Keeps the cart badge and the order screens fresh without belonging to any one screen: loads the cart and the chosen
 * currency once the student is in, and again (with a signal to the open order screens) whenever the app returns to the
 * foreground, which is how a status change reaches a phone that never received the push.
 */
export function StoreEffects() {
  const status = useAuthStore((state) => state.status);
  const accessToken = useAuthStore((state) => state.accessToken);

  useEffect(() => {
    if (status !== 'authenticated' || !accessToken) return undefined;

    const store = useStoreStore.getState();
    void store.loadCurrency();
    void store.loadCart({ silent: true });

    const subscription = AppState.addEventListener('change', (next) => {
      if (next !== 'active') return;
      const current = useStoreStore.getState();
      void current.loadCart({ silent: true });
      current.bumpOrders();
    });

    return () => subscription.remove();
  }, [accessToken, status]);

  return null;
}
