import { useEffect, useRef } from 'react';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet } from 'react-native';

import {
  AppButton,
  AppHeader,
  AppScreen,
  ErrorState,
  LoadingState,
  SectionHeader,
  Stack,
} from '../../../components';
import { GroupsRoutes, SharedRoutes, TabRoutes } from '../../../navigation/routes';
import type { AppTabsParamList, SubjectsStackParamList } from '../../../navigation/types';
import { spacing } from '../../../theme';
import { SubjectDetailHeader, SubjectLinkedSectionCard } from '../components';
import { useSubjectsStore } from '../store';
import type { Subject } from '../types';

type SubjectDetailsScreenProps = NativeStackScreenProps<SubjectsStackParamList, 'SubjectDetails'>;
type AppTabsNavigation = BottomTabNavigationProp<AppTabsParamList>;

function isSameSubjectId(subject: Subject, subjectId: string | number) {
  return String(subject.id) === String(subjectId);
}

export function SubjectDetailsScreen({ navigation, route }: SubjectDetailsScreenProps) {
  const { subjectId } = route.params;
  const selectedSubject = useSubjectsStore((state) => state.selectedSubject);
  const subjects = useSubjectsStore((state) => state.subjects);
  const isLoading = useSubjectsStore((state) => state.isLoading);
  const isRefreshing = useSubjectsStore((state) => state.isRefreshing);
  const errorMessage = useSubjectsStore((state) => state.errorMessage);
  const refreshSubjects = useSubjectsStore((state) => state.refreshSubjects);
  const setSelectedSubject = useSubjectsStore((state) => state.setSelectedSubject);
  const didAttemptReload = useRef(false);
  const subject =
    selectedSubject && isSameSubjectId(selectedSubject, subjectId)
      ? selectedSubject
      : (subjects.find((item) => isSameSubjectId(item, subjectId)) ?? null);
  const isBusy = isLoading || isRefreshing;

  useEffect(() => {
    if (!subject || selectedSubject?.id !== subject.id) {
      setSelectedSubject(subject);
    }
  }, [selectedSubject?.id, setSelectedSubject, subject]);

  useEffect(() => {
    if (!subject && !didAttemptReload.current && !isBusy) {
      didAttemptReload.current = true;
      void refreshSubjects();
    }
  }, [isBusy, refreshSubjects, subject]);

  function handleRetry() {
    didAttemptReload.current = true;
    void refreshSubjects();
  }

  function handleOpenGroups() {
    navigation
      .getParent<AppTabsNavigation>()
      ?.navigate(TabRoutes.Groups, { screen: GroupsRoutes.GroupsOverview });
  }

  function handleOpenFiles() {
    navigation
      .getParent<AppTabsNavigation>()
      ?.navigate(TabRoutes.Home, { screen: SharedRoutes.FilesList });
  }

  if (!subject && isBusy) {
    return (
      <AppScreen contentContainerStyle={styles.content} scroll>
        <AppHeader subtitle="تفاصيل المادة" title="موادي" />
        <LoadingState message="جاري تحميل بيانات المادة..." />
      </AppScreen>
    );
  }

  if (!subject) {
    return (
      <AppScreen contentContainerStyle={styles.content} scroll>
        <Stack gap="lg">
          <AppHeader
            leftAction={
              <AppButton onPress={() => navigation.goBack()} title="رجوع" variant="ghost" />
            }
            subtitle="تفاصيل المادة"
            title="موادي"
          />
          <ErrorState
            message={errorMessage ?? 'تعذر العثور على المادة.'}
            onRetry={handleRetry}
            title="المادة غير متاحة"
          />
        </Stack>
      </AppScreen>
    );
  }

  return (
    <AppScreen contentContainerStyle={styles.content} scroll>
      <Stack gap="xl">
        <AppHeader
          leftAction={
            <AppButton onPress={() => navigation.goBack()} title="رجوع" variant="ghost" />
          }
          subtitle="تفاصيل المادة من بيانات القائمة"
          title="موادي"
        />

        <SubjectDetailHeader subject={subject} />

        <Stack gap="md">
          <SectionHeader title="المحتوى المرتبط" />
          <SubjectLinkedSectionCard
            description="افتح قائمة الملفات المتاحة داخل التطبيق. لا يوجد فلتر موثق حسب المادة في هذه المرحلة."
            onPress={handleOpenFiles}
            title="الملفات"
          />
          <SubjectLinkedSectionCard
            description="افتح المجموعات العامة المتاحة. لا يوجد ربط موثق حسب المادة في هذه المرحلة."
            onPress={handleOpenGroups}
            title="المجموعات"
          />
          <SubjectLinkedSectionCard
            description="لا يوجد endpoint موثق لإعلانات المادة في هذه المرحلة."
            disabled
            title="الإعلانات"
          />
        </Stack>
      </Stack>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
  },
});
