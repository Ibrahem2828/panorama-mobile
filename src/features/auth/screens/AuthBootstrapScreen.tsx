import { AppScreen, LoadingState } from '../../../components';

export function AuthBootstrapScreen() {
  return (
    <AppScreen horizontalPadding={false}>
      <LoadingState centered message="جاري التحقق من الجلسة..." />
    </AppScreen>
  );
}
