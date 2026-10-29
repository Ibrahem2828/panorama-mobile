import { useEffect, type ReactNode } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { env } from '../config/env';
import { NetworkStatusBanner } from '../features/connectivity';
import { FeedbackProvider } from '../features/feedback';
import { LifecycleGate } from '../features/lifecycle';
import { PushNotificationsProvider } from '../features/notifications';
import { BrandSync } from '../features/student-profile';
import { useLocaleStore } from '../i18n';
import { useBrandStore } from '../theme';
import { useSecureScreen } from '../hooks/useSecureScreen';
import { OverlayHost } from '../components/overlay';
import { ToastHost } from '../components/feedback/ToastHost';

type AppProvidersProps = { children: ReactNode };

// NetInfo decides "internet reachable" by probing a test address. Point it at our own server instead of a Google address,
// which is blocked or slow on some networks and would make the app believe it is offline.
NetInfo.configure({
  reachabilityUrl: `${env.apiBaseUrl}/api/v1/health/`,
  reachabilityMethod: 'GET',
  reachabilityTest: async (response) => response.status >= 200 && response.status < 500,
  reachabilityLongTimeout: 30 * 1000,
  reachabilityShortTimeout: 10 * 1000,
  reachabilityRequestTimeout: 15 * 1000,
});

export function AppProviders({ children }: AppProvidersProps) {
  const hydrateLocale = useLocaleStore((state) => state.hydrate);
  const hydrateBrand = useBrandStore((state) => state.hydrate);

  // Every screen of the app is protected from screenshots and screen recording (see useSecureScreen).
  useSecureScreen('app');

  useEffect(() => {
    void hydrateLocale();
    // The last signed-in faculty, so a cold start already shows its logo and colours while the session restores.
    void hydrateBrand();
  }, [hydrateBrand, hydrateLocale]);

  return (
    <SafeAreaProvider>
      <FeedbackProvider>
        <BrandSync />
        <NetworkStatusBanner />
        {children}
        <LifecycleGate />
        <PushNotificationsProvider />
        <OverlayHost />
        <ToastHost />
      </FeedbackProvider>
    </SafeAreaProvider>
  );
}
