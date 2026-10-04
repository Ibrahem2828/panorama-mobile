import { useEffect, useRef } from 'react';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Animated, StyleSheet } from 'react-native';

import { images } from '../../../assets/images';
import {
  AppButton,
  AppHeader,
  AppScreen,
  AppText,
  EmptyState,
  ErrorState,
  LoadingState,
  Stack,
} from '../../../components';
import { useTranslation, type TranslationCatalog } from '../../../i18n';
import { formatTime } from '../../../utils/formatDateTime';
import {
  GroupsRoutes,
  PrintingRoutes,
  ProfileRoutes,
  SharedRoutes,
  SubjectsRoutes,
  TabRoutes,
} from '../../../navigation/routes';
import type { AppTabsParamList, HomeStackParamList } from '../../../navigation/types';
import { spacing } from '../../../theme';
import { createEntranceAnim } from '../../../utils/motion';
import { useAuthStore } from '../../auth/store';
import { isStudentProfileComplete, useStudentProfileStore } from '../../student-profile';
import { getVerificationStatus, useVerificationStore } from '../../verification';
import {
  AnnouncementCard,
  HomeAcademicSummaryCard,
  HomeGreetingCard,
  HomeQuickActionCard,
  HomeSectionHeader,
  StudentStatusCard,
} from '../components';
import { useHomeStore } from '../store';
import type { HomeQuickAction, HomeQuickActionKey } from '../types';

type HomeNavigation = CompositeNavigationProp<
  NativeStackNavigationProp<HomeStackParamList, 'Home'>,
  BottomTabNavigationProp<AppTabsParamList>
>;

function getQuickActions(
  unreadNotificationsCount: number,
  isStudent: boolean,
  t: TranslationCatalog['home']['services'],
): HomeQuickAction[] {
  const actions: HomeQuickAction[] = [
    { key: 'subjects', title: t.subjects, description: t.subjectsDescription },
    { key: 'groups', title: t.groups, description: t.groupsDescription },
    { key: 'files', title: t.files, description: t.filesDescription },
    { key: 'search', title: t.search, description: t.searchDescription },
    { key: 'printing', title: t.printing, description: t.printingDescription },
    { key: 'support', title: t.support, description: t.supportDescription },
    {
      key: 'notifications',
      title: t.notifications,
      description: t.notificationsDescription,
      badge: unreadNotificationsCount > 0 ? String(unreadNotificationsCount) : undefined,
    },
    { key: 'profile', title: t.profile, description: t.profileDescription },
  ];
  return isStudent
    ? actions
    : actions.filter((action) => !['subjects', 'groups', 'files'].includes(action.key));
}

