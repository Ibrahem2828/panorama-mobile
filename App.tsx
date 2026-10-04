import { StatusBar } from 'expo-status-bar';

import { assertClientEnvForRelease } from './src/config/env';
import { configureApiAuthBridge } from './src/features/auth/services/apiAuthBridge';
import { RootNavigator } from './src/navigation';
import { AppProviders } from './src/providers/AppProviders';
import { RootErrorBoundary } from './src/providers/RootErrorBoundary';
import { initMonitoring } from './src/services/monitoring';
import { configureRtl } from './src/utils/rtl';

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

  return (
    <AppProviders>
      <StatusBar style="dark" />
      <RootNavigator />
    </AppProviders>
  );
}
