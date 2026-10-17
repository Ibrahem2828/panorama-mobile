import { useEffect, useRef } from 'react';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet } from 'react-native';

import {
  AppHeader,
  AppScreen,
  BrandRefreshControl,
  ErrorState,
  SectionHeader,
  Skeleton,
  SkeletonList,
  Stack,
} from '../../../components';
import { GroupsRoutes, SharedRoutes, TabRoutes } from '../../../navigation/routes';
import type { AppTabsParamList, SubjectsStackParamList } from '../../../navigation/types';
import { spacing } from '../../../theme';
import { SubjectDetailHeader, SubjectLinkedSectionCard } from '../components';
import { useSubjectsStore } from '../store';
import type { Subject } from '../types';
import { useTranslation } from '../../../i18n';
import { GroupWhatsAppCard, useSubjectGroupAccess } from '../../groups';
import { SubjectLecturesSection } from '../../lectures';
import { SubjectLockedCard } from '../components/SubjectLockedCard';
import { getSubjectDisplayName } from '../services';

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
  const access = useSubjectGroupAccess(subjectId);
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
    navigation.getParent<AppTabsNavigation>()?.navigate(TabRoutes.Groups, {
      screen: GroupsRoutes.AvailableGroups,
      params: { subjectId: subject?.id },
    });
  }

  function handleOpenFiles() {
    // Pushed onto the Subjects stack so Back returns to this subject.
    navigation.navigate(SharedRoutes.FilesList, {
      subjectId: subject?.id,
      subjectName: subject ? getSubjectDisplayName(subject, t.subjects) : undefined,
    });
  }

  function handleOpenChat() {
    if (!access.group) return;
    navigation.getParent<AppTabsNavigation>()?.navigate(TabRoutes.Groups, {
      screen: GroupsRoutes.ChatRoom,
      params: { groupId: access.group.id },
      initial: false,
    });
  }

  if (!subject && isBusy) {
    return (
      <AppScreen contentContainerStyle={styles.content} scroll>
        <AppHeader title={t.subjects.title} />
        <Skeleton height={180} borderRadius={24} />
        <SkeletonList count={2} />
      </AppScreen>
    );
  }

  if (!subject) {
    return (
      <AppScreen contentContainerStyle={styles.content} scroll>
        <Stack gap="lg">
          <AppHeader subtitle={t.subjects.details.subtitle} title={t.subjects.title} />
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
    <AppScreen
      contentContainerStyle={styles.content}
      refreshControl={<BrandRefreshControl onRefresh={handleRetry} refreshing={isRefreshing} />}
      scroll
    >
      <Stack gap="xl">
        <AppHeader subtitle={t.subjects.details.listSubtitle} title={t.subjects.title} />

        <SubjectDetailHeader subject={subject} />

        <Stack gap="md">
          <SectionHeader title={t.subjects.details.linkedTitle} />
          <SubjectLinkedSectionCard
            description={t.subjects.details.groupsDescription}
            icon="users"
            onPress={handleOpenGroups}
            title={t.subjects.details.groupsTitle}
          />
          {access.status === 'member' ? (
            <>
              <SubjectLinkedSectionCard
                description={t.subjects.details.chatDescription}
                icon="chat"
                onPress={handleOpenChat}
                title={t.subjects.details.chatTitle}
              />
              <SubjectLinkedSectionCard
                description={t.subjects.details.filesDescription}
                icon="folder"
                onPress={handleOpenFiles}
                title={t.subjects.details.filesTitle}
              />
            </>
          ) : null}
        </Stack>
        {access.status === 'member' && access.group ? (
          <GroupWhatsAppCard canLaunch groupId={access.group.id} />
        ) : null}
        {access.status === 'member' ? (
          <SubjectLecturesSection subjectId={subject.id} />
        ) : access.status === 'loading' ? null : (
          <SubjectLockedCard membership={access.membership} onOpenGroups={handleOpenGroups} />
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
