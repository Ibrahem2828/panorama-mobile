import { AppScreen, LoadingState } from '../../../components';
import { useTranslation } from '../../../i18n';

export function StudentContextLoadingScreen() {
  const { t } = useTranslation();

  return (
    <AppScreen horizontalPadding={false}>
      <LoadingState centered message={t.auth.bootstrap.preparingStudentAccount} title={t.appName} />
    </AppScreen>
  );
}
