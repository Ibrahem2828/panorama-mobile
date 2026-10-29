import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { useAuthStore } from '../features/auth/store';
import { TermConfirmationGate } from '../features/academic-term';
import { PolicyGate } from '../features/policies';
import { AppTabBar } from './AppTabBar';
import { bottomTabScreenOptions } from './config/tabOptions';
import { GroupsStackNavigator } from './stacks/GroupsStackNavigator';
import { HomeStackNavigator } from './stacks/HomeStackNavigator';
import { PrintingStackNavigator } from './stacks/PrintingStackNavigator';
import { ProfileStackNavigator } from './stacks/ProfileStackNavigator';
import { SubjectsStackNavigator } from './stacks/SubjectsStackNavigator';
import { TabRoutes } from './routes';
import type { AppTabsParamList } from './types';

const Tabs = createBottomTabNavigator<AppTabsParamList>();

export function AppTabsNavigator() {
  const role = useAuthStore((state) => state.user?.role?.toLowerCase());
  const isStudent = role === 'student';

  return (
    <>
      <Tabs.Navigator
        initialRouteName={TabRoutes.Home}
        screenOptions={bottomTabScreenOptions}
        tabBar={(props) => <AppTabBar {...props} />}
      >
        <Tabs.Screen component={HomeStackNavigator} name={TabRoutes.Home} />
        {isStudent ? (
          <>
            <Tabs.Screen component={SubjectsStackNavigator} name={TabRoutes.Subjects} />
            <Tabs.Screen component={GroupsStackNavigator} name={TabRoutes.Groups} />
          </>
        ) : null}
        <Tabs.Screen component={PrintingStackNavigator} name={TabRoutes.Printing} />
        <Tabs.Screen component={ProfileStackNavigator} name={TabRoutes.Profile} />
      </Tabs.Navigator>
      <PolicyGate />
      <TermConfirmationGate />
    </>
  );
}
