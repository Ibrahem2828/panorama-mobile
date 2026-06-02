import { StatusBar } from 'expo-status-bar';

import { RootNavigator } from './src/navigation';
import { AppProviders } from './src/providers/AppProviders';
import { configureRtl } from './src/utils/rtl';

configureRtl();

export default function App() {
  return (
    <AppProviders>
      <StatusBar style="dark" />
      <RootNavigator />
    </AppProviders>
  );
}
