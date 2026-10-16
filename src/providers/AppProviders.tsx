import { useEffect, type ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { NetworkStatusBanner } from '../features/connectivity';
import { FeedbackProvider } from '../features/feedback';
import { LifecycleGate } from '../features/lifecycle';
import { PushNotificationsProvider } from '../features/notifications';
import { BrandSync } from '../features/student-profile';
import { useLocaleStore } from '../i18n';

type AppProvidersProps = { children: ReactNode };

export function AppProviders({ children }: AppProvidersProps) {
  const hydrateLocale = useLocaleStore((state) => state.hydrate);

  useEffect(() => {
    void hydrateLocale();
  }, [hydrateLocale]);

  return (
    <SafeAreaProvider>
      <FeedbackProvider>
        <BrandSync />
        <NetworkStatusBanner />
        {children}
        <LifecycleGate />
        <PushNotificationsProvider />
      </FeedbackProvider>
    </SafeAreaProvider>
  );
}
