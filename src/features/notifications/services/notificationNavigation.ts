import { navigationRef } from '../../../navigation/navigationRef';
import {
  GroupsRoutes,
  HomeRoutes,
  PrintingRoutes,
  ProfileRoutes,
  RootRoutes,
  SharedRoutes,
  SubjectsRoutes,
  TabRoutes,
} from '../../../navigation/routes';
import type { NotificationRouteIntent } from '../types';

type Destination = {
  tab: (typeof TabRoutes)[keyof typeof TabRoutes];
  screen?: string;
  params?: Record<string, unknown>;
};

function destinationFor(intent: NotificationRouteIntent): Destination | null {
  switch (intent.kind) {
    case 'home':
      return { tab: TabRoutes.Home, screen: HomeRoutes.Home };
    case 'announcements':
      return { tab: TabRoutes.Home, screen: HomeRoutes.AnnouncementsList };
    case 'announcement':
      return {
        tab: TabRoutes.Home,
        screen: HomeRoutes.AnnouncementDetail,
        params: { announcementId: intent.announcementId },
      };
    case 'files':
      return { tab: TabRoutes.Home, screen: SharedRoutes.FilesList };
    case 'file':
      return {
        tab: TabRoutes.Home,
        screen: SharedRoutes.FileDetails,
        params: { fileId: intent.fileId },
      };
    case 'search':
      return { tab: TabRoutes.Home, screen: SharedRoutes.Search };
    case 'subjects':
      return { tab: TabRoutes.Subjects, screen: SubjectsRoutes.SubjectsList };
    case 'subject':
      return {
        tab: TabRoutes.Subjects,
        screen: SubjectsRoutes.SubjectDetails,
        params: { subjectId: intent.subjectId },
      };
    case 'groups':
      return { tab: TabRoutes.Groups, screen: GroupsRoutes.GroupsOverview };
    case 'myGroups':
      return { tab: TabRoutes.Groups, screen: GroupsRoutes.MyGroups };
    case 'group':
      return {
        tab: TabRoutes.Groups,
        screen: GroupsRoutes.GroupDetails,
        params: { groupId: intent.groupId },
      };
    case 'groupChat':
      return {
        tab: TabRoutes.Groups,
        screen: GroupsRoutes.ChatRoom,
        params: { groupId: intent.groupId },
      };
    case 'groupFiles':
      return {
        tab: TabRoutes.Groups,
        screen: GroupsRoutes.GroupFiles,
        params: { groupId: intent.groupId },
      };
    case 'printingHome':
      return { tab: TabRoutes.Printing, screen: PrintingRoutes.PrintHome };
    case 'printingNew':
      return { tab: TabRoutes.Printing, screen: PrintingRoutes.CreatePrintOrder };
    case 'printingOrders':
      return { tab: TabRoutes.Printing, screen: PrintingRoutes.MyPrintOrders };
    case 'printingOrder':
      return {
        tab: TabRoutes.Printing,
        screen: PrintingRoutes.PrintOrderDetails,
        params: { orderId: intent.orderId },
      };
    case 'supportList':
      return { tab: TabRoutes.Profile, screen: ProfileRoutes.SupportTickets };
    case 'supportNew':
      return { tab: TabRoutes.Profile, screen: ProfileRoutes.CreateSupportTicket };
    case 'supportTicket':
      return {
        tab: TabRoutes.Profile,
        screen: ProfileRoutes.TicketDetails,
        params: { ticketId: intent.ticketId },
      };
    case 'feedback':
      return { tab: TabRoutes.Profile, screen: ProfileRoutes.FeedbackCenter };
    case 'profile':
      return { tab: TabRoutes.Profile, screen: ProfileRoutes.ProfileHome };
    case 'editProfile':
      return { tab: TabRoutes.Profile, screen: ProfileRoutes.EditProfile };
    case 'academicInfo':
      return { tab: TabRoutes.Profile, screen: ProfileRoutes.AcademicInfo };
    case 'settings':
      return { tab: TabRoutes.Profile, screen: ProfileRoutes.Settings };
    case 'notifications':
      return { tab: TabRoutes.Profile, screen: ProfileRoutes.Notifications };
    default:
      // Verification lives in the setup flow (unreachable once verified) and `none` has no screen.
      return null;
  }
}

/**
 * Opens the screen an intent points at. Returns false when there is nowhere to go (so the
 * caller can fall back to the notifications list or show a hint).
 */
export function navigateToNotificationIntent(intent: NotificationRouteIntent): boolean {
  const destination = destinationFor(intent);

  if (!destination || !navigationRef.isReady()) {
    return false;
  }

  // The destination object is built from the closed set above, so its shape is safe to cast.
  (navigationRef.navigate as (...args: unknown[]) => void)(RootRoutes.App, {
    screen: destination.tab,
    params: destination.screen
      ? { screen: destination.screen, params: destination.params }
      : undefined,
  });

  return true;
}
