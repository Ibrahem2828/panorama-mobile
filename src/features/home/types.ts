import type { EntityId } from '../../api';

export type Announcement = {
  id: EntityId;
  title?: string;
  description?: string;
  body?: string;
  created_at?: string;
  updated_at?: string;
  start_date?: string | null;
  end_date?: string | null;
  is_active?: boolean;
  type?: string;
  [key: string]: unknown;
};

export type HomeData = {
  announcements: Announcement[];
  unreadNotificationsCount: number;
};

export type HomeQuickActionKey =
  | 'subjects'
  | 'groups'
  | 'files'
  | 'printing'
  | 'notifications'
  | 'profile';

export type HomeQuickAction = {
  key: HomeQuickActionKey;
  title: string;
  description: string;
  badge?: string;
  disabled?: boolean;
};
