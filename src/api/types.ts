import type { PaginationParams } from './pagination';

export type EntityId = string | number;

export type ApiEntity = Record<string, unknown> & {
  id: EntityId;
};

export type EmptyResponse = Record<string, never>;

export type ApiListParams = PaginationParams;

export type AuthTokens = {
  access: string;
  refresh: string;
};

export type CurrentUser = ApiEntity & {
  name?: string;
  full_name?: string;
  email?: string;
  phone?: string;
  phone_number?: string;
  username?: string | null;
  role?: string;
  is_phone_verified?: boolean;
  is_email_verified?: boolean;
};

export type LoginResponse = AuthTokens & {
  user?: CurrentUser;
};

export type RefreshTokenResponse = {
  access: string;
};

export type LoginRequest = {
  identifier: string;
  password: string;
};

export type RegisterStudentRequest = {
  name: string;
  phone?: string;
  email?: string;
  password: string;
  studentNumber?: string;
};

export type RefreshTokenRequest = {
  refresh: string;
};

export type OtpChannel = 'sms' | 'email';

export type SendOtpRequest = {
  destination: string;
  channel: OtpChannel;
};

export type VerifyOtpRequest = {
  destination: string;
  code: string;
};

export type AcademicOption = ApiEntity & {
  name: string;
};

export type StudentProfile = ApiEntity & {
  university?: AcademicOption;
  faculty?: AcademicOption;
  major?: AcademicOption;
  academicYear?: AcademicOption;
};

export type VerificationStatus = 'pending' | 'approved' | 'rejected' | 'none';

export type VerificationRecord = ApiEntity & {
  status: VerificationStatus;
  rejectionReason?: string;
};

export type GroupSummary = ApiEntity & {
  name: string;
  description?: string;
  whatsappUrl?: string;
};

export type GroupMessage = ApiEntity & {
  body: string;
  createdAt?: string;
  sender?: CurrentUser;
};

export type FileRecord = ApiEntity & {
  title: string;
  mimeType?: string;
  sizeBytes?: number;
};

export type PrintOrderStatus =
  | 'new'
  | 'processing'
  | 'ready'
  | 'delivered'
  | 'rejected'
  | 'cancelled';

export type PrintOrder = ApiEntity & {
  status: PrintOrderStatus;
  totalPrice?: number;
};

export type CreatePrintOrderRequest = {
  fileId?: EntityId;
  notes?: string;
  copies?: number;
};

export type NotificationRecord = ApiEntity & {
  title: string;
  body?: string;
  readAt?: string | null;
};

export type UnreadCount = {
  count: number;
};

export type RegisterDeviceTokenRequest = {
  token: string;
  platform: 'ios' | 'android' | 'web';
};

export type SupportTicketStatus = 'open' | 'pending' | 'closed';

export type SupportTicket = ApiEntity & {
  subject: string;
  status: SupportTicketStatus;
};

export type CreateSupportTicketRequest = {
  subject: string;
  description: string;
  category?: string;
};

export type AddSupportTicketMessageRequest = {
  message: string;
};
