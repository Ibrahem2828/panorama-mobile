import type { NavigatorScreenParams } from '@react-navigation/native';

export type PublicStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Login: undefined;
  RegisterStudent: undefined;
  OtpVerification: { phoneOrEmail?: string } | undefined;
  ForgotPassword: undefined;
  ResetPassword: { resetToken?: string } | undefined;
};

export type StudentSetupStackParamList = {
  AcademicProfileSetup: undefined;
  SubmitVerification: undefined;
  VerificationStatus: undefined;
};

export type HomeStackParamList = {
  Home: undefined;
  FilesList: undefined;
  FileDetails: { fileId: string | number };
  PdfViewer: { fileId: string | number; title?: string };
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

export type RootFlowMode = 'public' | 'studentSetup' | 'app';
