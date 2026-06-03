import { useEffect } from 'react';

import { useAuthStore } from '../../features/auth/store';
import { useStudentProfileStore } from '../../features/student-profile';
import { useVerificationStore } from '../../features/verification';
import type { RootFlowMode } from '../types';
import {
  canAccessStudentSetup,
  canAccessVerifiedStudentApp,
  isStudentUser,
} from './navigationGuards';

type StudentAccessGate = {
  rootFlow: RootFlowMode;
  isStudentAccount: boolean;
};

export function useStudentAccessGate(): StudentAccessGate {
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);
  const profile = useStudentProfileStore((state) => state.profile);
  const bootstrapStudentProfile = useStudentProfileStore((state) => state.bootstrap);
  const resetStudentProfile = useStudentProfileStore((state) => state.reset);
  const verification = useVerificationStore((state) => state.verification);
  const loadVerification = useVerificationStore((state) => state.loadVerification);
  const resetVerification = useVerificationStore((state) => state.reset);
  const isStudentAccount = isStudentUser(user);
  const userId = user?.id ?? null;
  const userRole = user?.role ?? null;

  useEffect(() => {
    if (status !== 'authenticated' || !user) {
      resetStudentProfile();
      resetVerification();
      return;
    }

    if (!isStudentAccount) {
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
    userId,
    userRole,
  ]);

  if (status !== 'authenticated' || !user) {
    return {
      rootFlow: 'public',
      isStudentAccount: false,
    };
  }

  if (canAccessVerifiedStudentApp({ status, user, profile, verification })) {
    return {
      rootFlow: 'app',
      isStudentAccount,
    };
  }

  if (canAccessStudentSetup({ status, user })) {
    return {
      rootFlow: 'studentSetup',
      isStudentAccount: true,
    };
  }

  return {
    rootFlow: 'app',
    isStudentAccount: false,
  };
}
