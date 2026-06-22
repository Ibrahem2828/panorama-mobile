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

const QUICK_ACTION_MARKERS: Record<HomeQuickActionKey, string> = {
  subjects: 'م',
  groups: 'غ',
  files: 'ف',
  printing: 'ط',
  support: 'د',
  notifications: 'ن',
  profile: 'ح',
};

function getQuickActions(unreadNotificationsCount: number): HomeQuickAction[] {
  return [
    {
      key: 'subjects',
      title: 'موادي',
      description: 'انتقل إلى قائمة المواد الدراسية.',
    },
    {
      key: 'groups',
      title: 'المجموعات',
      description: 'تصفح المجموعات والمساحات المرتبطة بالدراسة.',
    },
    {
      key: 'files',
      title: 'الملفات',
      description: 'افتح الملفات المتاحة داخل التطبيق.',
    },
    {
      key: 'printing',
      title: 'الطباعة',
      description: 'اطلب طباعة الملفات ومتابعة الطلبات.',
    },
    {
      key: 'support',
      title: 'الدعم',
      description: 'افتح تذاكر الدعم الفني ومتابعتها.',
    },
    {
      key: 'notifications',
      title: 'الإشعارات',
      description: 'تابع التنبيهات المهمة داخل حسابك.',
      badge: unreadNotificationsCount > 0 ? String(unreadNotificationsCount) : undefined,
    },
    {
      key: 'profile',
      title: 'حسابي',
      description: 'راجع بيانات الحساب والإعدادات.',
    },
  ];
}

export function HomeScreen() {
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
  const profileComplete = isStudentProfileComplete(profile);
  const verificationStatus = getVerificationStatus(verification);
  const showInitialLoading = isLoading && !lastLoadedAt;
  const showInitialError = Boolean(errorMessage && !lastLoadedAt);
  const quickActions = getQuickActions(unreadNotificationsCount);

  const mainContentAnim = useRef(createEntranceAnim(8)).current;
  useEffect(() => {
    void loadHome();
    void bootstrapStudentProfile();
    void loadVerification();
  }, [bootstrapStudentProfile, loadHome, loadVerification]);

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
    }
  }

  function handleRefresh() {
    void refreshHome();
  }

  if (showInitialLoading) {
    return (
      <AppScreen contentContainerStyle={styles.content} scroll>
        <AppHeader subtitle="لوحة الطالب" title="الرئيسية" />
        <HomeGreetingCard
          displayName={displayName}
          unreadNotificationsCount={unreadNotificationsCount}
          userRole={user?.role}
        />
        <LoadingState message="جاري تحميل الصفحة الرئيسية..." />
      </AppScreen>
    );
  }

  if (showInitialError) {
    return (
      <AppScreen contentContainerStyle={styles.content} scroll>
        <AppHeader subtitle="لوحة الطالب" title="الرئيسية" />
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
        <AppHeader subtitle="لوحة الطالب" title="الرئيسية" />

        <HomeGreetingCard
          displayName={displayName}
          unreadNotificationsCount={unreadNotificationsCount}
          userRole={user?.role}
        />

        <StudentStatusCard
          hasProfileState={hasProfileState}
          hasVerificationState={hasVerificationState}
          profileComplete={profileComplete}
          verificationStatus={verificationStatus}
        />

        <HomeAcademicSummaryCard profile={profile} />

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
                  title="تحديث"
                  variant="outline"
                />
              }
              subtitle="آخر الإعلانات المرتبطة بحسابك."
              title="الإعلانات"
            />

            {errorMessage ? (
              <ErrorState message={errorMessage} onRetry={handleRefresh} />
            ) : announcements.length === 0 ? (
              <EmptyState
                action={
                  <AppButton
                    loading={isRefreshing}
                    onPress={handleRefresh}
                    title="إعادة التحقق"
                    variant="outline"
                  />
                }
                message="ستظهر هنا الإعلانات المهمة عند توفرها."
                title="لا توجد إعلانات حاليا"
                illustrationLabel="رسم يوضح عدم وجود إعلانات"
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
            <HomeSectionHeader subtitle="اختصارات سريعة لأهم خدمات الطالب." title="الخدمات" />
            <Stack direction="horizontal" gap="md" wrap>
              {quickActions.map((action) => (
                <HomeQuickActionCard
                  action={action}
                  key={action.key}
                  marker={QUICK_ACTION_MARKERS[action.key]}
                  onPress={action.disabled ? undefined : () => handleQuickActionPress(action.key)}
                />
              ))}
            </Stack>
          </Stack>
        </Animated.View>

        {lastLoadedAt ? (
          <AppText align="center" color="muted" variant="caption">
            آخر تحديث: {new Date(lastLoadedAt).toLocaleTimeString('ar-SY')}
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
