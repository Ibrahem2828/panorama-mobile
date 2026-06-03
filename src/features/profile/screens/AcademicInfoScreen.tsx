import { useEffect } from 'react';
import { CommonActions } from '@react-navigation/native';
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
import { RootRoutes, StudentSetupRoutes } from '../../../navigation/routes';
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

type AcademicInfoScreenProps = NativeStackScreenProps<ProfileStackParamList, 'AcademicInfo'>;

function getOptionName(option: { name?: string } | null | undefined): string {
  return option?.name ?? 'غير محدد';
}

function getVerificationStatusLabel(status?: string | null): string {
  switch (status) {
    case 'approved':
      return 'موثق';
    case 'pending':
      return 'قيد المراجعة';
    case 'rejected':
      return 'مرفوض';
    case 'needs_update':
      return 'بحاجة إلى تحديث';
    default:
      return 'غير مقدم';
  }
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

  function handleSetupPress() {
    navigation
      .getParent()
      ?.getParent()
      ?.dispatch(
        CommonActions.navigate(RootRoutes.StudentSetup, {
          screen: StudentSetupRoutes.AcademicProfileSetup,
        }),
      );
  }

  const status = getVerificationStatus(verification);
  const hasProfile = isStudentProfileComplete(profile);
  const showLoading = (isBootstrapping || isLoadingVerification) && !profile;

  return (
    <AppScreen contentContainerStyle={styles.content} scroll>
      <Stack gap="xl">
        <Stack gap="md">
          <AppHeader subtitle="بيانات الطالب القادمة من الخادم" title="المعلومات الأكاديمية" />
          <AppButton onPress={() => navigation.goBack()} title="رجوع" variant="ghost" />
        </Stack>

        {showLoading ? <LoadingState message="جاري تحميل المعلومات الأكاديمية..." /> : null}

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
                { label: 'الجامعة', value: getOptionName(profile?.university) },
                { label: 'الكلية', value: getOptionName(profile?.faculty) },
                { label: 'الاختصاص', value: getOptionName(profile?.major) },
                {
                  label: 'السنة',
                  value: getOptionName(getStudentProfileAcademicYear(profile)),
                },
                { label: 'الفصل', value: getOptionName(profile?.semester) },
                {
                  label: 'الرقم الجامعي',
                  value: getStudentProfileStudentNumber(profile) ?? 'غير محدد',
                },
              ]}
              note={
                isVerificationApproved(verification)
                  ? 'تم توثيق الحساب. الحقول الأكاديمية الحساسة مقفلة ولا يتم تعديلها من هذه الشاشة.'
                  : 'هذه الشاشة للعرض فقط. تعديل البيانات الأكاديمية يتم ضمن تدفق إعداد الطالب حسب قواعد الخادم.'
              }
              statusLabel={getVerificationStatusLabel(status)}
              statusVariant={getVerificationStatusVariant(status)}
            />

            <AppCard variant="muted">
              <AppText color="secondary" variant="bodySmall">
                لا يتم عرض صورة بطاقة التحقق أو روابطها هنا لحماية الخصوصية.
              </AppText>
            </AppCard>
          </Stack>
        ) : (
          <EmptyState
            action={
              <AppButton
                onPress={handleSetupPress}
                title="إكمال المعلومات الأكاديمية"
                variant="outline"
              />
            }
            message="لم يتم العثور على ملف أكاديمي مكتمل لهذا الحساب."
            title="المعلومات الأكاديمية غير مكتملة"
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
