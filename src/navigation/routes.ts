export const RootRoutes = {
  Public: 'Public',
  StudentSetup: 'StudentSetup',
  App: 'App',
} as const;

export const PublicRoutes = {
  Splash: 'Splash',
  Onboarding: 'Onboarding',
  Login: 'Login',
  RegisterStudent: 'RegisterStudent',
  OtpVerification: 'OtpVerification',
  ForgotPassword: 'ForgotPassword',
  ResetPassword: 'ResetPassword',
} as const;

export const StudentSetupRoutes = {
  AcademicProfileSetup: 'AcademicProfileSetup',
  SubmitVerification: 'SubmitVerification',
  VerificationStatus: 'VerificationStatus',
} as const;

export const TabRoutes = {
  Home: 'HomeTab',
  Subjects: 'SubjectsTab',
  Groups: 'GroupsTab',
  Printing: 'PrintingTab',
  Profile: 'ProfileTab',
} as const;

export const HomeRoutes = {
  Home: 'Home',
} as const;

export const SubjectsRoutes = {
  SubjectsList: 'SubjectsList',
  SubjectDetails: 'SubjectDetails',
} as const;

export const GroupsRoutes = {
  GroupsOverview: 'GroupsOverview',
  AvailableGroups: 'AvailableGroups',
  MyGroups: 'MyGroups',
  GroupDetails: 'GroupDetails',
  GroupFiles: 'GroupFiles',
  ChatRoom: 'ChatRoom',
} as const;

export const PrintingRoutes = {
  PrintHome: 'PrintHome',
  CreatePrintOrder: 'CreatePrintOrder',
  PrintPriceSummary: 'PrintPriceSummary',
  MyPrintOrders: 'MyPrintOrders',
  PrintOrderDetails: 'PrintOrderDetails',
} as const;

export const ProfileRoutes = {
  ProfileHome: 'ProfileHome',
  EditProfile: 'EditProfile',
  AcademicInfo: 'AcademicInfo',
  Settings: 'Settings',
  ChangePassword: 'ChangePassword',
  Notifications: 'Notifications',
  SupportTickets: 'SupportTickets',
  CreateSupportTicket: 'CreateSupportTicket',
  TicketDetails: 'TicketDetails',
  PrivacyPolicy: 'PrivacyPolicy',
  Terms: 'Terms',
  About: 'About',
} as const;

export const SharedRoutes = {
  FilesList: 'FilesList',
  FileDetails: 'FileDetails',
  PdfViewer: 'PdfViewer',
  GroupFiles: 'GroupFiles',
  Search: 'Search',
} as const;
