import { AppScreen, LoadingState } from '../../../components';

export function StudentContextLoadingScreen() {
  return (
    <AppScreen horizontalPadding={false}>
      <LoadingState centered message="جاري تجهيز حسابك الطلابي..." title="بانوراما" />
    </AppScreen>
  );
}
