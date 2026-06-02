import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ChatRoomScreen } from '../../features/chat/screens/ChatRoomScreen';
import { AvailableGroupsScreen } from '../../features/groups/screens/AvailableGroupsScreen';
import { GroupDetailsScreen } from '../../features/groups/screens/GroupDetailsScreen';
import { GroupsOverviewScreen } from '../../features/groups/screens/GroupsOverviewScreen';
import { MyGroupsScreen } from '../../features/groups/screens/MyGroupsScreen';
import { hiddenStackScreenOptions } from '../config/screenOptions';
import { GroupsRoutes } from '../routes';
import type { GroupsStackParamList } from '../types';

const Stack = createNativeStackNavigator<GroupsStackParamList>();

export function GroupsStackNavigator() {
  return (
    <Stack.Navigator
      initialRouteName={GroupsRoutes.GroupsOverview}
      screenOptions={hiddenStackScreenOptions}
    >
      <Stack.Screen component={GroupsOverviewScreen} name={GroupsRoutes.GroupsOverview} />
      <Stack.Screen component={AvailableGroupsScreen} name={GroupsRoutes.AvailableGroups} />
      <Stack.Screen component={MyGroupsScreen} name={GroupsRoutes.MyGroups} />
      <Stack.Screen component={GroupDetailsScreen} name={GroupsRoutes.GroupDetails} />
      <Stack.Screen component={ChatRoomScreen} name={GroupsRoutes.ChatRoom} />
    </Stack.Navigator>
  );
}
