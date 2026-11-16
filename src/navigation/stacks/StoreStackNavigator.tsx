import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { StoreCartScreen } from '../../features/store/screens/StoreCartScreen';
import { StoreHomeScreen } from '../../features/store/screens/StoreHomeScreen';
import { StoreOrderDetailsScreen } from '../../features/store/screens/StoreOrderDetailsScreen';
import { StoreOrderSuccessScreen } from '../../features/store/screens/StoreOrderSuccessScreen';
import { StoreOrdersScreen } from '../../features/store/screens/StoreOrdersScreen';
import { StoreProductScreen } from '../../features/store/screens/StoreProductScreen';
import { hiddenStackScreenOptions } from '../config/screenOptions';
import { StoreRoutes } from '../routes';
import type { StoreStackParamList } from '../types';

const Stack = createNativeStackNavigator<StoreStackParamList>();

export function StoreStackNavigator() {
  return (
    <Stack.Navigator
      initialRouteName={StoreRoutes.StoreHome}
      screenOptions={hiddenStackScreenOptions}
    >
      <Stack.Screen component={StoreHomeScreen} name={StoreRoutes.StoreHome} />
      <Stack.Screen component={StoreProductScreen} name={StoreRoutes.StoreProduct} />
      <Stack.Screen component={StoreCartScreen} name={StoreRoutes.StoreCart} />
      <Stack.Screen
        component={StoreOrderSuccessScreen}
        name={StoreRoutes.StoreOrderSuccess}
        options={{ gestureEnabled: false }}
      />
      <Stack.Screen component={StoreOrdersScreen} name={StoreRoutes.StoreOrders} />
      <Stack.Screen component={StoreOrderDetailsScreen} name={StoreRoutes.StoreOrderDetails} />
    </Stack.Navigator>
  );
}
