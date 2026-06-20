import { useEffect, useState } from 'react';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
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
import { PrintingRoutes, ProfileRoutes, TabRoutes } from '../../../navigation/routes';
import type { AppTabsParamList, ProfileStackParamList } from '../../../navigation/types';
import { spacing } from '../../../theme';
import { useAuthStore } from '../../auth/store';
import { useStudentProfileStore } from '../../student-profile/store';
import { getVerificationStatus } from '../../verification/services';
import { useVerificationStore } from '../../verification/store';
import {
  AcademicInfoCard,
  ProfileActionItem,
  ProfileActionSection,
  ProfileSummaryCard,
} from '../components';
import { getStudentCardVerificationSummary } from '../services';
import { useProfileStore } from '../store';

type ProfileHomeScreenProps = NativeStackScreenProps<ProfileStackParamList, 'ProfileHome'>;
type AppTabsNavigation = BottomTabNavigationProp<AppTabsParamList>;

function getVerificationLabel(status?: string | null): string {
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

function getAcademicValue(value?: { name?: string } | null): string {
  return value?.name ?? 'غير محدد';
}

export function ProfileHomeScreen({ navigation }: ProfileHomeScreenProps) {
  const [isConfirmingLogout, setIsConfirmingLogout] = useState(false);
  const tabNavigation = navigation.getParent<AppTabsNavigation>();
  const authUser = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const isSubmitting = useAuthStore((state) => state.isSubmitting);
  const profileUser = useProfileStore((state) => state.user);
  const isLoadingProfile = useProfileStore((state) => state.isLoading);
  const profileError = useProfileStore((state) => state.errorMessage);
  const loadProfile = useProfileStore((state) => state.loadProfile);
  const studentProfile = useStudentProfileStore((state) => state.profile);
  const bootstrapStudentProfile = useStudentProfileStore((state) => state.bootstrap);
  const verification = useVerificationStore((state) => state.verification);
  const loadVerification = useVerificationStore((state) => state.loadVerification);

  const user = profileUser ?? authUser;
  const verificationStatus = getVerificationStatus(verification);
  const cardVerificationSummary = getStudentCardVerificationSummary(verificationStatus);

  useEffect(() => {
    void loadProfile();
    void bootstrapStudentProfile();
    void loadVerification();
  }, [bootstrapStudentProfile, loadProfile, loadVerification]);

  function handleLogoutPress() {
    if (!isConfirmingLogout) {
      setIsConfirmingLogout(true);
      return;
    }

    void logout();
  }

  function handlePrintingPress() {
    tabNavigation?.navigate(TabRoutes.Printing, {
      screen: PrintingRoutes.MyPrintOrders,
    });
  }

  return (
    <AppScreen contentContainerStyle={styles.content} scroll>
      <Stack gap="xl">
        <AppHeader subtitle="الحساب والخدمات الشخصية" title="حسابي" />

        {isLoadingProfile && !user ? <LoadingState message="جاري تحميل بيانات الحساب..." /> : null}
        {profileError ? <ErrorState message={profileError} onRetry={loadProfile} /> : null}

        <ProfileSummaryCard user={user} />

        <AcademicInfoCard
          fields={[
            { label: 'الجامعة', value: getAcademicValue(studentProfile?.university) },
            { label: 'الكلية', value: getAcademicValue(studentProfile?.faculty) },
            { label: 'التحقق', value: getVerificationLabel(verificationStatus) },
          ]}
          note="للتفاصيل الكاملة افتح شاشة المعلومات الأكاديمية."
          statusLabel={getVerificationLabel(verificationStatus)}
          statusVariant={verificationStatus === 'approved' ? 'success' : 'warning'}
          title="ملخص الطالب"
        />

        <ProfileActionSection subtitle="إدارة البيانات وخدمات الحساب" title="الحساب">
          <ProfileActionItem
            onPress={() => navigation.navigate(ProfileRoutes.EditProfile)}
            subtitle="تعديل الاسم واسم المستخدم فقط"
            title="تعديل الملف الشخصي"
          />
          <ProfileActionItem
            badge={cardVerificationSummary.label}
            badgeVariant={cardVerificationSummary.variant}
            onPress={() => navigation.navigate(ProfileRoutes.AcademicInfo)}
            subtitle="عرض بيانات الجامعة والتوثيق"
            title="المعلومات الأكاديمية"
          />
          <ProfileActionItem
            onPress={() => navigation.navigate(ProfileRoutes.Settings)}
            subtitle="الأمان والمعلومات القانونية"
            title="الإعدادات"
          />
        </ProfileActionSection>

        <ProfileActionSection subtitle="روابط الخدمات المتاحة للطالب" title="الخدمات">
          <ProfileActionItem
            onPress={handlePrintingPress}
            subtitle="متابعة طلبات الطباعة الخاصة بك"
            title="طلبات الطباعة"
          />
          <ProfileActionItem
            onPress={() => navigation.navigate(ProfileRoutes.Notifications)}
            subtitle="قراءة إشعارات الحساب"
            title="الإشعارات"
          />
          <ProfileActionItem
            onPress={() => navigation.navigate(ProfileRoutes.SupportTickets)}
            subtitle="إنشاء ومتابعة تذاكر الدعم"
            title="الدعم الفني"
          />
        </ProfileActionSection>

        <ProfileActionSection subtitle="معلومات التطبيق" title="قانوني">
          <ProfileActionItem
            onPress={() => navigation.navigate(ProfileRoutes.PrivacyPolicy)}
            title="سياسة الخصوصية"
          />
          <ProfileActionItem
            onPress={() => navigation.navigate(ProfileRoutes.Terms)}
            title="الشروط والأحكام"
          />
          <ProfileActionItem
            onPress={() => navigation.navigate(ProfileRoutes.About)}
            title="عن بانوراما"
          />
        </ProfileActionSection>

        {isConfirmingLogout ? (
          <AppCard variant="muted">
            <Stack gap="md">
              <AppText variant="title">هل تريد تسجيل الخروج؟</AppText>
              <AppText color="secondary" variant="bodySmall">
                سيتم مسح رموز الجلسة من التخزين الآمن والعودة إلى شاشة تسجيل الدخول.
              </AppText>
              <Stack direction="horizontal" gap="sm" wrap>
                <AppButton
                  loading={isSubmitting}
                  onPress={handleLogoutPress}
                  title="تأكيد الخروج"
                  variant="danger"
                />
                <AppButton
                  onPress={() => setIsConfirmingLogout(false)}
                  title="إلغاء"
                  variant="outline"
                />
              </Stack>
            </Stack>
          </AppCard>
        ) : (
          <AppButton fullWidth onPress={handleLogoutPress} title="تسجيل الخروج" variant="danger" />
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
