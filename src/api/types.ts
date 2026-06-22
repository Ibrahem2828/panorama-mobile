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
  full_name: string;
  phone_number: string;
  email: string;
  password: string;
  password_confirm: string;
  student_number: string;
};

export type RefreshTokenRequest = {
  refresh: string;
};

export type UpdateCurrentUserRequest = {
  full_name?: string;
  username?: string;
};

export type ChangePasswordRequest = {
  old_password: string;
  new_password: string;
  new_password_confirm: string;
};

export type OtpPurpose = 'verify_phone' | 'reset_password';

export type SendOtpRequest = {
  phone_number: string;
  purpose: OtpPurpose;
};

export type VerifyOtpRequest = {
  phone_number: string;
  purpose: OtpPurpose;
  code: string;
};

export type RequestPasswordResetRequest = {
  phone_number: string;
};

export type ConfirmPasswordResetRequest = {
  phone_number: string;
  code: string;
  new_password: string;
  new_password_confirm: string;
};

export type AcademicOption = ApiEntity & {
  name: string;
};

export type StudentProfile = ApiEntity & {
  university?: AcademicOption;
  faculty?: AcademicOption;
  major?: AcademicOption;
  academicYear?: AcademicOption;
  academic_year?: AcademicOption;
  semester?: AcademicOption;
  student_number?: string | null;
  studentNumber?: string | null;
  verification_status?: VerificationStatus;
  is_academic_profile_complete?: boolean;
  isAcademicProfileComplete?: boolean;
};

export type VerificationStatus = 'pending' | 'approved' | 'rejected' | 'needs_update' | 'none';

export type VerificationRecord = ApiEntity & {
  status: VerificationStatus;
  rejectionReason?: string;
  rejection_reason?: string | null;
  submitted_at?: string | null;
  updated_at?: string | null;
  card_image_url?: string | null;
};

export type GroupRecord = ApiEntity & {
  name?: string;
  title?: string;
  description?: string | null;
  image?: string | null;
  image_url?: string | null;
  members_count?: number;
  current_user_membership_status?: string;
  current_user_group_role?: string | null;
  send_messages_permission?: string;
  whatsapp_url?: string | null;
  whatsapp_link?: string | null;
  external_chat_url?: string | null;
  external_link?: string | null;
  university?: EntityId | Record<string, unknown> | null;
  major?: EntityId | Record<string, unknown> | null;
  academic_year?: EntityId | Record<string, unknown> | null;
  semester?: EntityId | Record<string, unknown> | null;
  subject?: EntityId | Record<string, unknown> | null;
  created_at?: string;
  updated_at?: string;
};

export type GroupSummary = GroupRecord;

export type GroupJoinResult = Record<string, unknown> & {
  status?: string;
  group?: GroupRecord;
};

export type GroupMessage = ApiEntity & {
  group?: EntityId | Record<string, unknown> | null;
  sender?: EntityId | CurrentUser | Record<string, unknown> | null;
  sender_name?: string | null;
  message?: string;
  body?: string;
  content?: string;
  text?: string;
  type?: string;
  is_own?: boolean;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
};

export type SendGroupMessageRequest = {
  type: 'message';
  content: string;
};

export type FileRecord = ApiEntity & {
  title?: string;
  name?: string;
  description?: string | null;
  file?: string | null;
  file_url?: string | null;
  url?: string | null;
  download_url?: string | null;
  mime_type?: string | null;
  content_type?: string | null;
  mimeType?: string | null;
  extension?: string | null;
  size?: number | null;
  size_bytes?: number | null;
  sizeBytes?: number | null;
  visibility?: string;
  group?: EntityId | Record<string, unknown> | null;
  major?: EntityId | Record<string, unknown> | null;
  academic_year?: EntityId | Record<string, unknown> | null;
  semester?: EntityId | Record<string, unknown> | null;
  subject?: EntityId | Record<string, unknown> | null;
  created_at?: string;
  updated_at?: string;
};

export type PrintOrderStatus =
  | 'submitted'
  | 'pending'
  | 'accepted'
  | 'in_progress'
  | 'printing'
  | 'ready'
  | 'ready_for_pickup'
  | 'delivered'
  | 'cancelled'
  | 'canceled'
  | 'rejected'
  | string;

export type PrintOrderItem = Record<string, unknown> & {
  id?: EntityId;
  source_file?: EntityId | Record<string, unknown> | null;
  uploaded_file?: string | null;
  copies?: number;
  pages_count?: number | null;
  created_at?: string;
  updated_at?: string;
};

export type PrintOrder = ApiEntity & {
  status?: PrintOrderStatus;
  items?: PrintOrderItem[];
  user_notes?: string | null;
  internal_notes?: string | null;
  rejection_reason?: string | null;
  total_price?: string | number | null;
  totalPrice?: string | number | null;
  created_at?: string;
  updated_at?: string;
  submitted_at?: string;
  ready_at?: string | null;
  delivered_at?: string | null;
};

export type CreatePrintOrderItemInput = {
  source_file: EntityId;
  copies: number;
};

