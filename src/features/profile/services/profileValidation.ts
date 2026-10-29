import type { TranslationCatalog } from '../../../i18n';
import type { ProfileEditDraft } from '../types';

type EditCatalog = TranslationCatalog['profile']['edit'];

export type ProfileDraftErrors = Partial<Record<keyof ProfileEditDraft, string>>;

export const FULL_NAME_MIN = 2;
export const FULL_NAME_MAX = 150;
export const USERNAME_MIN = 3;
export const USERNAME_MAX = 30;
export const JOB_TITLE_MAX = 120;

const USERNAME_PATTERN = /^[A-Za-z0-9_.-]+$/u;

const STAFF_ROLES = new Set(['admin', 'it_support', 'print_staff']);

/** Staff (the dashboard roles) have a job title; students and normal users never see the field. */
export function isStaffRole(role: string | undefined | null): boolean {
  return role != null && STAFF_ROLES.has(role.toLowerCase());
}

/** Inline messages for the edit form. The username is optional; the job title is checked for staff only. */
export function validateProfileDraft(
  draft: ProfileEditDraft,
  options: { isStaff: boolean },
  t: EditCatalog,
): ProfileDraftErrors {
  const errors: ProfileDraftErrors = {};
  const fullName = draft.full_name.trim();
  const username = draft.username.trim();

  if (!fullName) {
    errors.full_name = t.fullNameRequired;
  } else if (fullName.length < FULL_NAME_MIN) {
    errors.full_name = t.fullNameTooShort;
  } else if (fullName.length > FULL_NAME_MAX) {
    errors.full_name = t.fullNameTooLong;
  }

  if (username) {
    if (!USERNAME_PATTERN.test(username)) {
      errors.username = t.usernameInvalid;
    } else if (username.length < USERNAME_MIN) {
      errors.username = t.usernameTooShort;
    } else if (username.length > USERNAME_MAX) {
      errors.username = t.usernameTooLong;
    }
  }

  if (options.isStaff && draft.job_title.trim().length > JOB_TITLE_MAX) {
    errors.job_title = t.jobTitleTooLong;
  }

  return errors;
}

export function hasProfileDraftErrors(errors: ProfileDraftErrors): boolean {
  return Object.values(errors).some(Boolean);
}

/** True when the form differs from what is saved (surrounding spaces do not count as a change). */
export function isProfileDraftDirty(
  saved: { full_name?: string; username?: string | null; job_title?: string } | null,
  draft: ProfileEditDraft,
  options: { isStaff: boolean },
): boolean {
  if (!saved) {
    return false;
  }

  const changed =
    draft.full_name.trim() !== (saved.full_name ?? '').trim() ||
    draft.username.trim() !== (saved.username ?? '').trim();

  return options.isStaff
    ? changed || draft.job_title.trim() !== (saved.job_title ?? '').trim()
    : changed;
}
