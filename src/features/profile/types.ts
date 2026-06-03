import type { StatusVariant } from '../../types/common';

export type Id = string | number;

export type EditableProfileFields = {
  full_name?: string;
  username?: string;
};

export type ProfileUser = {
  id: Id;
  full_name?: string;
  username?: string | null;
  email?: string;
  phone_number?: string;
  role?: string;
  is_phone_verified?: boolean;
  is_email_verified?: boolean;
  [key: string]: unknown;
};

export type ProfileStatusSummary = {
  label: string;
  description?: string;
  variant: StatusVariant;
};

export type ProfileEditDraft = {
  full_name: string;
  username: string;
};
