import { useEffect } from 'react';

import { useAuthStore } from '../../features/auth/store';
import { useStudentProfileStore } from '../../features/student-profile';
import { useVerificationStore } from '../../features/verification';
import type { RootFlowMode } from '../types';
import {
  canAccessStudentSetup,
  isNormalUser,
  isStudentUser,
  shouldDenyMobileAccess,
} from './navigationGuards';
import { canEnterMainStudentApp, resolveStudentJourneyPhase } from './studentJourney';

type StudentAccessGate = {
  rootFlow: RootFlowMode;
  isStudentAccount: boolean;
  isResolvingStudentContext: boolean;
};

export function useStudentAccessGate(): StudentAccessGate {
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);
  const profile = useStudentProfileStore((state) => state.profile);
  const hasBootstrapped = useStudentProfileStore((state) => state.hasBootstrapped);
  const isBootstrapping = useStudentProfileStore((state) => state.isBootstrapping);
  const bootstrapStudentProfile = useStudentProfileStore((state) => state.bootstrap);
  const resetStudentProfile = useStudentProfileStore((state) => state.reset);
  const verification = useVerificationStore((state) => state.verification);
  const hasLoadedVerification = useVerificationStore((state) => state.hasLoadedVerification);
  const isLoadingVerification = useVerificationStore((state) => state.isLoadingVerification);
  const profileLoadFailed = useStudentProfileStore((state) => state.loadFailed);
  const verificationLoadFailed = useVerificationStore((state) => state.loadFailed);
  const loadVerification = useVerificationStore((state) => state.loadVerification);
  const resetVerification = useVerificationStore((state) => state.reset);
  const isStudentAccount = isStudentUser(user);

  const journeyInput = {
    user,
    profile,
    verification,
    hasBootstrapped,
    hasLoadedVerification,
    isBootstrapping,
    isLoadingVerification,
  };
  const journeyPhase = resolveStudentJourneyPhase(journeyInput);
  // A failed load keeps the student on the loading screen, which offers a retry, instead of
  // silently pushing them into the setup flow as if nothing had been saved.
  const studentContextFailed =
    journeyPhase !== 'loading' && (profileLoadFailed || verificationLoadFailed);
  const isResolvingStudentContext =
    status === 'authenticated' &&
    isStudentAccount &&
    (journeyPhase === 'loading' || studentContextFailed);

  useEffect(() => {
    if (status !== 'authenticated' || !user || !isStudentAccount) {
      resetStudentProfile();
      resetVerification();
      return;
    }
    void bootstrapStudentProfile();
    void loadVerification();
  }, [
    bootstrapStudentProfile,
    isStudentAccount,
    loadVerification,
    resetStudentProfile,
    resetVerification,
    status,
    user,
  ]);

  if (status !== 'authenticated' || !user) {
    return { rootFlow: 'public', isStudentAccount: false, isResolvingStudentContext: false };
  }

  if (shouldDenyMobileAccess(user)) {
    return { rootFlow: 'accessDenied', isStudentAccount: false, isResolvingStudentContext: false };
  }

  // Normal users enter the general app directly and never call student-only profile APIs.
  if (isNormalUser(user)) {
    return { rootFlow: 'app', isStudentAccount: false, isResolvingStudentContext: false };
  }

  if (isResolvingStudentContext) {
    return { rootFlow: 'studentSetup', isStudentAccount: true, isResolvingStudentContext: true };
  }

  if (canEnterMainStudentApp(journeyInput)) {
    return { rootFlow: 'app', isStudentAccount: true, isResolvingStudentContext: false };
  }

  if (canAccessStudentSetup({ status, user })) {
    return { rootFlow: 'studentSetup', isStudentAccount: true, isResolvingStudentContext: false };
  }

  return { rootFlow: 'accessDenied', isStudentAccount: false, isResolvingStudentContext: false };
}
