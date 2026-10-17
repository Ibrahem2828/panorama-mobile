import { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StyleSheet, View } from 'react-native';

import {
  AppButton,
  AppCard,
  AppText,
  ErrorState,
  FormScreen,
  LoadingState,
} from '../../../components';
import { StudentSetupRoutes } from '../../../navigation/routes';
import type { StudentSetupStackParamList } from '../../../navigation/types';
import { spacing } from '../../../theme';
import { useStudentProfileStore } from '../../student-profile';
import { SetupHeader } from '../../student-profile/components';
import { VerificationStatusCard, VerificationTimeline } from '../components';
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

  const header = (
    <SetupHeader
      step={3}
      subtitle={t.verificationFlow.status.cardSubtitle}
      title={t.verificationFlow.status.title}
    />
  );

  if (isLoadingVerification && !hasLoadedVerification) {
    return (
      <FormScreen>
        {header}
        <LoadingState message={t.verificationFlow.loading} />
      </FormScreen>
    );
  }

  if (errorMessage && !verification) {
    return (
      <FormScreen>
        {header}
        <ErrorState message={errorMessage} onRetry={handleRefresh} />
      </FormScreen>
    );
  }

  // One primary action per state.
  const footer = approved ? (
    <AppButton
      fullWidth
      loading={isLoadingVerification}
      onPress={() => {
        void handleEnterApp();
      }}
      size="lg"
      title={t.verificationFlow.status.enterApp}
    />
  ) : status === 'none' ? (
    <AppButton
      fullWidth
      onPress={() => navigation.replace(StudentSetupRoutes.SubmitVerification)}
      size="lg"
      title={t.verificationFlow.status.sendCard}
    />
  ) : canResubmit ? (
    <AppButton
      fullWidth
      onPress={() => navigation.replace(StudentSetupRoutes.SubmitVerification)}
      size="lg"
      title={t.verificationFlow.status.resendUpdated}
    />
  ) : (
    <AppButton
      fullWidth
      loading={isLoadingVerification}
      onPress={handleRefresh}
      size="lg"
      title={t.verificationFlow.status.refreshStatus}
      variant="outline"
    />
  );

  return (
    <FormScreen footer={footer}>
      {header}

      <VerificationStatusCard verification={verification} />

      <AppCard padding="lg" variant="default">
        <VerificationTimeline status={status} />
      </AppCard>

      {status === 'pending' ? (
        <View style={styles.note}>
          <AppText align="center" color="secondary" variant="bodySmall">
            {t.verificationFlow.status.pendingNote}
          </AppText>
        </View>
      ) : null}

      {approved ? (
        <View style={styles.note}>
          <AppText align="center" color="secondary" variant="bodySmall">
            {t.verificationFlow.status.approvedDescription}
          </AppText>
        </View>
      ) : null}

      {errorMessage && verification ? (
        <ErrorState message={errorMessage} onRetry={handleRefresh} />
      ) : null}
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  note: {
    paddingHorizontal: spacing.md,
  },
});
