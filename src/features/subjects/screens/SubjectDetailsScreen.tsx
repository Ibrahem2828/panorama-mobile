import { useEffect } from 'react';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, View } from 'react-native';

import {
  AppBadge,
  AppCard,
  AppHeader,
  AppScreen,
  AppText,
  BrandRefreshControl,
  ErrorState,
  SectionHeader,
  Skeleton,
  SkeletonList,
  Stack,
} from '../../../components';
import { useTranslation } from '../../../i18n';
import { GroupsRoutes, SharedRoutes, TabRoutes } from '../../../navigation/routes';
import type { AppTabsParamList, SubjectsStackParamList } from '../../../navigation/types';
import { colors, radius, spacing } from '../../../theme';
import { isolateLtr } from '../../../utils/rtl';
import { GroupWhatsAppCard, useSubjectGroupAccess } from '../../groups';
import { SubjectLecturesSection } from '../../lectures';
import { SubjectLinkedSectionCard } from '../components';
import { formatSemesterName, formatYearName, sameId } from '../services';
import { useSubjectsStore } from '../store';

type SubjectDetailsScreenProps = NativeStackScreenProps<SubjectsStackParamList, 'SubjectDetails'>;
type AppTabsNavigation = BottomTabNavigationProp<AppTabsParamList>;

function InfoRow({ label, value }: { label: string; value: string | null }) {
  if (!value) {
    return null;
  }

  return (
    <View style={styles.infoRow}>
      <AppText color="muted" variant="caption">
        {label}
      </AppText>
      <AppText style={styles.infoValue} variant="bodySmall" weight="600">
        {value}
      </AppText>
    </View>
  );
}

/**
 * Read-only subject information: name, code, year and semester, specialization, faculty and the full course
 * description, plus a plain "enrolled" status. Nothing on this screen starts a join, a registration or a request.
 * Students who are already members of the subject's group also see its chat, files and lectures.
 */
export function SubjectDetailsScreen({ navigation, route }: SubjectDetailsScreenProps) {
  const { t } = useTranslation();
  const { subjectId } = route.params;
  const listRow = useSubjectsStore((state) =>
    state.subjects.find((item) => sameId(item.id, subjectId)),
  );
  const detail = useSubjectsStore((state) => state.details[String(subjectId)]);
  const detailLoading = useSubjectsStore((state) => state.detailLoadingId === String(subjectId));
  const detailError = useSubjectsStore((state) => state.detailErrors[String(subjectId)]);
  const loadSubjectDetail = useSubjectsStore((state) => state.loadSubjectDetail);
  const subject = detail ?? listRow ?? null;
  const access = useSubjectGroupAccess(subjectId);

  useEffect(() => {
    void loadSubjectDetail(subjectId);
  }, [loadSubjectDetail, subjectId]);

  function handleRefresh() {
    void loadSubjectDetail(subjectId);
    void access.reload();
  }

  function handleOpenFiles() {
    // Pushed onto the Subjects stack so Back returns to this subject.
    navigation.navigate(SharedRoutes.FilesList, {
      subjectId: subject?.id,
      subjectName: subject?.name,
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

  if (!subject && detailLoading) {
    return (
      <AppScreen contentContainerStyle={styles.content} scroll>
        <AppHeader title={t.subjects.details.title} />
        <Skeleton borderRadius={24} height={160} />
        <SkeletonList count={2} />
      </AppScreen>
    );
  }

  if (!subject) {
    return (
      <AppScreen contentContainerStyle={styles.content} scroll>
        <Stack gap="lg">
          <AppHeader title={t.subjects.details.title} />
          <ErrorState
            message={detailError ?? t.subjects.details.unavailableMessage}
            onRetry={handleRefresh}
            title={t.subjects.details.unavailableTitle}
          />
        </Stack>
      </AppScreen>
    );
  }

  const description = detail?.description ?? null;
  const descriptionPending = !detail && detailLoading;
  const descriptionFailed = !detail && Boolean(detailError);

  return (
    <AppScreen
      contentContainerStyle={styles.content}
      refreshControl={<BrandRefreshControl onRefresh={handleRefresh} refreshing={detailLoading} />}
      scroll
    >
      <Stack gap="xl">
        <AppHeader title={t.subjects.details.title} />

        <AppCard variant="elevated">
          <Stack gap="md">
            <AppText variant="h2">{subject.name}</AppText>
            {subject.code ? (
              <AppText color="secondary" style={styles.code} variant="bodySmall">
                {t.subjects.details.codeLabel}: {isolateLtr(subject.code)}
              </AppText>
            ) : null}
            <View style={styles.badges}>
              {subject.isEnrolled ? (
                <AppBadge label={t.subjects.badges.enrolled} variant="success" />
              ) : null}
              {subject.inCurrentTerm ? (
                <AppBadge label={t.subjects.badges.currentTerm} variant="brand" />
              ) : null}
            </View>
            {subject.isEnrolled ? (
              <AppText color="success" variant="bodySmall" weight="600">
                {t.subjects.details.enrolledStatus}
              </AppText>
            ) : null}
          </Stack>
        </AppCard>

        <AppCard variant="muted">
          <Stack gap="xs">
            <InfoRow
              label={t.subjects.details.academicYearLabel}
              value={
                subject.academicYear ? formatYearName(subject.academicYear.name, t.subjects) : null
              }
            />
            <InfoRow
              label={t.subjects.details.semesterLabel}
              value={
                subject.semester ? formatSemesterName(subject.semester.name, t.subjects) : null
              }
            />
            <InfoRow label={t.subjects.details.majorLabel} value={subject.major?.name ?? null} />
            <InfoRow
              label={t.subjects.details.facultyLabel}
              value={subject.faculty?.name ?? null}
            />
          </Stack>
        </AppCard>

        <Stack gap="md">
          <SectionHeader title={t.subjects.details.descriptionTitle} />
          {descriptionPending ? (
            <Skeleton borderRadius={radius.lg} height={96} />
          ) : descriptionFailed && subject.hasDescription ? (
            <ErrorState message={t.subjects.details.descriptionError} onRetry={handleRefresh} />
          ) : description ? (
            <AppText color="secondary" variant="body">
              {description}
            </AppText>
          ) : (
            <AppText color="muted" variant="bodySmall">
              {t.subjects.details.noDescription}
            </AppText>
          )}
        </Stack>

        {access.status === 'member' ? (
          <>
            <Stack gap="md">
              <SectionHeader title={t.subjects.details.linkedTitle} />
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
            </Stack>
            {access.group ? <GroupWhatsAppCard canLaunch groupId={access.group.id} /> : null}
            <SubjectLecturesSection subjectId={subject.id} />
          </>
        ) : null}
      </Stack>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
  },
  code: {
    writingDirection: 'ltr',
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    minHeight: 28,
    paddingVertical: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.default,
  },
  infoValue: {
    flexShrink: 1,
  },
});
