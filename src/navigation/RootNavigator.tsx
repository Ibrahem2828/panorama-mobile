import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AppTabsNavigator } from './AppTabsNavigator';
import { INITIAL_ROOT_FLOW, getInitialRootRoute } from './config/initialFlow';
import { navigationTheme } from './config/navigationTheme';
import { hiddenStackScreenOptions } from './config/screenOptions';
import { PublicNavigator } from './PublicNavigator';
import { RootRoutes } from './routes';
import { StudentSetupNavigator } from './StudentSetupNavigator';
import type { RootStackParamList } from './types';

const RootStack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <NavigationContainer theme={navigationTheme}>
      <RootStack.Navigator
        initialRouteName={getInitialRootRoute(INITIAL_ROOT_FLOW)}
        screenOptions={hiddenStackScreenOptions}
      >
        <RootStack.Screen component={PublicNavigator} name={RootRoutes.Public} />
        <RootStack.Screen component={StudentSetupNavigator} name={RootRoutes.StudentSetup} />
        <RootStack.Screen component={AppTabsNavigator} name={RootRoutes.App} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