export function HomeScreen() {
  const { t, locale } = useTranslation();
  const navigation = useNavigation<HomeNavigation>();
  const user = useAuthStore((state) => state.user);
  const announcements = useHomeStore((state) => state.announcements);
  const unreadNotificationsCount = useHomeStore((state) => state.unreadNotificationsCount);
  const isLoading = useHomeStore((state) => state.isLoading);
  const isRefreshing = useHomeStore((state) => state.isRefreshing);
  const errorMessage = useHomeStore((state) => state.errorMessage);
  const lastLoadedAt = useHomeStore((state) => state.lastLoadedAt);
  const loadHome = useHomeStore((state) => state.loadHome);
  const refreshHome = useHomeStore((state) => state.refreshHome);
  const profile = useStudentProfileStore((state) => state.profile);
  const bootstrapStudentProfile = useStudentProfileStore((state) => state.bootstrap);
  const hasProfileState = useStudentProfileStore((state) => state.hasBootstrapped);
  const verification = useVerificationStore((state) => state.verification);
  const loadVerification = useVerificationStore((state) => state.loadVerification);
  const hasVerificationState = useVerificationStore((state) => state.hasLoadedVerification);
  const displayName = user?.full_name ?? user?.username ?? null;
  const isStudent = user?.role?.toLowerCase() === 'student';
  const profileComplete = isStudentProfileComplete(profile);
  const verificationStatus = getVerificationStatus(verification);
  const showInitialLoading = isLoading && !lastLoadedAt;
  const showInitialError = Boolean(errorMessage && !lastLoadedAt);
  const quickActions = getQuickActions(unreadNotificationsCount, isStudent, t.home.services);

  const mainContentAnim = useRef(createEntranceAnim(8)).current;
  useEffect(() => {
    void loadHome();
    if (isStudent) {
      void bootstrapStudentProfile();
      void loadVerification();
    }
  }, [bootstrapStudentProfile, isStudent, loadHome, loadVerification]);

  useEffect(() => {
    if (!showInitialLoading && !showInitialError) {
      mainContentAnim.animate().start();
    }
  }, [showInitialLoading, showInitialError]);

  function handleQuickActionPress(key: HomeQuickActionKey) {
    switch (key) {
      case 'subjects':
        navigation.navigate(TabRoutes.Subjects, { screen: SubjectsRoutes.SubjectsList });
        break;
      case 'groups':
        navigation.navigate(TabRoutes.Groups, { screen: GroupsRoutes.GroupsOverview });
        break;
      case 'printing':
        navigation.navigate(TabRoutes.Printing, { screen: PrintingRoutes.PrintHome });
        break;
      case 'support':
        navigation.navigate(TabRoutes.Profile, { screen: ProfileRoutes.SupportTickets });
        break;
      case 'notifications':
        navigation.navigate(TabRoutes.Profile, { screen: ProfileRoutes.Notifications });
        break;
      case 'profile':
        navigation.navigate(TabRoutes.Profile, { screen: ProfileRoutes.ProfileHome });
        break;
      case 'files':
        navigation.navigate(SharedRoutes.FilesList);
        break;
      case 'search':
        navigation.navigate(SharedRoutes.Search);
        break;
    }
  }

  function handleRefresh() {
    void refreshHome();
  }

  if (showInitialLoading) {
    return (
      <AppScreen contentContainerStyle={styles.content} scroll>
        <AppHeader subtitle={t.home.subtitle} title={t.home.title} />
        <HomeGreetingCard
          displayName={displayName}
          unreadNotificationsCount={unreadNotificationsCount}
          userRole={user?.role}
        />
        <LoadingState message={t.home.loading} />
      </AppScreen>
    );
  }

  if (showInitialError) {
    return (
      <AppScreen contentContainerStyle={styles.content} scroll>
        <AppHeader subtitle={t.home.subtitle} title={t.home.title} />
        <HomeGreetingCard
          displayName={displayName}
          unreadNotificationsCount={unreadNotificationsCount}
          userRole={user?.role}
        />
        <ErrorState message={errorMessage ?? undefined} onRetry={handleRefresh} />
      </AppScreen>
    );
  }

  return (
    <AppScreen contentContainerStyle={styles.content} scroll>
      <Stack gap="xl">
        <AppHeader subtitle={t.home.subtitle} title={t.home.title} />

        <HomeGreetingCard
          displayName={displayName}
          unreadNotificationsCount={unreadNotificationsCount}
          userRole={user?.role}
        />

        {isStudent ? (
          <>
            <StudentStatusCard
              hasProfileState={hasProfileState}
              hasVerificationState={hasVerificationState}
              profileComplete={profileComplete}
              verificationStatus={verificationStatus}
            />
            <HomeAcademicSummaryCard profile={profile} />
          </>
        ) : null}

        <Animated.View
          style={{
            opacity: mainContentAnim.opacity,
            transform: [{ translateY: mainContentAnim.translateY }],
          }}
        >
          <Stack gap="md">
            <HomeSectionHeader
              action={
                <AppButton
                  loading={isRefreshing}
                  onPress={handleRefresh}
                  size="sm"
                  title={t.common.refresh}
                  variant="outline"
                />
              }
              subtitle={t.home.announcements.subtitle}
              title={t.home.announcements.title}
            />

            {errorMessage ? (
              <ErrorState message={errorMessage} onRetry={handleRefresh} />
            ) : announcements.length === 0 ? (
              <EmptyState
                action={
                  <AppButton
                    loading={isRefreshing}
                    onPress={handleRefresh}
                    title={t.common.retryVerify}
                    variant="outline"
                  />
                }
                message={t.home.announcements.emptyMessage}
                title={t.home.announcements.emptyTitle}
                illustrationLabel={t.home.announcements.emptyIllustrationAlt}
                illustrationSource={images.emptyStates.announcements}
              />
            ) : (
              <Stack gap="md">
                {announcements.map((announcement) => (
                  <AnnouncementCard announcement={announcement} key={String(announcement.id)} />
                ))}
              </Stack>
            )}
          </Stack>

          <Stack gap="md">
            <HomeSectionHeader subtitle={t.home.services.subtitle} title={t.home.services.title} />
            <Stack direction="horizontal" gap="md" wrap>
              {quickActions.map((action) => (
                <HomeQuickActionCard
                  action={action}
                  key={action.key}
                  marker={t.home.serviceInitials[action.key]}
                  onPress={action.disabled ? undefined : () => handleQuickActionPress(action.key)}
                />
              ))}
            </Stack>
          </Stack>
        </Animated.View>

        {lastLoadedAt ? (
          <AppText align="center" color="muted" variant="caption">
            {t.common.lastUpdatedAt(formatTime(lastLoadedAt, locale) ?? '')}
          </AppText>
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
