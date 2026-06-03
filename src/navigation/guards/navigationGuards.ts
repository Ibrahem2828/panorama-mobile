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

type AuthGuardInput = {
  status: AuthStatus;
  user: AuthUser | null;
  profile?: StudentProfile | null;
  verification?: VerificationRecord | null;
};

export function canAccessApp({ status, user }: AuthGuardInput): boolean {
  return status === 'authenticated' && user !== null;
}

export function isStudentUser(user: AuthUser | null): boolean {
  return user?.role?.toLowerCase() === 'student';
}

export function canAccessStudentSetup({ status, user }: AuthGuardInput): boolean {
  return status === 'authenticated' && isStudentUser(user);
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

export function canAccessVerifiedStudentApp({
  status,
  user,
  profile,
  verification,
}: AuthGuardInput): boolean {
  if (!canAccessApp({ status, user })) {
    return false;
  }

  if (!isStudentUser(user)) {
    return true;
  }

  return hasCompletedAcademicProfile(profile) && hasVerifiedStudentStatus(verification, profile);
}

export const navigationGuards = {
  canAccessApp,
  canAccessStudentSetup,
  canAccessVerifiedStudentApp,
  hasCompletedAcademicProfile,
  hasVerifiedStudentStatus,
  isStudentUser,
} as const;
