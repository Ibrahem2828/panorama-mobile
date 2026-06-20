import { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';

import { images } from '../../../assets/images';
import {
  AppButton,
  AppCard,
  AppHeader,
  AppScreen,
  AppText,
  ErrorState,
  LoadingState,
  Stack,
  SuccessState,
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
  const [submitSucceeded, setSubmitSucceeded] = useState(false);
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

      setSubmitSucceeded(true);
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

  if (submitSucceeded) {
    return (
      <AppScreen contentContainerStyle={styles.content} scroll>
        <AppHeader subtitle="إعداد الطالب" title="تم إرسال الطلب" />
        <StudentSetupStepper currentStep={2} />
        <SuccessState
          action={
            <AppButton
              fullWidth
              onPress={() => navigation.navigate(StudentSetupRoutes.VerificationStatus)}
              title="متابعة حالة التوثيق"
            />
          }
          illustrationLabel="رسم يوضح نجاح إرسال طلب التوثيق"
          illustrationSource={images.illustrations.success}
          message="تم استلام طلب التوثيق وسيتم مراجعته من الإدارة."
          title="تم إرسال طلب التوثيق"
        />
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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoid}
      >
        <Stack gap="xl">
          <Stack gap="md">
            <AppHeader
              subtitle="ارفع صورة واضحة لبطاقة الطالب من المعرض. التوثيق مطلوب للوصول إلى خدمات بانوراما."
              title={shouldResubmit ? 'إعادة إرسال التوثيق' : 'إرسال بطاقة الطالب'}
            />
            <StudentSetupStepper currentStep={2} />
          </Stack>

          <AppCard padding="md" variant="muted">
            <Stack gap="xs">
              <AppText variant="title">لماذا التوثيق؟</AppText>
              <AppText color="secondary" variant="bodySmall">
                يؤكد التوثيق هويتك كطالب جامعي ويفتح الوصول إلى الغروبات والملفات والطباعة والدعم.
                بعد الإرسال، ستراجع الإدارة طلبك وتصلك الحالة في هذه الشاشة.
              </AppText>
            </Stack>
          </AppCard>

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
                disabled={!selectedCardImage || isSubmitting}
                fullWidth
                loading={isSubmitting}
                onPress={handleSubmit}
                title={shouldResubmit ? 'إعادة إرسال الطلب' : 'إرسال طلب التوثيق'}
              />
            </Stack>
          )}
        </Stack>
      </KeyboardAvoidingView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
  },
  keyboardAvoid: {
    flex: 1,
  },
});
