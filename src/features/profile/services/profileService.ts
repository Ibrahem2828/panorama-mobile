import {
  authService,
  normalizeApiError,
  type CurrentUser,
  type UpdateCurrentUserRequest,
} from '../../../api';
import type { AuthUser } from '../../auth/types';
import type { TranslationCatalog } from '../../../i18n';
import type { VerificationStatus } from '../../../api';
import type { StatusVariant } from '../../../types/common';
import type { EditableProfileFields, ProfileStatusSummary, ProfileUser } from '../types';

type ProfileCatalog = TranslationCatalog['profile'];
type VerificationCatalog = TranslationCatalog['verification'];
type CommonCatalog = TranslationCatalog['common'];

function toText(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }

  if (typeof value === 'number') {
    return String(value);
  }

  return undefined;
}

function toNullableText(value: unknown): string | null {
  return toText(value) ?? null;
}

function toBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

function normalizeProfileUser(user: CurrentUser): ProfileUser {
  return {
    ...user,
    id: user.id,
    full_name: toText(user.full_name ?? user.name),
    username: toNullableText(user.username),
    email: toText(user.email),
    phone_number: toText(user.phone_number ?? user.phone),
    role: toText(user.role),
    is_phone_verified: toBoolean(user.is_phone_verified),
    is_email_verified: toBoolean(user.is_email_verified),
  };
}

export function toAuthUser(user: ProfileUser): AuthUser {
  return {
    id: user.id,
    full_name: user.full_name,
    username: user.username,
    email: user.email,
    phone_number: user.phone_number,
    role: user.role,
    is_phone_verified: user.is_phone_verified,
    is_email_verified: user.is_email_verified,
  };
}

export function getProfileDisplayName(user: ProfileUser | null, t: ProfileCatalog): string {
  return user?.full_name ?? user?.username ?? t.defaultName;
}

export function getProfileRoleLabel(role: string | undefined, t: ProfileCatalog): string {
  switch (role) {
    case 'student':
      return t.roles.student;
    case 'normal_user':
      return t.roles.normalUser;
    case 'admin':
      return t.roles.admin;
    case 'it_support':
      return t.roles.itSupport;
    case 'print_staff':
      return t.roles.printStaff;
    default:
      return t.roles.fallback;
  }
}

export function getProfileContactLabel(user: ProfileUser | null, t: ProfileCatalog): string {
  return user?.email ?? user?.phone_number ?? t.noContactDetails;
}

/**
 * The one definition of these labels. Three screens each carried their own copy, two of
 * which disagreed on the wording for `needs_update`.
 */
export function getVerificationStatusLabel(
  status: string | VerificationStatus | undefined,
  t: VerificationCatalog,
  unknownLabel: string,
): string {
  switch (status) {
    case 'approved':
      return t.verified;
    case 'pending':
      return t.pending;
    case 'rejected':
      return t.rejected;
    case 'needs_update':
      return t.needsUpdate;
    case 'none':
      return t.notSubmitted;
    default:
      return unknownLabel;
  }
}

export function getVerificationStatusVariant(status?: string | VerificationStatus): StatusVariant {
  switch (status) {
    case 'approved':
      return 'success';
    case 'pending':
      return 'warning';
    case 'rejected':
      return 'error';
    case 'needs_update':
      return 'warning';
    default:
      return 'neutral';
  }
}

export function getStudentCardVerificationSummary(
  status: string | VerificationStatus | undefined,
  t: ProfileCatalog,
  verification: VerificationCatalog,
  common: CommonCatalog,
): ProfileStatusSummary {
  return {
    label: getVerificationStatusLabel(status, verification, common.unknown),
    description: status === 'approved' ? t.academic.cardVerified : t.academic.cardStatusFromServer,
    variant: getVerificationStatusVariant(status),
  };
}

export function getBooleanStatusLabel(
  value: boolean | undefined,
  t: ProfileCatalog,
  unknownLabel: string,
): string {
  if (value === true) {
    return t.academic.confirmed;
  }

  if (value === false) {
    return t.academic.unconfirmed;
  }

  return unknownLabel;
}

export function getAccountVerificationSummary(
  user: ProfileUser | null,
  t: ProfileCatalog,
): ProfileStatusSummary {
  if (user?.is_email_verified || user?.is_phone_verified) {
    return {
      label: t.academic.contactConfirmed,
      description: t.academic.contactConfirmedDescription,
      variant: 'success',
    };
  }

  if (user) {
    return {
      label: t.academic.contactUnconfirmed,
      description: t.academic.contactUnconfirmedDescription,
      variant: 'warning',
    };
  }

  return {
    label: t.academic.accountNotLoaded,
    description: t.academic.accountNotLoadedDescription,
    variant: 'neutral',
  };
}

export function toSafeProfileErrorMessage(error: unknown, t: ProfileCatalog): string {
  const normalizedError = normalizeApiError(error);

  if (normalizedError.code === 'NETWORK_ERROR' || normalizedError.code === 'TIMEOUT') {
    return t.errors.network;
  }

  if (normalizedError.code === 'UNAUTHORIZED') {
    return t.errors.unauthorized;
  }

  if (normalizedError.code === 'VALIDATION_ERROR') {
    return t.errors.validation;
  }

  return normalizedError.message || t.errors.update;
}

export async function loadCurrentProfile(authToken: string): Promise<ProfileUser> {
  return normalizeProfileUser(await authService.getCurrentUser(authToken));
}

export async function updateCurrentProfile(
  input: EditableProfileFields,
  authToken: string,
): Promise<ProfileUser> {
  const payload: UpdateCurrentUserRequest = {};

  if (typeof input.full_name === 'string') {
    payload.full_name = input.full_name;
  }

  if (typeof input.username === 'string') {
    payload.username = input.username;
  }

  return normalizeProfileUser(await authService.updateCurrentUser(payload, authToken));
}
