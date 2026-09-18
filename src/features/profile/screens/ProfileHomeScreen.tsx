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
import { getStudentCardVerificationSummary, getVerificationStatusLabel } from '../services';
import { useProfileStore } from '../store';
import { useTranslation } from '../../../i18n';

type ProfileHomeScreenProps = NativeStackScreenProps<ProfileStackParamList, 'ProfileHome'>;
type AppTabsNavigation = BottomTabNavigationProp<AppTabsParamList>;

function getAcademicValue(value: { name?: string } | null | undefined, fallback: string): string {
  return value?.name ?? fallback;
}

export function ProfileHomeScreen({ navigation }: ProfileHomeScreenProps) {
  const { t } = useTranslation();
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
  const isStudent = user?.role?.toLowerCase() === 'student';
  const verificationStatus = getVerificationStatus(verification);
  const cardVerificationSummary = getStudentCardVerificationSummary(
    verificationStatus,
    t.profile,
    t.verification,
    t.common,
  );

  useEffect(() => {
    void loadProfile();
    if (isStudent) {
      void bootstrapStudentProfile();
      void loadVerification();
    }
  }, [bootstrapStudentProfile, isStudent, loadProfile, loadVerification]);

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
        <AppHeader subtitle={t.profile.subtitle} title={t.profile.title} />

        {isLoadingProfile && !user ? <LoadingState message={t.profile.loadingAccount} /> : null}
        {profileError ? <ErrorState message={profileError} onRetry={loadProfile} /> : null}

        <ProfileSummaryCard user={user} />

        {isStudent ? (
          <AcademicInfoCard
            fields={[
              {
                label: t.profile.summary.university,
                value: getAcademicValue(studentProfile?.university, t.common.notSpecified),
              },
              {
                label: t.profile.summary.faculty,
                value: getAcademicValue(studentProfile?.faculty, t.common.notSpecified),
              },
              {
                label: t.profile.summary.verification,
                value: getVerificationStatusLabel(
                  verificationStatus,
                  t.verification,
                  t.common.unknown,
                ),
              },
            ]}
            note={t.profile.summary.note}
            statusLabel={getVerificationStatusLabel(
              verificationStatus,
              t.verification,
              t.common.unknown,
            )}
            statusVariant={verificationStatus === 'approved' ? 'success' : 'warning'}
            title={t.profile.summary.title}
          />
        ) : null}

        <ProfileActionSection
          subtitle={t.profile.accountSection.subtitle}
          title={t.profile.accountSection.title}
        >
          <ProfileActionItem
            onPress={() => navigation.navigate(ProfileRoutes.EditProfile)}
            subtitle={t.profile.accountSection.editProfileSubtitle}
            title={t.profile.accountSection.editProfile}
          />
          {isStudent ? (
            <ProfileActionItem
              badge={cardVerificationSummary.label}
              badgeVariant={cardVerificationSummary.variant}
              onPress={() => navigation.navigate(ProfileRoutes.AcademicInfo)}
              subtitle={t.profile.accountSection.academicInfoSubtitle}
              title={t.profile.accountSection.academicInfo}
            />
          ) : null}
          <ProfileActionItem
            onPress={() => navigation.navigate(ProfileRoutes.Settings)}
            subtitle={t.profile.accountSection.settingsSubtitle}
            title={t.profile.accountSection.settings}
          />
        </ProfileActionSection>

        <ProfileActionSection
          subtitle={t.profile.servicesSection.subtitle}
          title={t.profile.servicesSection.title}
        >
          <ProfileActionItem
            onPress={handlePrintingPress}
            subtitle={t.profile.servicesSection.printOrdersSubtitle}
            title={t.profile.servicesSection.printOrders}
          />
          <ProfileActionItem
            onPress={() => navigation.navigate(ProfileRoutes.Notifications)}
            subtitle={t.profile.servicesSection.notificationsSubtitle}
            title={t.profile.servicesSection.notifications}
          />
          <ProfileActionItem
            onPress={() => navigation.navigate(ProfileRoutes.SupportTickets)}
            subtitle={t.profile.servicesSection.supportSubtitle}
            title={t.profile.servicesSection.support}
          />
          <ProfileActionItem
            onPress={() => navigation.navigate(ProfileRoutes.FeedbackCenter)}
            subtitle={t.profile.servicesSection.feedbackSubtitle}
            title={t.profile.servicesSection.feedback}
          />
        </ProfileActionSection>

        <ProfileActionSection
          subtitle={t.profile.legalSection.subtitle}
          title={t.profile.legalSection.title}
        >
          <ProfileActionItem
            onPress={() => navigation.navigate(ProfileRoutes.PrivacyPolicy)}
            title={t.legal.privacy.title}
          />
          <ProfileActionItem
            onPress={() => navigation.navigate(ProfileRoutes.Terms)}
            title={t.legal.terms.title}
          />
          <ProfileActionItem
            onPress={() => navigation.navigate(ProfileRoutes.About)}
            title={t.profile.about.title}
          />
        </ProfileActionSection>

        {isConfirmingLogout ? (
          <AppCard variant="muted">
            <Stack gap="md">
              <AppText variant="title">{t.profile.logout.confirmTitle}</AppText>
              <AppText color="secondary" variant="bodySmall">
                {t.profile.logout.confirmDescription}
              </AppText>
              <Stack direction="horizontal" gap="sm" wrap>
                <AppButton
                  loading={isSubmitting}
                  onPress={handleLogoutPress}
                  title={t.profile.logout.confirm}
                  variant="danger"
                />
                <AppButton
                  onPress={() => setIsConfirmingLogout(false)}
                  title={t.common.cancel}
                  variant="outline"
                />
              </Stack>
            </Stack>
          </AppCard>
        ) : (
          <AppButton
            fullWidth
            onPress={handleLogoutPress}
            title={t.profile.logout.action}
            variant="danger"
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
