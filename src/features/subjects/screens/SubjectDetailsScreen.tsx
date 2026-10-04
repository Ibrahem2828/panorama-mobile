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
import { useTranslation } from '../../../i18n';

type SubjectDetailsScreenProps = NativeStackScreenProps<SubjectsStackParamList, 'SubjectDetails'>;
type AppTabsNavigation = BottomTabNavigationProp<AppTabsParamList>;

function isSameSubjectId(subject: Subject, subjectId: string | number) {
  return String(subject.id) === String(subjectId);
}

export function SubjectDetailsScreen({ navigation, route }: SubjectDetailsScreenProps) {
  const { t } = useTranslation();
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
        <AppHeader subtitle={t.subjects.details.subtitle} title={t.subjects.title} />
        <LoadingState message={t.subjects.details.loading} />
      </AppScreen>
    );
  }

  if (!subject) {
    return (
      <AppScreen contentContainerStyle={styles.content} scroll>
        <Stack gap="lg">
          <AppHeader
            leftAction={
              <AppButton
                onPress={() => navigation.goBack()}
                title={t.common.back}
                variant="ghost"
              />
            }
            subtitle={t.subjects.details.subtitle}
            title={t.subjects.title}
          />
          <ErrorState
            message={errorMessage ?? t.subjects.details.unavailableMessage}
            onRetry={handleRetry}
            title={t.subjects.details.unavailableTitle}
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
            <AppButton onPress={() => navigation.goBack()} title={t.common.back} variant="ghost" />
          }
          subtitle={t.subjects.details.listSubtitle}
          title={t.subjects.title}
        />

        <SubjectDetailHeader subject={subject} />

        <Stack gap="md">
          <SectionHeader title={t.subjects.details.linkedTitle} />
          <SubjectLinkedSectionCard
            description={t.subjects.details.filesDescription}
            onPress={handleOpenFiles}
            title={t.subjects.details.filesTitle}
          />
          <SubjectLinkedSectionCard
            description={t.subjects.details.groupsDescription}
            onPress={handleOpenGroups}
            title={t.subjects.details.groupsTitle}
          />
          <SubjectLinkedSectionCard
            description={t.subjects.details.announcementsDescription}
            disabled
            title={t.subjects.details.announcementsTitle}
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
