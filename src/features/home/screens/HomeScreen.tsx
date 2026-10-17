import { useEffect, useRef } from 'react';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Animated, StyleSheet, View } from 'react-native';

import {
  AppButton,
  AppScreen,
  AppText,
  EmptyState,
  ErrorState,
  LoadingState,
  Stack,
  type IconName,
} from '../../../components';
import { useTranslation, type TranslationCatalog } from '../../../i18n';
import { formatTime } from '../../../utils/formatDateTime';
import {
  GroupsRoutes,
  HomeRoutes,
  LecturesRoutes,
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
  HomeHero,
  HomeSectionHeader,
  QuickActionTile,
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
    { key: 'lectures', title: t.lectures, description: t.lecturesDescription },
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
    : actions.filter((action) => !['subjects', 'groups', 'files', 'lectures'].includes(action.key));
}

export function HomeScreen() {
  const { t, locale } = useTranslation();
  const navigation = useNavigation<HomeNavigation>();
  const user = useAuthStore((state) => state.user);
  const announcements = useHomeStore((state) => state.announcements);
  const unreadNotificationsCount = useHomeStore((state) => state.unreadNotificationsCount);
  const isLoading = useHomeStore((state) => state.isLoading);
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
      case 'lectures':
        navigation.navigate(TabRoutes.Subjects, { screen: LecturesRoutes.LecturesList });
        break;
      case 'search':
        navigation.navigate(SharedRoutes.Search);
        break;
    }
  }

  function handleRefresh() {
    void refreshHome();
  }

  const facultyName = profile?.faculty?.name ?? null;
  const yearName = profile?.academic_year?.name ?? profile?.academicYear?.name ?? null;
  const semesterName = profile?.semester?.name ?? null;
  const levelLabel = [yearName, semesterName].filter(Boolean).join(' - ') || null;

  const hero = (
    <HomeHero
      displayName={displayName}
      facultyName={isStudent ? facultyName : null}
      levelLabel={isStudent ? levelLabel : null}
      onOpenNotifications={() => handleQuickActionPress('notifications')}
      onOpenSearch={() => handleQuickActionPress('search')}
      unreadCount={unreadNotificationsCount}
    />
  );

  if (showInitialLoading) {
    return (
      <AppScreen contentContainerStyle={styles.scrollContent} horizontalPadding={false} scroll>
        {hero}
        <View style={styles.body}>
          <LoadingState message={t.home.loading} />
        </View>
      </AppScreen>
    );
  }

  if (showInitialError) {
    return (
      <AppScreen contentContainerStyle={styles.scrollContent} horizontalPadding={false} scroll>
        {hero}
        <View style={styles.body}>
          <ErrorState message={errorMessage ?? undefined} onRetry={handleRefresh} />
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen contentContainerStyle={styles.scrollContent} horizontalPadding={false} scroll>
      {hero}
      <View style={styles.body}>
        {isStudent ? (
          <StudentStatusCard
            hasProfileState={hasProfileState}
            hasVerificationState={hasVerificationState}
            profileComplete={profileComplete}
            verificationStatus={verificationStatus}
          />
        ) : null}

        <Animated.View
          style={{
            opacity: mainContentAnim.opacity,
            transform: [{ translateY: mainContentAnim.translateY }],
          }}
        >
          <Stack gap="xl">
            <Stack gap="sm">
              <HomeSectionHeader title={t.home.services.title} />
              <View style={styles.tiles}>
                {quickActions.map((action) => (
                  <QuickActionTile
                    badge={action.badge}
                    icon={TILE_ICONS[action.key]}
                    key={action.key}
                    label={action.title}
                    onPress={() => handleQuickActionPress(action.key)}
                  />
                ))}
              </View>
            </Stack>

            <Stack gap="md">
              <HomeSectionHeader
                action={
                  <AppButton
                    onPress={() => navigation.navigate(HomeRoutes.AnnouncementsList)}
                    size="sm"
                    title={t.home.announcements.seeAll}
                    variant="ghost"
                  />
                }
                title={t.home.announcements.title}
              />

              {errorMessage ? (
                <ErrorState message={errorMessage} onRetry={handleRefresh} />
              ) : announcements.length === 0 ? (
                <EmptyState
                  illustrationLabel={t.home.announcements.emptyIllustrationAlt}
                  artwork="announcements"
                  message={t.home.announcements.emptyMessage}
                  title={t.home.announcements.emptyTitle}
                />
              ) : (
                <Stack gap="md">
                  {announcements.slice(0, 5).map((announcement) => (
                    <AnnouncementCard announcement={announcement} key={String(announcement.id)} />
                  ))}
                </Stack>
              )}
            </Stack>
          </Stack>
        </Animated.View>

        {lastLoadedAt ? (
          <AppText align="center" color="muted" variant="caption">
            {t.common.lastUpdatedAt(formatTime(lastLoadedAt, locale) ?? '')}
          </AppText>
        ) : null}
      </View>
    </AppScreen>
  );
}

const TILE_ICONS: Record<HomeQuickActionKey, IconName> = {
  subjects: 'book',
  groups: 'users',
  files: 'folder',
  lectures: 'lecture',
  search: 'search',
  printing: 'printer',
  support: 'help',
  notifications: 'bell',
  profile: 'user',
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingTop: 0,
    paddingBottom: spacing.xxl,
  },
  body: {
    gap: spacing.xl,
    paddingHorizontal: spacing.screen.horizontal,
    paddingTop: spacing.xl,
  },
  tiles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: spacing.xs,
  },
});
