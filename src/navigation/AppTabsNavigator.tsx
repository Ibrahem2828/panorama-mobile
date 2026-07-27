import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { useAuthStore } from '../features/auth/store';
import { bottomTabScreenOptions, tabLabels } from './config/tabOptions';
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
    <Tabs.Navigator initialRouteName={TabRoutes.Home} screenOptions={bottomTabScreenOptions}>
      <Tabs.Screen
        component={HomeStackNavigator}
        name={TabRoutes.Home}
        options={{ tabBarLabel: tabLabels[TabRoutes.Home] }}
      />
      {isStudent ? (
        <>
          <Tabs.Screen
            component={SubjectsStackNavigator}
            name={TabRoutes.Subjects}
            options={{ tabBarLabel: tabLabels[TabRoutes.Subjects] }}
          />
          <Tabs.Screen
            component={GroupsStackNavigator}
            name={TabRoutes.Groups}
            options={{ tabBarLabel: tabLabels[TabRoutes.Groups] }}
          />
        </>
      ) : null}
      <Tabs.Screen
        component={PrintingStackNavigator}
        name={TabRoutes.Printing}
        options={{ tabBarLabel: tabLabels[TabRoutes.Printing] }}
      />
      <Tabs.Screen
        component={ProfileStackNavigator}
        name={TabRoutes.Profile}
        options={{ tabBarLabel: tabLabels[TabRoutes.Profile] }}
      />
    </Tabs.Navigator>
  );
}