export type CreatePrintOrderRequest = {
  items: CreatePrintOrderItemInput[];
  user_notes?: string;
};

export type NotificationType =
  | 'announcement'
  | 'verification'
  | 'printing'
  | 'group'
  | 'file'
  | 'support'
  | 'system'
  | string;

export type NotificationRecord = ApiEntity & {
  title?: string;
  subject?: string;
  message?: string;
  body?: string;
  type?: NotificationType;
  is_read?: boolean;
  read_at?: string | null;
  readAt?: string | null;
  target_type?: string | null;
  target_id?: EntityId | null;
  data?: Record<string, unknown> | null;
  created_at?: string;
  updated_at?: string;
};

export type AnnouncementRecord = ApiEntity & {
  title?: string;
  description?: string;
  body?: string;
  created_at?: string;
  updated_at?: string;
  start_date?: string | null;
  end_date?: string | null;
  is_active?: boolean;
  type?: string;
};

export type SubjectRecord = ApiEntity & {
  name?: string;
  title?: string;
  code?: string | number | null;
  description?: string | null;
  major?: EntityId | Record<string, unknown> | null;
  academic_year?: EntityId | Record<string, unknown> | null;
  semester?: EntityId | Record<string, unknown> | null;
  order?: number;
  created_at?: string;
  updated_at?: string;
  files_count?: number;
  groups_count?: number;
  lectures_count?: number;
};

export type UnreadCount = {
  count: number;
};

export type UnreadCountResponse = UnreadCount;

export type DeviceTokenPlatform = 'ios' | 'android' | 'web' | string;

export type RegisterDeviceTokenRequest = {
  token: string;
  platform: DeviceTokenPlatform;
};

export type SupportTicketStatus =
  | 'open'
  | 'pending'
  | 'in_progress'
  | 'answered'
  | 'resolved'
  | 'closed'
  | 'rejected'
  | string;

export type SupportTicketPriority = 'low' | 'medium' | 'high' | 'urgent' | string;

export type SupportTicketCategory =
  | 'technical'
  | 'account'
  | 'verification'
  | 'printing'
  | 'files'
  | 'groups'
  | 'other'
  | string;

export type SupportTicketMessage = Record<string, unknown> & {
  id?: EntityId;
  message?: string;
  body?: string;
  content?: string;
  sender?: EntityId | Record<string, unknown> | null;
  sender_name?: string | null;
  is_staff_reply?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type SupportTicket = ApiEntity & {
  category?: SupportTicketCategory;
  subject?: string;
  title?: string;
  message?: string;
  status?: SupportTicketStatus;
  priority?: SupportTicketPriority;
  messages?: SupportTicketMessage[];
  created_at?: string;
  updated_at?: string;
  closed_at?: string | null;
  resolved_at?: string | null;
};

export type CreateSupportTicketRequest = {
  category: SupportTicketCategory;
  subject: string;
  message: string;
};

export type AddSupportTicketMessageRequest = {
  message: string;
};

// ============================================
// MOBILE-D1: Registration + Student Account Request types
// ============================================

export type NormalRegisterPayload = {
  full_name: string;
  email?: string;
  phone_number: string;
  password: string;
  password_confirm: string;
};

export type NormalRegisterResponse = {
  success?: boolean;
  message?: string;
  data?: {
    requires_otp?: boolean;
    otp_purpose?: string;
    phone_verified?: boolean;
    requires_phone_verification?: boolean;
    next_step?: string;
    expires_in_seconds?: number;
    resend_after_seconds?: number;
  };
};

export type VerifyPhonePayload = {
  phone_number: string;
  code: string;
};

export type VerifyPhoneResponse = {
  success?: boolean;
  message?: string;
  data?: {
    phone_verified?: boolean;
    requires_phone_verification?: boolean;
    next_step?: string;
  };
};

export type StudentAccountRequestPayload = {
  full_name: string;
  email?: string;
  phone_number: string;
  whatsapp_phone?: string;
  university: string;
  faculty?: string;
  major?: string;
  student_number: string;
  password: string;
  password_confirm: string;
};

export type StudentAccountRequestResponse = {
  success?: boolean;
  message?: string;
  data?: {
    request_id?: string;
    status?: StudentAccountRequestStatus;
    next_step?: string;
  };
};

export type StudentAccountRequestStatus =
  | 'pending_review'
  | 'approved_pending_otp'
  | 'otp_sent'
  | 'active'
  | 'rejected'
  | 'needs_update'
  | 'expired';

export type StudentAccountRequestStatusResponse = {
  success?: boolean;
  message?: string;
  data?: {
    request_id?: string;
    status?: StudentAccountRequestStatus;
    public_message?: string;
    can_enter_otp?: boolean;
    can_resubmit?: boolean;
    rejection_reason?: string | null;
    needs_update_reason?: string | null;
  };
};

export type StudentVerifyOtpPayload = {
  code: string;
};

export type StudentVerifyOtpResponse = {
  success?: boolean;
  message?: string;
  data?: {
    status?: StudentAccountRequestStatus;
    next_step?: string;
  };
};
