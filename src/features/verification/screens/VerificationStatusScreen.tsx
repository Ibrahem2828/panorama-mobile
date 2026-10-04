import { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StyleSheet } from 'react-native';

import {
  AppButton,
  AppCard,
  AppHeader,
  AppScreen,
  AppText,
  ErrorState,
  LoadingState,
  Stack,
} from '../../../components';
import { StudentSetupRoutes } from '../../../navigation/routes';
import type { StudentSetupStackParamList } from '../../../navigation/types';
import { spacing } from '../../../theme';
import { useStudentProfileStore } from '../../student-profile';
import { StudentSetupStepper } from '../../student-profile/components';
import { VerificationStatusCard } from '../components';
import {
  canResubmitVerification,
  getVerificationStatus,
  isVerificationApproved,
} from '../services';
import { useVerificationStore } from '../store';
import { useTranslation } from '../../../i18n';

type VerificationStatusNavigation = NativeStackNavigationProp<
  StudentSetupStackParamList,
  'VerificationStatus'
>;

export function VerificationStatusScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<VerificationStatusNavigation>();
  const verification = useVerificationStore((state) => state.verification);
  const hasLoadedVerification = useVerificationStore((state) => state.hasLoadedVerification);
  const isLoadingVerification = useVerificationStore((state) => state.isLoadingVerification);
  const errorMessage = useVerificationStore((state) => state.errorMessage);
  const loadVerification = useVerificationStore((state) => state.loadVerification);
  const bootstrapStudentProfile = useStudentProfileStore((state) => state.bootstrap);
  const status = getVerificationStatus(verification);
  const canResubmit = canResubmitVerification(verification);
  const approved = isVerificationApproved(verification);

  useEffect(() => {
    void loadVerification();
  }, [loadVerification]);

  function handleRefresh() {
    void loadVerification({ force: true });
  }

  async function handleEnterApp() {
    await Promise.all([
      bootstrapStudentProfile({ force: true }),
      loadVerification({ force: true }),
    ]);
  }

  if (isLoadingVerification && !hasLoadedVerification) {
    return (
      <AppScreen contentContainerStyle={styles.content} scroll>
        <AppHeader subtitle={t.verificationFlow.subtitle} title={t.verificationFlow.status.title} />
        <StudentSetupStepper currentStep={3} />
        <LoadingState message={t.verificationFlow.loading} />
      </AppScreen>
    );
  }

  if (errorMessage && !verification) {
    return (
      <AppScreen contentContainerStyle={styles.content} scroll>
        <AppHeader subtitle={t.verificationFlow.subtitle} title={t.verificationFlow.status.title} />
        <StudentSetupStepper currentStep={3} />
        <ErrorState message={errorMessage} onRetry={handleRefresh} />
      </AppScreen>
    );
  }

  return (
    <AppScreen contentContainerStyle={styles.content} scroll>
      <Stack gap="xl">
        <Stack gap="md">
          <AppHeader
            subtitle={t.verificationFlow.status.cardSubtitle}
            title={t.verificationFlow.status.title}
          />
          <StudentSetupStepper currentStep={3} />
        </Stack>

        <VerificationStatusCard verification={verification} />

        {status === 'none' ? (
          <AppButton
            fullWidth
            onPress={() => navigation.replace(StudentSetupRoutes.SubmitVerification)}
            title={t.verificationFlow.status.sendCard}
          />
        ) : null}

        {canResubmit ? (
          <AppButton
            fullWidth
            onPress={() => navigation.replace(StudentSetupRoutes.SubmitVerification)}
            title={t.verificationFlow.status.resendUpdated}
          />
        ) : null}

        {status === 'pending' ? (
          <AppCard padding="md" variant="muted">
            <AppText color="secondary" variant="bodySmall">
              {t.verificationFlow.status.pendingNote}
            </AppText>
          </AppCard>
        ) : null}

        {status === 'pending' ? (
          <AppButton
            fullWidth
            loading={isLoadingVerification}
            onPress={handleRefresh}
            title={t.verificationFlow.status.refreshStatus}
            variant="outline"
          />
        ) : null}

        {approved ? (
          <AppCard padding="md" variant="muted">
            <Stack gap="sm">
              <AppText color="success" variant="bodySmall" weight="600">
                {t.verificationFlow.status.approvedTitle}
              </AppText>
              <AppText color="secondary" variant="bodySmall">
                {t.verificationFlow.status.approvedDescription}
              </AppText>
            </Stack>
          </AppCard>
        ) : null}

        {approved ? (
          <AppButton
            fullWidth
            loading={isLoadingVerification}
            onPress={() => {
              void handleEnterApp();
            }}
            title={t.verificationFlow.status.enterApp}
          />
        ) : null}

        {errorMessage && verification ? (
          <ErrorState message={errorMessage} onRetry={handleRefresh} />
        ) : null}
      </Stack>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
  },
});
