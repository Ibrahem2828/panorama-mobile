import type { NavigatorScreenParams } from '@react-navigation/native';

export type PublicStackParamList = {
  Onboarding: undefined;
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
};

export type StudentSetupStackParamList = {
  SetupFlow: undefined;
  AcademicProfileSetup: undefined;
  SubmitVerification: undefined;
  VerificationStatus: undefined;
};

export type LecturesListParams = { subjectId?: string | number } | undefined;
export type LectureViewerParams = { lectureId: string | number; title?: string; page?: number };

export type HomeStackParamList = {
  Home: undefined;
  AnnouncementsList: undefined;
  AnnouncementDetail: { announcementId: string | number };
  FilesList: { subjectId?: string | number; subjectName?: string } | undefined;
  FileDetails: { fileId: string | number };
  PdfViewer: { fileId: string | number; title?: string };
  Search: { query?: string } | undefined;
  LecturesList: LecturesListParams;
  LectureViewer: LectureViewerParams;
};

export type SubjectsStackParamList = {
  SubjectsList: undefined;
  SubjectDetails: { subjectId: string | number };
  LecturesList: LecturesListParams;
  LectureViewer: LectureViewerParams;
};

export type GroupsStackParamList = {
  GroupsOverview: undefined;
  AvailableGroups: { subjectId?: string | number } | undefined;
  MyGroups: undefined;
  GroupDetails: { groupId: string | number };
  GroupFiles: { groupId: string | number };
  FileDetails: { fileId: string | number };
  PdfViewer: { fileId: string | number; title?: string };
  ChatRoom: { groupId: string | number };
};

export type PrintingStackParamList = {
  PrintHome: undefined;
  CreatePrintOrder: { fileId?: string | number; fileTitle?: string } | undefined;
  PrintPriceSummary: undefined;
  MyPrintOrders: undefined;
  PrintOrderDetails: { orderId: string | number };
  PrintItemViewer: { itemId: string | number; title?: string };
};

export type ProfileStackParamList = {
  ProfileHome: undefined;
  EditProfile: undefined;
  AcademicInfo: undefined;
  Settings: undefined;
  ChangePassword: undefined;
  DeleteAccount: undefined;
  Notifications: undefined;
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
  PdfViewer: { fileId: string | number; title?: string };
  GroupFiles: { groupId: string | number };
  Search: { query?: string } | undefined;
};

export type AppTabsParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  SubjectsTab: NavigatorScreenParams<SubjectsStackParamList>;
  GroupsTab: NavigatorScreenParams<GroupsStackParamList>;
  PrintingTab: NavigatorScreenParams<PrintingStackParamList>;
  ProfileTab: NavigatorScreenParams<ProfileStackParamList>;
};

export type RootStackParamList = {
  Public: NavigatorScreenParams<PublicStackParamList>;
  StudentSetup: NavigatorScreenParams<StudentSetupStackParamList>;
  App: NavigatorScreenParams<AppTabsParamList>;
};

export type RootFlowMode = 'public' | 'studentSetup' | 'app' | 'accessDenied';
