import { useEffect } from 'react';

import { useAnnouncementsStore } from '../../features/announcements/store';
import { useAuthStore } from '../../features/auth/store';
import { useChatStore } from '../../features/chat/store';
import { useFilesStore } from '../../features/files/store';
import { useGroupsStore } from '../../features/groups/store';
import { useHomeStore } from '../../features/home/store';
import {
  useNotificationPrefsStore,
  useNotificationsStore,
} from '../../features/notifications/store';
import { useChatUnreadStore } from '../../features/chat/store/unreadStore';
import { usePoliciesStore } from '../../features/policies';
import { usePrintingStore } from '../../features/printing/store';
import { useProfileStore } from '../../features/profile/store';
import { useSettingsStore } from '../../features/settings/store';
import { useStudentProfileStore } from '../../features/student-profile';
import { useSubjectsStore } from '../../features/subjects/store';
import { useSupportStore } from '../../features/support/store';
import { useVerificationStore } from '../../features/verification';

export function useSessionStateCleanup() {
  const status = useAuthStore((state) => state.status);
  const resetAnnouncements = useAnnouncementsStore((state) => state.reset);
  const resetChat = useChatStore((state) => state.reset);
  const resetFiles = useFilesStore((state) => state.reset);
  const resetGroups = useGroupsStore((state) => state.reset);
  const resetHome = useHomeStore((state) => state.reset);
  const resetNotifications = useNotificationsStore((state) => state.reset);
  const resetNotificationPrefs = useNotificationPrefsStore((state) => state.reset);
  const resetChatUnread = useChatUnreadStore((state) => state.reset);
  const resetPolicies = usePoliciesStore((state) => state.reset);
  const resetPrinting = usePrintingStore((state) => state.reset);
  const resetProfile = useProfileStore((state) => state.reset);
  const resetSettings = useSettingsStore((state) => state.reset);
  const resetStudentProfile = useStudentProfileStore((state) => state.reset);
  const resetSubjects = useSubjectsStore((state) => state.reset);
  const resetSupport = useSupportStore((state) => state.reset);
  const resetVerification = useVerificationStore((state) => state.reset);

  useEffect(() => {
    if (status === 'authenticated') {
      return;
    }

    resetAnnouncements();
    resetChat();
    resetFiles();
    resetGroups();
    resetHome();
    resetNotifications();
    resetNotificationPrefs();
    resetChatUnread();
    resetPolicies();
    resetPrinting();
    resetProfile();
    resetSettings();
    resetStudentProfile();
    resetSubjects();
    resetSupport();
    resetVerification();
  }, [
    resetAnnouncements,
    resetChat,
    resetFiles,
    resetGroups,
    resetHome,
    resetNotifications,
    resetNotificationPrefs,
    resetChatUnread,
    resetPolicies,
    resetPrinting,
    resetProfile,
    resetSettings,
    resetStudentProfile,
    resetSubjects,
    resetSupport,
    resetVerification,
    status,
  ]);
}
