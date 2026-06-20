import { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { LoadingState } from '../components';
import { useAuthStore } from '../features/auth/store';
import { useStudentProfileStore } from '../features/student-profile';
import { useVerificationStore } from '../features/verification';
import { getStudentSetupInitialRoute, resolveStudentJourneyPhase } from './guards/studentJourney';
import type { StudentSetupStackParamList } from './types';

type ResolverNavigation = NativeStackNavigationProp<StudentSetupStackParamList, 'SetupFlow'>;

export function StudentSetupFlowResolver() {
  const navigation = useNavigation<ResolverNavigation>();
  const user = useAuthStore((state) => state.user);
  const profile = useStudentProfileStore((state) => state.profile);
  const hasBootstrapped = useStudentProfileStore((state) => state.hasBootstrapped);
  const isBootstrapping = useStudentProfileStore((state) => state.isBootstrapping);
  const verification = useVerificationStore((state) => state.verification);
  const hasLoadedVerification = useVerificationStore((state) => state.hasLoadedVerification);
  const isLoadingVerification = useVerificationStore((state) => state.isLoadingVerification);

  const journeyInput = {
    user,
    profile,
    verification,
    hasBootstrapped,
    hasLoadedVerification,
    isBootstrapping,
    isLoadingVerification,
  };
  const phase = resolveStudentJourneyPhase(journeyInput);
  const initialRoute = getStudentSetupInitialRoute(phase);

  useEffect(() => {
    if (phase === 'loading' || !initialRoute) {
      return;
    }

    navigation.replace(initialRoute);
  }, [initialRoute, navigation, phase]);

  return <LoadingState centered message="جاري تحميل بيانات الإعداد..." title="إعداد الطالب" />;
}
