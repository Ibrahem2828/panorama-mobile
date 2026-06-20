import { registerApiAuthBridge } from '../../../api/authBridge';
import { useAuthStore } from '../store';

let isRegistered = false;

export function configureApiAuthBridge(): void {
  if (isRegistered) {
    return;
  }

  registerApiAuthBridge({
    getAccessToken: () => useAuthStore.getState().accessToken,
    refreshAccessToken: () => useAuthStore.getState().refreshAccessToken(),
    onSessionExpired: () => {
      void useAuthStore.getState().forceSessionExpired();
    },
  });

  isRegistered = true;
}
