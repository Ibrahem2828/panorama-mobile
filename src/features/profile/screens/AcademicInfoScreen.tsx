import { useEffect } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet } from 'react-native';

import {
  AppButton,
  AppCard,
  AppHeader,
  AppScreen,
  AppText,
  EmptyState,
  ErrorState,
  LoadingState,
  Stack,
} from '../../../components';
import type { ProfileStackParamList } from '../../../navigation/types';
import { spacing } from '../../../theme';
import {
  getStudentProfileAcademicYear,
  getStudentProfileStudentNumber,
  isStudentProfileComplete,
} from '../../student-profile/services';
import { useStudentProfileStore } from '../../student-profile/store';
import { getVerificationStatus, isVerificationApproved } from '../../verification/services';
import { useVerificationStore } from '../../verification/store';
import { AcademicInfoCard } from '../components';
import { getVerificationStatusLabel } from '../services';
import { useTranslation } from '../../../i18n';

type AcademicInfoScreenProps = NativeStackScreenProps<ProfileStackParamList, 'AcademicInfo'>;

function getOptionName(option: { name?: string } | null | undefined, fallback: string): string {
  return option?.name ?? fallback;
}

function getVerificationStatusVariant(status?: string | null) {
  switch (status) {
    case 'approved':
      return 'success' as const;
    case 'pending':
      return 'warning' as const;
    case 'rejected':
    case 'needs_update':
      return 'error' as const;
    default:
      return 'neutral' as const;
  }
}

export function AcademicInfoScreen({ navigation }: AcademicInfoScreenProps) {
  const { t } = useTranslation();
  const profile = useStudentProfileStore((state) => state.profile);
  const isBootstrapping = useStudentProfileStore((state) => state.isBootstrapping);
  const profileError = useStudentProfileStore((state) => state.errorMessage);
  const bootstrap = useStudentProfileStore((state) => state.bootstrap);
  const verification = useVerificationStore((state) => state.verification);
  const isLoadingVerification = useVerificationStore((state) => state.isLoadingVerification);
  const verificationError = useVerificationStore((state) => state.errorMessage);
  const loadVerification = useVerificationStore((state) => state.loadVerification);

  useEffect(() => {
    void bootstrap();
    void loadVerification();
  }, [bootstrap, loadVerification]);

  function handleRetry() {
    void bootstrap({ force: true });
    void loadVerification({ force: true });
  }

  const status = getVerificationStatus(verification);
  const hasProfile = isStudentProfileComplete(profile);
  const showLoading = (isBootstrapping || isLoadingVerification) && !profile;

  return (
    <AppScreen contentContainerStyle={styles.content} scroll>
      <Stack gap="xl">
        <Stack gap="md">
          <AppHeader subtitle={t.profile.academic.subtitle} title={t.profile.academic.title} />
          <AppButton onPress={() => navigation.goBack()} title={t.common.back} variant="ghost" />
        </Stack>

        {showLoading ? <LoadingState message={t.profile.academic.loading} /> : null}

        {profileError || verificationError ? (
          <ErrorState
            message={profileError ?? verificationError ?? undefined}
            onRetry={handleRetry}
          />
        ) : null}

        {hasProfile ? (
          <Stack gap="lg">
            <AcademicInfoCard
              fields={[
                {
                  label: t.profile.academic.university,
                  value: getOptionName(profile?.university, t.common.notSpecified),
                },
                {
                  label: t.profile.academic.faculty,
                  value: getOptionName(profile?.faculty, t.common.notSpecified),
                },
                {
                  label: t.profile.academic.major,
                  value: getOptionName(profile?.major, t.common.notSpecified),
                },
                {
                  label: t.profile.academic.year,
                  value: getOptionName(
                    getStudentProfileAcademicYear(profile),
                    t.common.notSpecified,
                  ),
                },
                {
                  label: t.profile.academic.semester,
                  value: getOptionName(profile?.semester, t.common.notSpecified),
                },
                {
                  label: t.profile.academic.studentNumber,
                  value: getStudentProfileStudentNumber(profile) ?? t.common.notSpecified,
                },
              ]}
              note={
                isVerificationApproved(verification)
                  ? t.profile.academic.verifiedNote
                  : t.profile.academic.readOnlyNote
              }
              statusLabel={getVerificationStatusLabel(status, t.verification, t.common.unknown)}
              statusVariant={getVerificationStatusVariant(status)}
            />

            <AppCard variant="muted">
              <AppText color="secondary" variant="bodySmall">
                {t.profile.academic.privacyNote}
              </AppText>
            </AppCard>
          </Stack>
        ) : (
          <EmptyState
            message={t.profile.academic.incompleteMessage}
            title={t.profile.academic.incompleteTitle}
          />
        )}
      </Stack>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
  },
});
