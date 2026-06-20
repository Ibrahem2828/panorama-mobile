import { AppCard, AppText, Stack } from '../../../components';

export function NormalUserIntroCard() {
  return (
    <AppCard padding="lg" variant="muted">
      <Stack gap="sm">
        <AppText variant="title">إكمال ملف الطالب</AppText>
        <AppText color="secondary" variant="bodySmall">
          يجب إكمال الملف الأكاديمي وتوثيق بطاقة الطالب قبل استخدام خدمات بانوراما للطلاب.
        </AppText>
      </Stack>
    </AppCard>
  );
}
