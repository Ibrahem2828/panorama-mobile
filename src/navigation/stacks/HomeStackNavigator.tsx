import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { FileDetailsScreen } from '../../features/files/screens/FileDetailsScreen';
import { FilesListScreen } from '../../features/files/screens/FilesListScreen';
import { PdfViewerScreen } from '../../features/files/screens/PdfViewerScreen';
import { HomeScreen } from '../../features/home/screens/HomeScreen';
import { hiddenStackScreenOptions } from '../config/screenOptions';
import { HomeRoutes, SharedRoutes } from '../routes';
import type { HomeStackParamList } from '../types';

const Stack = createNativeStackNavigator<HomeStackParamList>();

export function HomeStackNavigator() {
  return (
    <Stack.Navigator initialRouteName={HomeRoutes.Home} screenOptions={hiddenStackScreenOptions}>
      <Stack.Screen component={HomeScreen} name={HomeRoutes.Home} />
      <Stack.Screen component={FilesListScreen} name={SharedRoutes.FilesList} />
      <Stack.Screen component={FileDetailsScreen} name={SharedRoutes.FileDetails} />
      <Stack.Screen component={PdfViewerScreen} name={SharedRoutes.PdfViewer} />
    </Stack.Navigator>
  );
}
