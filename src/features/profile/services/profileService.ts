import {
  authService,
  normalizeApiError,
  type CurrentUser,
  type UpdateCurrentUserRequest,
} from '../../../api';
import type { AuthUser } from '../../auth/types';
import type { EditableProfileFields, ProfileStatusSummary, ProfileUser } from '../types';

const NETWORK_MESSAGE = 'تعذر تحميل بيانات الحساب. تحقق من اتصال الإنترنت وحاول مرة أخرى.';
const UNAUTHORIZED_MESSAGE = 'انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى.';
const VALIDATION_MESSAGE = 'يرجى التأكد من بيانات الملف الشخصي المدخلة.';
const UPDATE_MESSAGE = 'تعذر تحديث الملف الشخصي. حاول مرة أخرى.';

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

export function getProfileDisplayName(user: ProfileUser | null): string {
  return user?.full_name ?? user?.username ?? 'مستخدم Panorama';
}

export function getProfileRoleLabel(role?: string): string {
  switch (role) {
    case 'student':
      return 'طالب';
    case 'normal_user':
      return 'مستخدم';
    case 'admin':
      return 'مسؤول';
    case 'it_support':
      return 'دعم فني';
    case 'print_staff':
      return 'موظف طباعة';
    default:
      return 'حساب مستخدم';
  }
}

export function getProfileContactLabel(user: ProfileUser | null): string {
  return user?.email ?? user?.phone_number ?? 'لا توجد بيانات تواصل مؤكدة حاليا';
}

export function getBooleanStatusLabel(value?: boolean): string {
  if (value === true) {
    return 'مؤكد';
  }

  if (value === false) {
    return 'غير مؤكد';
  }

  return 'غير معروف';
}

export function getAccountVerificationSummary(user: ProfileUser | null): ProfileStatusSummary {
  if (user?.is_email_verified || user?.is_phone_verified) {
    return {
      label: 'بيانات التواصل مؤكدة',
      description: 'يوجد بريد أو رقم هاتف مؤكد على الحساب.',
      variant: 'success',
    };
  }

  if (user) {
    return {
      label: 'بيانات التواصل غير مؤكدة',
      description: 'يعرض التطبيق حالة الحساب كما يعيدها الخادم.',
      variant: 'warning',
    };
  }

  return {
    label: 'بيانات الحساب غير محملة',
    description: 'أعد تحميل الملف الشخصي لعرض حالة الحساب.',
    variant: 'neutral',
  };
}

export function toSafeProfileErrorMessage(error: unknown): string {
  const normalizedError = normalizeApiError(error);

  if (normalizedError.code === 'NETWORK_ERROR' || normalizedError.code === 'TIMEOUT') {
    return NETWORK_MESSAGE;
  }

  if (normalizedError.code === 'UNAUTHORIZED') {
    return UNAUTHORIZED_MESSAGE;
  }

  if (normalizedError.code === 'VALIDATION_ERROR') {
    return VALIDATION_MESSAGE;
  }

  return normalizedError.message || UPDATE_MESSAGE;
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
