import { useEffect, useState } from 'react';

import { AppScreen, LoadingState } from '../../../components';
import { useTranslation } from '../../../i18n';
import { StudentContextBlockedNavigator } from '../../../navigation/StudentContextBlockedNavigator';
import {
  STUDENT_CONTEXT_SLOW_MS,
  resolveStudentContextView,
} from '../../../navigation/guards/studentContextRecovery';
import { useNetworkStore } from '../../../offline/networkStore';
import { useStudentProfileStore } from '../../student-profile';
import { useVerificationStore } from '../../verification';

/**
 * Shown while the student's profile and verification resolve. It is never a dead end: a failed load, a device without a
 * connection, or a load that takes too long turn into a state with a retry and a way into the offline library.
 */
export function StudentContextLoadingScreen() {
  const { t } = useTranslation();
  const profileFailed = useStudentProfileStore((state) => state.loadFailed);
  const verificationFailed = useVerificationStore((state) => state.loadFailed);
  // Both hooks must run on every render: `a() || b()` skips b() while a() is true and changes the hook count.
  const profileLoading = useStudentProfileStore((state) => state.isBootstrapping);
  const verificationLoading = useVerificationStore((state) => state.isLoadingVerification);
  const isOnline = useNetworkStore((state) => state.isOnline);
  const isLoading = profileLoading || verificationLoading;
  const [slow, setSlow] = useState(false);
  // Once the blocked state has been shown it stays (a retry must not tear it down while the student reads a saved file).
  const [latched, setLatched] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setSlow(false);
      return undefined;
    }

    const timer = setTimeout(() => setSlow(true), STUDENT_CONTEXT_SLOW_MS);

    return () => clearTimeout(timer);
  }, [isLoading]);

  function handleRetry() {
    setSlow(false);
    void useStudentProfileStore.getState().bootstrap({ force: true });
    void useVerificationStore.getState().loadVerification({ force: true });
  }

  const view = resolveStudentContextView({
    isLoading,
    failed: profileFailed || verificationFailed,
    isOnline,
    slow,
  });

  useEffect(() => {
    if (view !== 'loading') {
      setLatched(true);
    }
  }, [view]);

  if (view !== 'loading' || latched) {
    return (
      <StudentContextBlockedNavigator
        onRetry={handleRetry}
        stuck={isLoading && slow && isOnline}
        view={view !== 'loading' ? view : isOnline ? 'error' : 'offline'}
      />
    );
  }

  return (
    <AppScreen horizontalPadding={false}>
      <LoadingState branded centered message={t.auth.bootstrap.preparingStudentAccount} />
    </AppScreen>
  );
}
