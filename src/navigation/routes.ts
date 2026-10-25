export const RootRoutes = {
  Public: 'Public',
  StudentSetup: 'StudentSetup',
  App: 'App',
} as const;

export const PublicRoutes = {
  Onboarding: 'Onboarding',
  Permissions: 'Permissions',
  Login: 'Login',
  AccountTypeChoice: 'AccountTypeChoice',
  RegisterStudent: 'RegisterStudent',
  NormalUserRegister: 'NormalUserRegister',
  OtpVerification: 'OtpVerification',
  ForgotPassword: 'ForgotPassword',
  ResetPassword: 'ResetPassword',
} as const;

export const StudentSetupRoutes = {
  SetupFlow: 'SetupFlow',
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
  AnnouncementsList: 'AnnouncementsList',
  AnnouncementDetail: 'AnnouncementDetail',
} as const;

export const SubjectsRoutes = {
  SubjectsList: 'SubjectsList',
  SubjectDetails: 'SubjectDetails',
} as const;

export const LecturesRoutes = {
  LecturesList: 'LecturesList',
  LectureViewer: 'LectureViewer',
} as const;

export const GroupsRoutes = {
  GroupsOverview: 'GroupsOverview',
  AvailableGroups: 'AvailableGroups',
  MyGroups: 'MyGroups',
  GroupDetails: 'GroupDetails',
  GroupFiles: 'GroupFiles',
  ChatRoom: 'ChatRoom',
  Enrollment: 'Enrollment',
} as const;

export const PrintingRoutes = {
  PrintHome: 'PrintHome',
  CreatePrintOrder: 'CreatePrintOrder',
  PrintPriceSummary: 'PrintPriceSummary',
  MyPrintOrders: 'MyPrintOrders',
  PrintOrderDetails: 'PrintOrderDetails',
  PrintItemViewer: 'PrintItemViewer',
  PrintProducts: 'PrintProducts',
} as const;

export const ProfileRoutes = {
  ProfileHome: 'ProfileHome',
  EditProfile: 'EditProfile',
  AcademicInfo: 'AcademicInfo',
  Settings: 'Settings',
  ChangePassword: 'ChangePassword',
  DeleteAccount: 'DeleteAccount',
  Notifications: 'Notifications',
  NotificationSettings: 'NotificationSettings',
  Permissions: 'Permissions',
  MyNotes: 'MyNotes',
  SupportTickets: 'SupportTickets',
  CreateSupportTicket: 'CreateSupportTicket',
  TicketDetails: 'TicketDetails',
  SupportAttachment: 'SupportAttachment',
  PrivacyPolicy: 'PrivacyPolicy',
  Terms: 'Terms',
  About: 'About',
  FeedbackCenter: 'FeedbackCenter',
  MyFeedback: 'MyFeedback',
  PublicSuggestions: 'PublicSuggestions',
} as const;

export const SharedRoutes = {
  FilesList: 'FilesList',
  FileDetails: 'FileDetails',
  PdfViewer: 'PdfViewer',
  GroupFiles: 'GroupFiles',
  Search: 'Search',
} as const;
