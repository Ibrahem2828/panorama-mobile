import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AcademicProfileSetupScreen } from '../features/student-profile/screens/AcademicProfileSetupScreen';
import { SubmitVerificationScreen } from '../features/verification/screens/SubmitVerificationScreen';
import { VerificationStatusScreen } from '../features/verification/screens/VerificationStatusScreen';
import { hiddenStackScreenOptions } from './config/screenOptions';
import { StudentSetupRoutes } from './routes';
import { StudentSetupFlowResolver } from './StudentSetupFlowResolver';
import type { StudentSetupStackParamList } from './types';

const Stack = createNativeStackNavigator<StudentSetupStackParamList>();

export function StudentSetupNavigator() {
  return (
    <Stack.Navigator
      initialRouteName={StudentSetupRoutes.SetupFlow}
      screenOptions={hiddenStackScreenOptions}
    >
      <Stack.Screen component={StudentSetupFlowResolver} name={StudentSetupRoutes.SetupFlow} />
      <Stack.Screen
        component={AcademicProfileSetupScreen}
        name={StudentSetupRoutes.AcademicProfileSetup}
      />
      <Stack.Screen
        component={SubmitVerificationScreen}
        name={StudentSetupRoutes.SubmitVerification}
      />
      <Stack.Screen
        component={VerificationStatusScreen}
        name={StudentSetupRoutes.VerificationStatus}
      />
    </Stack.Navigator>
  );
}
