export type Id = string | number;

export type NotificationType =
  | 'announcement'
  | 'verification'
  | 'printing'
  | 'group'
  | 'file'
  | 'support'
  | 'system'
  | string;

export type NotificationRecord = {
  id: Id;
  title?: string;
  title_ar?: string;
  title_en?: string;
  subject?: string;
  message?: string;
  body?: string;
  body_ar?: string;
  body_en?: string;
  type?: NotificationType;
  is_read?: boolean;
  read_at?: string | null;
  readAt?: string | null;
  target_type?: string | null;
  target_id?: Id | null;
  /** App path chosen by the backend. Only ever followed after `parseDeepLink` accepts it. */
  deep_link?: string;
  related_object_type?: string;
  related_object_id?: string;
  expires_at?: string | null;
  data?: Record<string, unknown> | null;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
};

export type UnreadCountResponse = {
  count: number;
};

export type DeviceTokenPlatform = 'android' | 'ios' | 'web' | string;

export type RegisterDeviceTokenInput = {
  token: string;
  platform: DeviceTokenPlatform;
};

export type NotificationTarget = {
  targetType: string | null;
  targetId: Id | null;
};

/** Where tapping a notification (or a push) leads inside the app. */
export type NotificationRouteIntent =
  | { kind: 'announcements' }
  | { kind: 'announcement'; announcementId: Id }
  | { kind: 'printingHome' }
  | { kind: 'printingNew' }
  | { kind: 'printingOrders' }
  | { kind: 'printingOrder'; orderId: Id }
  | { kind: 'groups' }
  | { kind: 'group'; groupId: Id }
  | { kind: 'groupChat'; groupId: Id }
  | { kind: 'groupFiles'; groupId: Id }
  | { kind: 'files' }
  | { kind: 'file'; fileId: Id }
  | { kind: 'subjects' }
  | { kind: 'subject'; subjectId: Id }
  | { kind: 'supportList' }
  | { kind: 'supportNew' }
  | { kind: 'supportTicket'; ticketId: Id }
  | { kind: 'feedback' }
  | { kind: 'profile' }
  | { kind: 'editProfile' }
  | { kind: 'academicInfo' }
  | { kind: 'settings' }
  | { kind: 'search' }
  | { kind: 'home' }
  | { kind: 'notifications' }
  | { kind: 'verification' }
  | { kind: 'none' };

/** One display row of the grouped list: a day heading or a notification. */
export type NotificationListRow =
  | { kind: 'header'; key: string; day: NotificationDay }
  | { kind: 'item'; key: string; notification: NotificationRecord };

export type NotificationDay =
  | { type: 'today' }
  | { type: 'yesterday' }
  | { type: 'date'; iso: string }
  | { type: 'unknown' };
