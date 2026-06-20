import type { AuthUser } from '../../features/auth/types';
import { isStudentProfileComplete, type StudentProfile } from '../../features/student-profile';
import {
  getVerificationStatus,
  isVerificationApproved,
  type VerificationRecord,
} from '../../features/verification';
import { StudentSetupRoutes } from '../routes';

export type StudentJourneyPhase =
  | 'loading'
  | 'academicProfile'
  | 'submitVerification'
  | 'verificationStatus'
  | 'mainApp';

export type StudentJourneyInput = {
  user: AuthUser | null;
  profile: StudentProfile | null;
  verification: VerificationRecord | null;
  hasBootstrapped: boolean;
  hasLoadedVerification: boolean;
  isBootstrapping: boolean;
  isLoadingVerification: boolean;
};

export function isStudentContextLoading({
  hasBootstrapped,
  hasLoadedVerification,
  isBootstrapping,
  isLoadingVerification,
}: Pick<
  StudentJourneyInput,
  'hasBootstrapped' | 'hasLoadedVerification' | 'isBootstrapping' | 'isLoadingVerification'
>): boolean {
  if (isBootstrapping || isLoadingVerification) {
    return true;
  }

  return !hasBootstrapped || !hasLoadedVerification;
}

export function resolveStudentJourneyPhase(input: StudentJourneyInput): StudentJourneyPhase {
  if (isStudentContextLoading(input)) {
    return 'loading';
  }

  if (!isStudentProfileComplete(input.profile)) {
    return 'academicProfile';
  }

  const verificationStatus = getVerificationStatus(input.verification);

  if (verificationStatus === 'none') {
    return 'submitVerification';
  }

  if (isVerificationApproved(input.verification)) {
    return 'mainApp';
  }

  if (
    verificationStatus === 'pending' ||
    verificationStatus === 'rejected' ||
    verificationStatus === 'needs_update'
  ) {
    return 'verificationStatus';
  }

  return 'verificationStatus';
}

export function getStudentSetupInitialRoute(
  phase: StudentJourneyPhase,
): keyof typeof StudentSetupRoutes | null {
  switch (phase) {
    case 'academicProfile':
      return StudentSetupRoutes.AcademicProfileSetup;
    case 'submitVerification':
      return StudentSetupRoutes.SubmitVerification;
    case 'verificationStatus':
      return StudentSetupRoutes.VerificationStatus;
    case 'loading':
    case 'mainApp':
      return null;
  }
}

export function canEnterMainStudentApp(input: StudentJourneyInput): boolean {
  return resolveStudentJourneyPhase(input) === 'mainApp';
}
