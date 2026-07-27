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

export type HomeStackParamList = {
  Home: undefined;
  FilesList: undefined;
  FileDetails: { fileId: string | number };
  PdfViewer: { fileId: string | number; title?: string };
  Search: { query?: string } | undefined;
};

export type SubjectsStackParamList = {
  SubjectsList: undefined;
  SubjectDetails: { subjectId: string | number };
};

export type GroupsStackParamList = {
  GroupsOverview: undefined;
  AvailableGroups: undefined;
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
};

export type ProfileStackParamList = {
  ProfileHome: undefined;
  EditProfile: undefined;
  AcademicInfo: undefined;
  Settings: undefined;
  ChangePassword: undefined;
  Notifications: undefined;
  SupportTickets: undefined;
  CreateSupportTicket: undefined;
  TicketDetails: { ticketId: string | number };
  PrivacyPolicy: undefined;
  Terms: undefined;
  About: undefined;
  FeedbackCenter: undefined;
  MyFeedback: undefined;
  PublicSuggestions: undefined;
};

export type SharedStackParamList = {
  FilesList: undefined;
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
