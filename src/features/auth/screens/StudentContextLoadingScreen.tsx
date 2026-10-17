import { AppScreen, ErrorState, LoadingState } from '../../../components';
import { useTranslation } from '../../../i18n';
import { useStudentProfileStore } from '../../student-profile';
import { useVerificationStore } from '../../verification';

export function StudentContextLoadingScreen() {
  const { t } = useTranslation();
  const profileFailed = useStudentProfileStore((state) => state.loadFailed);
  const verificationFailed = useVerificationStore((state) => state.loadFailed);
  const isLoading =
    useStudentProfileStore((state) => state.isBootstrapping) ||
    useVerificationStore((state) => state.isLoadingVerification);

  function handleRetry() {
    void useStudentProfileStore.getState().bootstrap({ force: true });
    void useVerificationStore.getState().loadVerification({ force: true });
  }

  if (!isLoading && (profileFailed || verificationFailed)) {
    return (
      <AppScreen horizontalPadding={false}>
        <ErrorState
          message={t.auth.bootstrap.studentContextError}
          onRetry={handleRetry}
          title={t.appName}
        />
      </AppScreen>
    );
  }

  return (
    <AppScreen horizontalPadding={false}>
      <LoadingState centered message={t.auth.bootstrap.preparingStudentAccount} title={t.appName} />
    </AppScreen>
  );
}
