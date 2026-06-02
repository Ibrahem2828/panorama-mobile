import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { CreatePrintOrderScreen } from '../../features/printing/screens/CreatePrintOrderScreen';
import { MyPrintOrdersScreen } from '../../features/printing/screens/MyPrintOrdersScreen';
import { PrintHomeScreen } from '../../features/printing/screens/PrintHomeScreen';
import { PrintOrderDetailsScreen } from '../../features/printing/screens/PrintOrderDetailsScreen';
import { PrintPriceSummaryScreen } from '../../features/printing/screens/PrintPriceSummaryScreen';
import { hiddenStackScreenOptions } from '../config/screenOptions';
import { PrintingRoutes } from '../routes';
import type { PrintingStackParamList } from '../types';

const Stack = createNativeStackNavigator<PrintingStackParamList>();

export function PrintingStackNavigator() {
  return (
    <Stack.Navigator
      initialRouteName={PrintingRoutes.PrintHome}
      screenOptions={hiddenStackScreenOptions}
    >
      <Stack.Screen component={PrintHomeScreen} name={PrintingRoutes.PrintHome} />
      <Stack.Screen component={CreatePrintOrderScreen} name={PrintingRoutes.CreatePrintOrder} />
      <Stack.Screen component={PrintPriceSummaryScreen} name={PrintingRoutes.PrintPriceSummary} />
      <Stack.Screen component={MyPrintOrdersScreen} name={PrintingRoutes.MyPrintOrders} />
      <Stack.Screen component={PrintOrderDetailsScreen} name={PrintingRoutes.PrintOrderDetails} />
    </Stack.Navigator>
  );
}
