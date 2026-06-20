import { AppCard, AppText, Stack } from '../../../components';
import type { StudentProfile } from '../../student-profile';

type HomeAcademicSummaryCardProps = {
  profile: StudentProfile | null;
};

function getAcademicValue(value?: { name?: string } | null): string {
  return value?.name ?? 'غير محدد';
}

export function HomeAcademicSummaryCard({ profile }: HomeAcademicSummaryCardProps) {
  if (!profile) {
    return null;
  }

  return (
    <AppCard padding="lg" variant="default">
      <Stack gap="md">
        <AppText variant="title">ملخصك الأكاديمي</AppText>
        <Stack gap="xs">
          <AppText color="secondary" variant="bodySmall">
            الجامعة: {getAcademicValue(profile.university)}
          </AppText>
          <AppText color="secondary" variant="bodySmall">
            الكلية: {getAcademicValue(profile.faculty)}
          </AppText>
          <AppText color="secondary" variant="bodySmall">
            الاختصاص: {getAcademicValue(profile.major)}
          </AppText>
        </Stack>
      </Stack>
    </AppCard>
  );
}
