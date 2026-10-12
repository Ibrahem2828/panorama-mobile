import NetInfo from '@react-native-community/netinfo';
import { AppState } from 'react-native';

import type { ChatConnectionEnvironment } from './chatWebSocketService';

/** App foreground/background and connectivity signals for the chat socket. */
export const nativeChatConnectionEnvironment: ChatConnectionEnvironment = {
  isForeground: () => AppState.currentState === 'active',

  subscribe({ onForeground, onBackground, onNetworkAvailable }) {
    const appStateSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        onForeground();
      } else if (state === 'background') {
        onBackground();
      }
    });
    let wasOnline: boolean | null = null;
    const unsubscribeNetInfo = NetInfo.addEventListener((state) => {
      const isOnline = state.isConnected === true && state.isInternetReachable !== false;

      // Fire only on an offline -> online transition, not on every connectivity change.
      if (isOnline && wasOnline === false) {
        onNetworkAvailable();
      }

      wasOnline = isOnline;
    });

    return () => {
      appStateSubscription.remove();
      unsubscribeNetInfo();
    };
  },
};
