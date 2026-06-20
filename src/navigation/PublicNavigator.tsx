import { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AppScreen, LoadingState } from '../components';
import { ForgotPasswordScreen } from '../features/auth/screens/ForgotPasswordScreen';
import { LoginScreen } from '../features/auth/screens/LoginScreen';
import { OtpVerificationScreen } from '../features/auth/screens/OtpVerificationScreen';
import { RegisterStudentScreen } from '../features/auth/screens/RegisterStudentScreen';
import { ResetPasswordScreen } from '../features/auth/screens/ResetPasswordScreen';
import { OnboardingScreen } from '../features/onboarding/screens/OnboardingScreen';
import { SplashScreen } from '../features/onboarding/screens/SplashScreen';
import { hasSeenOnboarding } from '../features/onboarding/services';
import { hiddenStackScreenOptions } from './config/screenOptions';
import { PublicRoutes } from './routes';
import type { PublicStackParamList } from './types';

const Stack = createNativeStackNavigator<PublicStackParamList>();

export function PublicNavigator() {
  const [initialRouteName, setInitialRouteName] = useState<keyof PublicStackParamList | null>(null);

  useEffect(() => {
    let mounted = true;

    async function resolveInitialRoute() {
      const seenOnboarding = await hasSeenOnboarding();

      if (mounted) {
        setInitialRouteName(seenOnboarding ? PublicRoutes.Login : PublicRoutes.Onboarding);
      }
    }

    void resolveInitialRoute();

    return () => {
      mounted = false;
    };
  }, []);

  if (!initialRouteName) {
    return (
      <AppScreen horizontalPadding={false}>
        <LoadingState centered message="جاري تجهيز البداية..." />
      </AppScreen>
    );
  }

  return (
    <Stack.Navigator initialRouteName={initialRouteName} screenOptions={hiddenStackScreenOptions}>
      <Stack.Screen component={SplashScreen} name={PublicRoutes.Splash} />
      <Stack.Screen component={OnboardingScreen} name={PublicRoutes.Onboarding} />
      <Stack.Screen component={LoginScreen} name={PublicRoutes.Login} />
      <Stack.Screen component={RegisterStudentScreen} name={PublicRoutes.RegisterStudent} />
      <Stack.Screen component={OtpVerificationScreen} name={PublicRoutes.OtpVerification} />
      <Stack.Screen component={ForgotPasswordScreen} name={PublicRoutes.ForgotPassword} />
      <Stack.Screen component={ResetPasswordScreen} name={PublicRoutes.ResetPassword} />
    </Stack.Navigator>
  );
}
