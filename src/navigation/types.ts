import type { NavigatorScreenParams } from '@react-navigation/native';

export type PublicStackParamList = {
  Onboarding: undefined;
  Permissions: undefined;
  Login: undefined;
  AccountTypeChoice: undefined;
  RegisterStudent: undefined;
  NormalUserRegister: undefined;
  OtpVerification: {
    identifier: string;
    channel: 'email' | 'phone';
    source: 'student_register' | 'normal_register';
  };
  ForgotPassword: undefined;
  ResetPassword: { identifier: string; channel: 'email' | 'phone' };
  DeviceLock: undefined;
};

export type StudentSetupStackParamList = {
  SetupFlow: undefined;
  AcademicProfileSetup: undefined;
  SubmitVerification: undefined;
  VerificationStatus: undefined;
};

export type LecturesListParams = { subjectId?: string | number } | undefined;
export type LectureViewerParams = {
  lectureId: string | number;
  title?: string;
  page?: number;
  /** Open the saved encrypted copy (works without internet). */
  offline?: boolean;
};

export type HomeStackParamList = {
  Home: undefined;
  AnnouncementsList: undefined;
  AnnouncementDetail: { announcementId: string | number };
  FilesList: { subjectId?: string | number; subjectName?: string } | undefined;
  FileDetails: { fileId: string | number };
  PdfViewer: { fileId: string | number; title?: string; offline?: boolean };
  Search: { query?: string } | undefined;
  LecturesList: LecturesListParams;
  LectureViewer: LectureViewerParams;
  Downloads: undefined;
};

export type SubjectsStackParamList = {
  SubjectsList: undefined;
  SubjectDetails: { subjectId: string | number };
  FilesList: { subjectId?: string | number; subjectName?: string } | undefined;
  FileDetails: { fileId: string | number };
  PdfViewer: { fileId: string | number; title?: string; offline?: boolean };
  LecturesList: LecturesListParams;
  LectureViewer: LectureViewerParams;
};

export type GroupsStackParamList = {
  GroupsOverview: undefined;
  MyGroups: undefined;
  GroupDetails: { groupId: string | number };
  GroupFiles: { groupId: string | number };
  FileDetails: { fileId: string | number };
  PdfViewer: { fileId: string | number; title?: string; offline?: boolean };
  ChatRoom: { groupId: string | number };
  Enrollment: undefined;
};

export type PrintingStackParamList = {
  PrintHome: undefined;
  CreatePrintOrder: { fileId?: string | number; fileTitle?: string } | undefined;
  PrintPriceSummary: undefined;
  MyPrintOrders: undefined;
  PrintOrderDetails: { orderId: string | number };
  PrintItemViewer: { itemId: string | number; title?: string };
  PrintProducts: undefined;
};

export type StoreStackParamList = {
  StoreHome: undefined;
  StoreProduct: { productId: string | number; name?: string };
  StoreCart: undefined;
  StoreOrderSuccess: { orderId: string | number };
  StoreOrders: undefined;
  StoreOrderDetails: { orderId: string | number };
};

export type ProfileStackParamList = {
  ProfileHome: undefined;
  EditProfile: undefined;
  AcademicInfo: undefined;
  Settings: undefined;
  ChangePassword: undefined;
  PhoneVerification: undefined;
  DeleteAccount: undefined;
  Notifications: undefined;
  NotificationSettings: undefined;
  MutedChats: undefined;
  Permissions: undefined;
  MyNotes: undefined;
  Downloads: undefined;
  LectureViewer: LectureViewerParams;
  PdfViewer: { fileId: string | number; title?: string; offline?: boolean };
  SupportTickets: undefined;
  CreateSupportTicket: undefined;
  TicketDetails: { ticketId: string | number };
  SupportAttachment: { messageId: string | number; title?: string };
  PrivacyPolicy: undefined;
  Terms: undefined;
  About: undefined;
  FeedbackCenter: undefined;
  MyFeedback: undefined;
  PublicSuggestions: undefined;
};

export type SharedStackParamList = {
  FilesList: { subjectId?: string | number; subjectName?: string } | undefined;
  FileDetails: { fileId: string | number };
  PdfViewer: { fileId: string | number; title?: string; offline?: boolean };
  GroupFiles: { groupId: string | number };
  Search: { query?: string } | undefined;
};

export type AppTabsParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  SubjectsTab: NavigatorScreenParams<SubjectsStackParamList>;
  GroupsTab: NavigatorScreenParams<GroupsStackParamList>;
  PrintingTab: NavigatorScreenParams<PrintingStackParamList>;
  StoreTab: NavigatorScreenParams<StoreStackParamList>;
  ProfileTab: NavigatorScreenParams<ProfileStackParamList>;
};

export type RootStackParamList = {
  Public: NavigatorScreenParams<PublicStackParamList>;
  StudentSetup: NavigatorScreenParams<StudentSetupStackParamList>;
  App: NavigatorScreenParams<AppTabsParamList>;
};

export type RootFlowMode = 'public' | 'studentSetup' | 'app' | 'accessDenied';
