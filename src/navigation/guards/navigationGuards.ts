import type { AuthStatus, AuthUser } from '../../features/auth/types';

type AuthGuardInput = {
  status: AuthStatus;
  user: AuthUser | null;
};

export function canAccessApp({ status, user }: AuthGuardInput): boolean {
  return status === 'authenticated' && user !== null;
}

export function canAccessStudentSetup(): boolean {
  return false;
}

export function hasCompletedAcademicProfile(): boolean {
  return false;
}

export function hasVerifiedStudentStatus(): boolean {
  return false;
}

export const navigationGuards = {
  canAccessApp,
  canAccessStudentSetup,
  hasCompletedAcademicProfile,
  hasVerifiedStudentStatus,
} as const;
