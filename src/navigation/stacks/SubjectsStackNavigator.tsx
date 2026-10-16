import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { LectureViewerScreen } from '../../features/lectures/screens/LectureViewerScreen';
import { LecturesListScreen } from '../../features/lectures/screens/LecturesListScreen';
import { SubjectDetailsScreen } from '../../features/subjects/screens/SubjectDetailsScreen';
import { SubjectsListScreen } from '../../features/subjects/screens/SubjectsListScreen';
import { hiddenStackScreenOptions } from '../config/screenOptions';
import { LecturesRoutes, SubjectsRoutes } from '../routes';
import type { SubjectsStackParamList } from '../types';

const Stack = createNativeStackNavigator<SubjectsStackParamList>();

export function SubjectsStackNavigator() {
  return (
    <Stack.Navigator
      initialRouteName={SubjectsRoutes.SubjectsList}
      screenOptions={hiddenStackScreenOptions}
    >
      <Stack.Screen component={SubjectsListScreen} name={SubjectsRoutes.SubjectsList} />
      <Stack.Screen component={SubjectDetailsScreen} name={SubjectsRoutes.SubjectDetails} />
      <Stack.Screen component={LecturesListScreen} name={LecturesRoutes.LecturesList} />
      <Stack.Screen component={LectureViewerScreen} name={LecturesRoutes.LectureViewer} />
    </Stack.Navigator>
  );
}
