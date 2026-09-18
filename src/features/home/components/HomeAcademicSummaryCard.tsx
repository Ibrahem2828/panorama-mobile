import { AppCard, AppText, Stack } from '../../../components';
import { useTranslation } from '../../../i18n';
import type { StudentProfile } from '../../student-profile';

type HomeAcademicSummaryCardProps = {
  profile: StudentProfile | null;
};

function getAcademicValue(value: { name?: string } | null | undefined, fallback: string): string {
  return value?.name ?? fallback;
}

export function HomeAcademicSummaryCard({ profile }: HomeAcademicSummaryCardProps) {
  const { t } = useTranslation();
  if (!profile) {
    return null;
  }

  return (
    <AppCard padding="lg" variant="default">
      <Stack gap="md">
        <AppText variant="title">{t.home.academicSummary.title}</AppText>
        <Stack gap="xs">
          <AppText color="secondary" variant="bodySmall">
            {t.home.academicSummary.university(
              getAcademicValue(profile.university, t.common.notSpecified),
            )}
          </AppText>
          <AppText color="secondary" variant="bodySmall">
            {t.home.academicSummary.faculty(
              getAcademicValue(profile.faculty, t.common.notSpecified),
            )}
          </AppText>
          <AppText color="secondary" variant="bodySmall">
            {t.home.academicSummary.major(getAcademicValue(profile.major, t.common.notSpecified))}
          </AppText>
        </Stack>
      </Stack>
    </AppCard>
  );
}
