import { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AppTabsNavigator } from './AppTabsNavigator';
import { AuthBootstrapScreen } from '../features/auth/screens/AuthBootstrapScreen';
import { RoleAccessDeniedScreen } from '../features/auth/screens/RoleAccessDeniedScreen';
import { StudentContextLoadingScreen } from '../features/auth/screens/StudentContextLoadingScreen';
import { useAuthStore } from '../features/auth/store';
import { useMemo } from 'react';
import { createNavigationTheme } from './config/navigationTheme';
import { hiddenStackScreenOptions } from './config/screenOptions';
import { navigationRef } from './navigationRef';
import { useStudentAccessGate } from './guards/useStudentAccessGate';
import { useSessionStateCleanup } from './guards/useSessionStateCleanup';
import { PublicNavigator } from './PublicNavigator';
import { RootRoutes } from './routes';
import { StudentSetupNavigator } from './StudentSetupNavigator';
import type { RootStackParamList } from './types';
import { useBrand } from '../theme';

const RootStack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const status = useAuthStore((state) => state.status);
  const isBootstrapping = useAuthStore((state) => state.isBootstrapping);
  const bootstrap = useAuthStore((state) => state.bootstrap);
  const { rootFlow, isResolvingStudentContext } = useStudentAccessGate();
  useSessionStateCleanup();
  const brand = useBrand();
  const navigationTheme = useMemo(() => createNavigationTheme(brand.primary), [brand.primary]);
  const shouldShowBootstrap = status === 'idle' || status === 'bootstrapping' || isBootstrapping;

  useEffect(() => {
    if (status === 'idle') {
      void bootstrap();
    }
  }, [bootstrap, status]);

  if (shouldShowBootstrap) {
    return <AuthBootstrapScreen />;
  }

  if (isResolvingStudentContext) {
    return <StudentContextLoadingScreen />;
  }

  if (rootFlow === 'accessDenied') {
    return <RoleAccessDeniedScreen />;
  }

  return (
    <NavigationContainer ref={navigationRef} theme={navigationTheme}>
      <RootStack.Navigator screenOptions={hiddenStackScreenOptions}>
        {rootFlow === 'app' ? (
          <RootStack.Screen component={AppTabsNavigator} name={RootRoutes.App} />
        ) : rootFlow === 'studentSetup' ? (
          <RootStack.Screen component={StudentSetupNavigator} name={RootRoutes.StudentSetup} />
        ) : (
          <RootStack.Screen component={PublicNavigator} name={RootRoutes.Public} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
