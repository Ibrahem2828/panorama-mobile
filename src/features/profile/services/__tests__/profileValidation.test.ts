import { ar } from '../../../../i18n/locales/ar';
import {
  hasProfileDraftErrors,
  isProfileDraftDirty,
  isStaffRole,
  validateProfileDraft,
} from '../profileValidation';

const t = ar.profile.edit;
const draft = { full_name: 'أحمد علي', username: 'ahmad.ali', job_title: 'مشرف' };

describe('isStaffRole', () => {
  it('is true for the dashboard roles only', () => {
    expect(isStaffRole('admin')).toBe(true);
    expect(isStaffRole('IT_SUPPORT')).toBe(true);
    expect(isStaffRole('print_staff')).toBe(true);
    expect(isStaffRole('student')).toBe(false);
    expect(isStaffRole('normal_user')).toBe(false);
    expect(isStaffRole(undefined)).toBe(false);
  });
});

describe('validateProfileDraft', () => {
  it('accepts a complete draft and an empty optional username', () => {
    expect(hasProfileDraftErrors(validateProfileDraft(draft, { isStaff: true }, t))).toBe(false);
    expect(
      hasProfileDraftErrors(
        validateProfileDraft({ ...draft, username: '' }, { isStaff: false }, t),
      ),
    ).toBe(false);
  });

  it('explains a missing, too short or too long name in Arabic', () => {
    expect(
      validateProfileDraft({ ...draft, full_name: '  ' }, { isStaff: false }, t).full_name,
    ).toBe(t.fullNameRequired);
    expect(
      validateProfileDraft({ ...draft, full_name: 'ع' }, { isStaff: false }, t).full_name,
    ).toBe(t.fullNameTooShort);
    expect(
      validateProfileDraft({ ...draft, full_name: 'ع'.repeat(151) }, { isStaff: false }, t)
        .full_name,
    ).toBe(t.fullNameTooLong);
  });

  it('checks the username characters and length when one is given', () => {
    const check = (username: string) =>
      validateProfileDraft({ ...draft, username }, { isStaff: false }, t).username;

    expect(check('has space')).toBe(t.usernameInvalid);
    expect(check('عربي')).toBe(t.usernameInvalid);
    expect(check('ab')).toBe(t.usernameTooShort);
    expect(check('a'.repeat(31))).toBe(t.usernameTooLong);
    expect(check('ok_name-1.x')).toBeUndefined();
  });

  it('limits the job title for staff only', () => {
    const long = { ...draft, job_title: 'م'.repeat(121) };

    expect(validateProfileDraft(long, { isStaff: true }, t).job_title).toBe(t.jobTitleTooLong);
    expect(validateProfileDraft(long, { isStaff: false }, t).job_title).toBeUndefined();
  });
});

describe('isProfileDraftDirty', () => {
  const saved = { full_name: 'أحمد علي', username: 'ahmad.ali', job_title: 'مشرف' };

  it('is false for an unchanged form, even with stray spaces', () => {
    expect(isProfileDraftDirty(saved, draft, { isStaff: true })).toBe(false);
    expect(
      isProfileDraftDirty(saved, { ...draft, full_name: ' أحمد علي ' }, { isStaff: true }),
    ).toBe(false);
    expect(
      isProfileDraftDirty(
        { full_name: 'س', username: null },
        { full_name: 'س', username: '', job_title: '' },
        { isStaff: false },
      ),
    ).toBe(false);
  });

  it('detects edits, and ignores the job title for non-staff', () => {
    expect(isProfileDraftDirty(saved, { ...draft, full_name: 'أحمد' }, { isStaff: true })).toBe(
      true,
    );
    expect(isProfileDraftDirty(saved, { ...draft, job_title: 'مدير' }, { isStaff: true })).toBe(
      true,
    );
    expect(isProfileDraftDirty(saved, { ...draft, job_title: 'مدير' }, { isStaff: false })).toBe(
      false,
    );
  });

  it('is false while the profile is not loaded yet', () => {
    expect(isProfileDraftDirty(null, draft, { isStaff: true })).toBe(false);
  });
});
