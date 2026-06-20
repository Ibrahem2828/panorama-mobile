import { StatusBar } from 'expo-status-bar';

import { assertClientEnvForRelease } from './src/config/env';
import { configureApiAuthBridge } from './src/features/auth/services/apiAuthBridge';
import { RootNavigator } from './src/navigation';
import { AppProviders } from './src/providers/AppProviders';
import { configureRtl } from './src/utils/rtl';

configureRtl();
configureApiAuthBridge();
assertClientEnvForRelease();

export default function App() {
  return (
    <AppProviders>
      <StatusBar style="dark" />
      <RootNavigator />
    </AppProviders>
  );
}
