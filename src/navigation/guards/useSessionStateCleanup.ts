import { useEffect } from 'react';

import { useAuthStore } from '../../features/auth/store';
import { useChatStore } from '../../features/chat/store';
import { useFilesStore } from '../../features/files/store';
import { useGroupsStore } from '../../features/groups/store';
import { useHomeStore } from '../../features/home/store';
import { useNotificationsStore } from '../../features/notifications/store';
import { usePrintingStore } from '../../features/printing/store';
import { useProfileStore } from '../../features/profile/store';
import { useSettingsStore } from '../../features/settings/store';
import { useStudentProfileStore } from '../../features/student-profile';
import { useSubjectsStore } from '../../features/subjects/store';
import { useSupportStore } from '../../features/support/store';
import { useVerificationStore } from '../../features/verification';

export function useSessionStateCleanup() {
  const status = useAuthStore((state) => state.status);
  const resetChat = useChatStore((state) => state.reset);
  const resetFiles = useFilesStore((state) => state.reset);
  const resetGroups = useGroupsStore((state) => state.reset);
  const resetHome = useHomeStore((state) => state.reset);
  const resetNotifications = useNotificationsStore((state) => state.reset);
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

    resetChat();
    resetFiles();
    resetGroups();
    resetHome();
    resetNotifications();
    resetPrinting();
    resetProfile();
    resetSettings();
    resetStudentProfile();
    resetSubjects();
    resetSupport();
    resetVerification();
  }, [
    resetChat,
    resetFiles,
    resetGroups,
    resetHome,
    resetNotifications,
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
