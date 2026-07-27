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
  refresh?: string;
};

export type LoginRequest = {
  identifier: string;
  password: string;
};

export type OtpChannel = 'email' | 'phone';

export type RegisterStudentRequest = {
  full_name: string;
  phone_number: string;
  email: string;
  password: string;
  password_confirm: string;
  student_number?: string;
  otp_channel?: OtpChannel;
};

export type RegisterNormalRequest = Omit<RegisterStudentRequest, 'student_number'>;

export type RegisterResponse = {
  user: CurrentUser;
  otp_channel: OtpChannel;
  development_otp?: string;
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

export type OtpPurpose = 'verify_email' | 'verify_phone' | 'reset_password';

export type IdentityInput = {
  identifier: string;
  channel: OtpChannel;
};

export type SendOtpRequest = IdentityInput & { purpose: 'verify_email' | 'verify_phone' };
export type VerifyOtpRequest = IdentityInput & { purpose: OtpPurpose; code: string };
export type RequestPasswordResetRequest = IdentityInput;
export type ConfirmPasswordResetRequest = IdentityInput & {
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
  university?: EntityId | Record<string, unknown> | null;
  major?: EntityId | Record<string, unknown> | null;
  academic_year?: EntityId | Record<string, unknown> | null;
  semester?: EntityId | Record<string, unknown> | null;
  subject?: EntityId | Record<string, unknown> | null;
  has_whatsapp_channel?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type GroupWhatsAppTicket = {
  open_url: string;
  expires_at: string;
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
  file_type?: string | null;
  file_size?: number | null;
  pages_count?: number | null;
  preview_ticket_endpoint?: string | null;
  download_allowed?: boolean;
  is_printable?: boolean;
  is_active?: boolean;
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

export type FileAccessTicket = {
  preview_url: string;
  expires_at: string;
  download_allowed: false;
};

export type PrintOrderStatus =
  | 'submitted'
  | 'under_review'
  | 'accepted'
  | 'printing'
  | 'ready'
  | 'delivered'
  | 'cancelled'
  | 'rejected'
  | string;

export type PrintOrderItem = Record<string, unknown> & {
  id?: EntityId;
  source_file?: EntityId | Record<string, unknown> | null;
  source_file_title?: string | null;
  has_uploaded_file?: boolean;
  preview_ticket_endpoint?: string | null;
  original_file_name?: string | null;
  file_type?: string | null;
  file_size?: number | null;
  copies?: number;
  pages_count?: number | null;
  sheets_count?: number | null;
  color_mode?: PrintColorMode;
  paper_size?: PrintPaperSize;
  sides?: PrintSides;
  binding?: PrintBinding;
  unit_price?: string | number | null;
  binding_price?: string | number | null;
  price?: string | number | null;
  created_at?: string;
};

export type PrintOrderStatusHistory = {
  id: EntityId;
  old_status?: string | null;
  new_status: string;
  public_note?: string | null;
  created_at: string;
};

export type PrintOrder = ApiEntity & {
  status?: PrintOrderStatus;
  priority?: string | null;
  items?: PrintOrderItem[];
  status_history?: PrintOrderStatusHistory[];
  user_notes?: string | null;
  rejected_reason?: string | null;
  total_price?: string | number | null;
  currency?: string | null;
  price_calculated_at?: string | null;
  pickup_location?: EntityId | null;
  pickup_location_detail?: PrintPickupLocation | null;
  completed_at?: string | null;
  cancelled_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type PrintColorMode = 'black_white' | 'color';
export type PrintPaperSize = 'a4' | 'a3' | 'a5';
export type PrintSides = 'single' | 'double';
export type PrintBinding = 'none' | 'staple' | 'spiral' | 'thermal';

export type CreatePrintOrderItemInput = {
  source_file: EntityId;
  copies: number;
  color_mode: PrintColorMode;
  paper_size: PrintPaperSize;
  sides: PrintSides;
  binding: PrintBinding;
};

export type PrintQuoteRequest = { items: CreatePrintOrderItemInput[] };
export type PrintQuoteResponse = {
  total_price: string | number;
  currency: string;
  calculated_at: string;
  items: Array<{
    pages_count: number;
    sheets_count: number;
    unit_price: string | number;
    binding_price: string | number;
    subtotal: string | number;
    currency: string;
    pricing_snapshot?: Record<string, unknown>;
  }>;
};

export type PrintPickupLocation = ApiEntity & {
  name: string;
  address?: string | null;
  instructions?: string | null;
  is_active?: boolean;
  sort_order?: number;
};

export type CreatePrintOrderRequest = PrintQuoteRequest & {
  user_notes?: string;
  pickup_location?: EntityId | null;
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
