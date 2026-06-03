import { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StyleSheet } from 'react-native';

import {
  AppButton,
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
import { StudentSetupStepper } from '../../student-profile/components';
import { VerificationCardImagePicker, VerificationStatusCard } from '../components';
import {
  canResubmitVerification,
  getVerificationStatus,
  isVerificationApproved,
} from '../services';
import { useVerificationStore } from '../store';

type SubmitVerificationNavigation = NativeStackNavigationProp<
  StudentSetupStackParamList,
  'SubmitVerification'
>;

export function SubmitVerificationScreen() {
  const navigation = useNavigation<SubmitVerificationNavigation>();
  const verification = useVerificationStore((state) => state.verification);
  const selectedCardImage = useVerificationStore((state) => state.selectedCardImage);
  const hasLoadedVerification = useVerificationStore((state) => state.hasLoadedVerification);
  const isLoadingVerification = useVerificationStore((state) => state.isLoadingVerification);
  const isSubmitting = useVerificationStore((state) => state.isSubmitting);
  const errorMessage = useVerificationStore((state) => state.errorMessage);
  const loadVerification = useVerificationStore((state) => state.loadVerification);
  const setSelectedCardImage = useVerificationStore((state) => state.setSelectedCardImage);
  const submitVerification = useVerificationStore((state) => state.submitVerification);
  const resubmitVerification = useVerificationStore((state) => state.resubmitVerification);
  const verificationStatus = getVerificationStatus(verification);
  const shouldResubmit = canResubmitVerification(verification);
  const isReadOnlyStatus = verificationStatus === 'pending' || isVerificationApproved(verification);

  useEffect(() => {
    void loadVerification();
  }, [loadVerification]);

  async function handleSubmit() {
    try {
      if (shouldResubmit) {
        await resubmitVerification();
      } else {
        await submitVerification();
      }

      navigation.navigate(StudentSetupRoutes.VerificationStatus);
    } catch {
      // The verification store owns the user-facing error message.
    }
  }

  if (isLoadingVerification && !hasLoadedVerification) {
    return (
      <AppScreen contentContainerStyle={styles.content} scroll>
        <AppHeader subtitle="إعداد الطالب" title="إرسال بطاقة الطالب" />
        <StudentSetupStepper currentStep={2} />
        <LoadingState message="جاري تحميل حالة التوثيق..." />
      </AppScreen>
    );
  }

  if (errorMessage && !hasLoadedVerification) {
    return (
      <AppScreen contentContainerStyle={styles.content} scroll>
        <AppHeader subtitle="إعداد الطالب" title="إرسال بطاقة الطالب" />
        <StudentSetupStepper currentStep={2} />
        <ErrorState
          message={errorMessage}
          onRetry={() => {
            void loadVerification({ force: true });
          }}
        />
      </AppScreen>
    );
  }

  return (
    <AppScreen contentContainerStyle={styles.content} scroll>
      <Stack gap="xl">
        <Stack gap="md">
          <AppHeader
            subtitle="ارفع صورة بطاقة الطالب من المعرض ليتم ربطها بطلب التوثيق."
            title={shouldResubmit ? 'إعادة إرسال التوثيق' : 'إرسال بطاقة الطالب'}
          />
          <StudentSetupStepper currentStep={2} />
        </Stack>

        {verification ? <VerificationStatusCard verification={verification} /> : null}

        {isReadOnlyStatus ? (
          <Stack gap="md">
            <AppText color="secondary" variant="bodySmall">
              لا يمكن إرسال طلب جديد أثناء هذه الحالة. تابع صفحة الحالة للتحديثات.
            </AppText>
            <AppButton
              fullWidth
              onPress={() => navigation.navigate(StudentSetupRoutes.VerificationStatus)}
              title="متابعة حالة التوثيق"
              variant="outline"
            />
          </Stack>
        ) : (
          <Stack gap="lg">
            <VerificationCardImagePicker
              disabled={isSubmitting}
              onChange={setSelectedCardImage}
              selectedImage={selectedCardImage}
            />

            {errorMessage ? (
              <AppText color="error" variant="bodySmall">
                {errorMessage}
              </AppText>
            ) : null}

            <AppButton
              fullWidth
              loading={isSubmitting}
              onPress={handleSubmit}
              title={shouldResubmit ? 'إعادة إرسال الطلب' : 'إرسال طلب التوثيق'}
            />
          </Stack>
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
