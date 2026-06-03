export type ChangePasswordInput = {
  old_password: string;
  new_password: string;
  new_password_confirm: string;
};

export type SettingsItemKey =
  | 'changePassword'
  | 'notifications'
  | 'privacy'
  | 'terms'
  | 'about'
  | 'logout';

export type ChangePasswordDraft = ChangePasswordInput;
