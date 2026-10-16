import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { assertClientEnvForRelease } from './src/config/env';
import { configureApiAuthBridge } from './src/features/auth/services/apiAuthBridge';
import { RootNavigator } from './src/navigation';
import { AppProviders } from './src/providers/AppProviders';
import { RootErrorBoundary } from './src/providers/RootErrorBoundary';
import { initMonitoring } from './src/services/monitoring';
import { fontFiles, useBrandStore } from './src/theme';
import { configureRtl } from './src/utils/rtl';

void SplashScreen.preventAutoHideAsync().catch(() => undefined);
initMonitoring();
configureRtl();
configureApiAuthBridge();

export default function App() {
  return (
    <RootErrorBoundary>
      <AppRoot />
    </RootErrorBoundary>
  );
}

/**
 * The environment assertion runs here, during render, rather than at module scope:
 * a throw while the module is still evaluating happens before React mounts, so no
 * boundary can catch it and a misconfigured build shows a blank screen instead of
 * the reason it refused to start.
 */
function AppRoot() {
  assertClientEnvForRelease();
  const [fontsReady, fontError] = useFonts(fontFiles);
  const hydrateBrand = useBrandStore((state) => state.hydrate);
  const ready = fontsReady || fontError !== null;

  useEffect(() => {
    void hydrateBrand();
  }, [hydrateBrand]);

  useEffect(() => {
    if (ready) {
      void SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [ready]);

  if (!ready) {
    return null;
  }

  return (
    <AppProviders>
      <StatusBar style="dark" />
      <RootNavigator />
    </AppProviders>
  );
}
