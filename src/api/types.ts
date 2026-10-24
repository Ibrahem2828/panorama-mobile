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
  /** Versions of the terms / privacy policy the user ticked (sent only when one is published). */
  accept_terms_version?: string;
  accept_privacy_version?: string;
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

/** Response of the WhatsApp launch call: a `whatsapp://` deep link, never the https invite link. */
export type GroupWhatsAppLaunch = {
  app_url: string;
};

/** Single-use credential for the chat WebSocket handshake (`?ticket=`). */
export type GroupChatTicket = {
  ticket: string;
  expires_at: string;
  websocket_path?: string;
};

export type GroupSummary = GroupRecord;

export type GroupJoinResult = Record<string, unknown> & {
  status?: string;
  group?: GroupRecord;
};

export type GroupMessageSenderDetail = {
  id: number;
  full_name?: string;
};

export type GroupMessage = ApiEntity & {
  sender_detail?: GroupMessageSenderDetail | null;
  message_type?: string;
  has_attachment?: boolean;
  attachment_ticket_endpoint?: string | null;
  reply_to?: number | null;
  is_deleted?: boolean;
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
  content: string;
  message_type?: 'text';
  /** Ignored by the backend; kept so older callers still type-check. */
  type?: 'message';
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
// Wire values match the backend's PaperSizeEnum / SidesEnum exactly (see docs/api/openapi.json).
export type PrintPaperSize = 'A4' | 'A3' | 'A5';
export type PrintSides = 'one_sided' | 'double_sided';
/** `none`, a built-in code (staple, spiral, thermal, beads) or any type the shop added; the server decides what is offered. */
export type PrintBinding = string;

export type CreatePrintOrderItemInput = {
  source_file?: EntityId;
  /** Reference to a Word/PowerPoint upload already converted to PDF by the server. */
  converted_upload?: string;
  copies: number;
  color_mode: PrintColorMode;
  paper_size: PrintPaperSize;
  sides: PrintSides;
  binding: PrintBinding;
  cover?: string;
  pages_per_sheet?: number;
  n_up_direction?: 'ltr' | 'rtl';
  duplex_flip?: 'long_edge' | 'short_edge';
  orientation?: 'auto' | 'portrait' | 'landscape';
  page_range?: string;
  collate?: boolean;
};

/** An item that is a ready-made product: its specification and price are fixed by the shop. */
export type CreatePrintProductItemInput = { product: EntityId; copies: number };

/** A Word/PowerPoint upload converted to PDF on the server (`status` is `pending` until the worker is done). */
export type PrintConversion = {
  id: string;
  status: 'pending' | 'ready' | 'failed';
  filename: string;
  pages_count: number | null;
  expires_at: string;
};

export type PrintCurrency = 'SYP' | 'USD';

export type PrintQuoteRequest = {
  items: (CreatePrintOrderItemInput | CreatePrintProductItemInput)[];
  /** Optional; the server defaults to SYP. */
  currency?: PrintCurrency;
};
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

export type PrintBindingType = {
  code: string;
  name: string;
  description: string;
  kind: string;
  price_mode: 'per_copy' | 'per_wire_kg';
  price_per_copy: string | number;
  price_per_kg: string | number;
};

export type PrintCoverOption = {
  code: string;
  name: string;
  color_hex: string;
  price_per_copy: string | number;
};

export type PrintOptionsResponse = {
  currency: string;
  pages_per_sheet: number[];
  orientations: string[];
  duplex_flips: string[];
  n_up_directions: string[];
  binding_types: PrintBindingType[];
  covers: PrintCoverOption[];
};

export type PrintProduct = {
  id: number;
  name: string;
  description: string;
  image_url: string | null;
  pages_count: number;
  paper_size: PrintPaperSize;
  color_mode: PrintColorMode;
  sides: PrintSides;
  binding: PrintBinding;
  cover: string;
  price: string | number;
  currency: string;
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
  title_ar?: string | null;
  title_en?: string | null;
  body_ar?: string | null;
  body_en?: string | null;
  /** App path chosen by the backend; validated before it is ever followed. */
  deep_link?: string | null;
  related_object_type?: string | null;
  related_object_id?: string | null;
  expires_at?: string | null;
};

export type NotificationPreferences = {
  in_app_enabled: boolean;
  push_enabled: boolean;
  disabled_types: string[];
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
  image?: string | null;
  link?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  target_user_type?: string | null;
  target_university?: number | null;
  target_faculty?: number | null;
  target_major?: number | null;
  target_academic_year?: number | null;
  target_semester?: number | null;
  created_by_name?: string | null;
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
