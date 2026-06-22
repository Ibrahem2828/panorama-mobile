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

type VerificationStatusNavigation = NativeStackNavigationProp<
  StudentSetupStackParamList,
  'VerificationStatus'
>;

export function VerificationStatusScreen() {
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
        <AppHeader subtitle="إعداد الطالب" title="حالة التوثيق" />
        <StudentSetupStepper currentStep={3} />
        <LoadingState message="جاري تحميل حالة التوثيق..." />
      </AppScreen>
    );
  }

  if (errorMessage && !verification) {
    return (
      <AppScreen contentContainerStyle={styles.content} scroll>
        <AppHeader subtitle="إعداد الطالب" title="حالة التوثيق" />
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
            subtitle="تابع نتيجة مراجعة بطاقة الطالب، وأعد الإرسال عند الحاجة فقط."
            title="حالة التوثيق"
          />
          <StudentSetupStepper currentStep={3} />
        </Stack>

        <VerificationStatusCard verification={verification} />

        {status === 'none' ? (
          <AppButton
            fullWidth
            onPress={() => navigation.replace(StudentSetupRoutes.SubmitVerification)}
            title="إرسال بطاقة الطالب"
          />
        ) : null}

        {canResubmit ? (
          <AppButton
            fullWidth
            onPress={() => navigation.replace(StudentSetupRoutes.SubmitVerification)}
            title="إعادة إرسال صورة محدثة"
          />
        ) : null}

        {status === 'pending' ? (
          <AppCard padding="md" variant="muted">
            <AppText color="secondary" variant="bodySmall">
              سيتم إشعارك عند اكتمال المراجعة. يمكنك تحديث الحالة لاحقا دون إعادة إرسال الطلب.
            </AppText>
          </AppCard>
        ) : null}

        {status === 'pending' ? (
          <AppButton
            fullWidth
            loading={isLoadingVerification}
            onPress={handleRefresh}
            title="تحديث الحالة"
            variant="outline"
          />
        ) : null}

        {approved ? (
          <AppCard padding="md" variant="muted">
            <Stack gap="sm">
              <AppText color="success" variant="bodySmall" weight="600">
                تم قبول التوثيق بنجاح
              </AppText>
              <AppText color="secondary" variant="bodySmall">
                يمكنك الآن الدخول إلى التطبيق واستخدام جميع الخدمات الطلابية.
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
            title="الدخول إلى التطبيق"
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
