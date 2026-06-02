import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { HomeScreen } from '../../features/home/screens/HomeScreen';
import { hiddenStackScreenOptions } from '../config/screenOptions';
import { HomeRoutes } from '../routes';
import type { HomeStackParamList } from '../types';

const Stack = createNativeStackNavigator<HomeStackParamList>();

export function HomeStackNavigator() {
  return (
    <Stack.Navigator initialRouteName={HomeRoutes.Home} screenOptions={hiddenStackScreenOptions}>
      <Stack.Screen component={HomeScreen} name={HomeRoutes.Home} />
    </Stack.Navigator>
  );
}
