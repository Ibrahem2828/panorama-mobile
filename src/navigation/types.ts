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
};

export type SubjectsStackParamList = {
  SubjectsList: undefined;
  SubjectDetails: { subjectId: string };
};

export type GroupsStackParamList = {
  GroupsOverview: undefined;
  AvailableGroups: undefined;
  MyGroups: undefined;
  GroupDetails: { groupId: string };
  ChatRoom: { groupId: string };
};

export type PrintingStackParamList = {
  PrintHome: undefined;
  CreatePrintOrder: { fileId?: string } | undefined;
  PrintPriceSummary: { draftOrderId?: string } | undefined;
  MyPrintOrders: undefined;
  PrintOrderDetails: { orderId: string };
};

export type ProfileStackParamList = {
  ProfileHome: undefined;
  Settings: undefined;
  Notifications: undefined;
  SupportTickets: undefined;
  CreateSupportTicket: undefined;
  TicketDetails: { ticketId: string };
  PrivacyPolicy: undefined;
  Terms: undefined;
  About: undefined;
};

export type SharedStackParamList = {
  FilesList: { subjectId?: string; groupId?: string } | undefined;
  FileDetails: { fileId: string };
  PdfViewer: { fileId: string; title?: string };
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
