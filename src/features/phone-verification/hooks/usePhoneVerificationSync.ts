import { useEffect } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { AppState } from 'react-native';

import { isOpenStatus, PHONE_POLL_INTERVAL_MS } from '../services/phoneVerificationLogic';
import { usePhoneVerificationStore } from '../store/phoneVerificationStore';

/**
 * Keeps the status fresh while the screen is open: on focus, when the app comes back to the foreground, and on a light
 * timer while a request is open (staff send the code from the dashboard, so the status changes without the student doing
 * anything). A push (`kind = phone_verification`) triggers the same refresh from the notification listener.
 */
export function usePhoneVerificationSync(): void {
  const focused = useIsFocused();
  const open = usePhoneVerificationStore((state) => isOpenStatus(state.request?.status));

  useEffect(() => {
    if (!focused) return undefined;

    void usePhoneVerificationStore.getState().load({ silent: true });

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void usePhoneVerificationStore.getState().load({ silent: true });
    });

    return () => subscription.remove();
  }, [focused]);

  useEffect(() => {
    if (!focused || !open) return undefined;

    const timer = setInterval(() => {
      if (AppState.currentState === 'active') {
        void usePhoneVerificationStore.getState().load({ silent: true });
      }
    }, PHONE_POLL_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [focused, open]);
}
