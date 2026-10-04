import { AppScreen, LoadingState } from '../../../components';
import { useTranslation } from '../../../i18n';

export function AuthBootstrapScreen() {
  const { t } = useTranslation();

  return (
    <AppScreen horizontalPadding={false}>
      <LoadingState centered message={t.auth.bootstrap.checkingSession} />
    </AppScreen>
  );
}
