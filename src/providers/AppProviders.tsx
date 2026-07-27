import type { ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { NetworkStatusBanner } from '../features/connectivity';
import { FeedbackProvider } from '../features/feedback';
import { PushNotificationsProvider } from '../features/notifications';

type AppProvidersProps = { children: ReactNode };

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <SafeAreaProvider>
      <FeedbackProvider>
        <NetworkStatusBanner />
        {children}
        <PushNotificationsProvider />
      </FeedbackProvider>
    </SafeAreaProvider>
  );
}
