import type { AuthStatus, AuthUser } from '../../features/auth/types';
import {
  getStudentProfileVerificationStatus,
  isStudentProfileComplete,
  type StudentProfile,
} from '../../features/student-profile';
import {
  getVerificationStatus,
  isVerificationApproved,
  type VerificationRecord,
} from '../../features/verification';
import { canEnterMainStudentApp, type StudentJourneyInput } from './studentJourney';

type AuthGuardInput = {
  status: AuthStatus;
  user: AuthUser | null;
  profile?: StudentProfile | null;
  verification?: VerificationRecord | null;
  hasBootstrapped?: boolean;
  hasLoadedVerification?: boolean;
  isBootstrapping?: boolean;
  isLoadingVerification?: boolean;
};

const OPERATIONAL_ROLES = new Set(['admin', 'it_support', 'print_staff']);

export function canAccessApp({ status, user }: AuthGuardInput): boolean {
  return status === 'authenticated' && user !== null;
}

export function isStudentUser(user: AuthUser | null): boolean {
  return user?.role?.toLowerCase() === 'student';
}

export function isNormalUser(user: AuthUser | null): boolean {
  return user?.role?.toLowerCase() === 'normal_user';
}

export function isOperationalRole(user: AuthUser | null): boolean {
  const role = user?.role?.toLowerCase();

  return Boolean(role && OPERATIONAL_ROLES.has(role));
}

export function shouldDenyMobileAccess(user: AuthUser | null): boolean {
  return isOperationalRole(user);
}

export function canAccessStudentSetup({ status, user }: AuthGuardInput): boolean {
  return status === 'authenticated' && (isStudentUser(user) || isNormalUser(user));
}

export function hasCompletedAcademicProfile(profile?: StudentProfile | null): boolean {
  return isStudentProfileComplete(profile ?? null);
}

export function hasVerifiedStudentStatus(
  verification?: VerificationRecord | null,
  profile?: StudentProfile | null,
): boolean {
  if (isVerificationApproved(verification ?? null)) {
    return true;
  }

  return (
    getVerificationStatus(verification ?? null) === 'approved' ||
    getStudentProfileVerificationStatus(profile ?? null) === 'approved'
  );
}

export function canAccessVerifiedStudentApp(input: AuthGuardInput): boolean {
  if (!canAccessApp(input) || !isStudentUser(input.user)) {
    return false;
  }

  const journeyInput: StudentJourneyInput = {
    user: input.user,
    profile: input.profile ?? null,
    verification: input.verification ?? null,
    hasBootstrapped: input.hasBootstrapped ?? false,
    hasLoadedVerification: input.hasLoadedVerification ?? false,
    isBootstrapping: input.isBootstrapping ?? false,
    isLoadingVerification: input.isLoadingVerification ?? false,
  };

  return canEnterMainStudentApp(journeyInput);
}

export const navigationGuards = {
  canAccessApp,
  canAccessStudentSetup,
  canAccessVerifiedStudentApp,
  hasCompletedAcademicProfile,
  hasVerifiedStudentStatus,
  isNormalUser,
  isOperationalRole,
  isStudentUser,
  shouldDenyMobileAccess,
} as const;
