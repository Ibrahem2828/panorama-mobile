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
  subject?: string;
  message?: string;
  body?: string;
  type?: NotificationType;
  is_read?: boolean;
  read_at?: string | null;
  readAt?: string | null;
  target_type?: string | null;
  target_id?: Id | null;
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

export type NotificationRouteIntent =
  | { kind: 'printingOrder'; orderId: Id }
  | { kind: 'group'; groupId: Id }
  | { kind: 'file'; fileId: Id }
  | { kind: 'supportTicket'; ticketId: Id }
  | { kind: 'verification' }
  | { kind: 'future'; label: string }
  | { kind: 'none' };
