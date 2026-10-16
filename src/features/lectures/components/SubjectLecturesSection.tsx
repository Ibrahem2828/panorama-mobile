import { useCallback, useEffect, useMemo } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import {
  AppButton,
  AppText,
  EmptyState,
  ErrorState,
  SectionHeader,
  Stack,
} from '../../../components';
import { useTranslation } from '../../../i18n';
import { LecturesRoutes } from '../../../navigation/routes';
import type { SubjectsStackParamList } from '../../../navigation/types';
import { spacing, useBrand } from '../../../theme';
import { filterLectures } from '../logic';
import { useLecturesStore } from '../store';
import type { Lecture } from '../types';
import { LectureCard } from './LectureCard';

type Props = { subjectId: string | number };

const PREVIEW_LIMIT = 5;

/** "Lectures of this subject" block for the subject details screen (uses the shared lecture list). */
export function SubjectLecturesSection({ subjectId }: Props) {
  const { t } = useTranslation();
  const brand = useBrand();
  const navigation = useNavigation<NativeStackNavigationProp<SubjectsStackParamList>>();
  const allLectures = useLecturesStore((state) => state.lectures);
  const isLoading = useLecturesStore((state) => state.isLoading);
  const errorKind = useLecturesStore((state) => state.errorKind);
  const lastLoadedAt = useLecturesStore((state) => state.lastLoadedAt);
  const load = useLecturesStore((state) => state.load);
  const refresh = useLecturesStore((state) => state.refresh);

  useEffect(() => {
    void load();
  }, [load]);

  const lectures = useMemo(
    () => filterLectures(allLectures, { subject: subjectId }),
    [allLectures, subjectId],
  );

  const openLecture = useCallback(
    (lecture: Lecture) => {
      navigation.navigate(LecturesRoutes.LectureViewer, {
        lectureId: lecture.id,
        title: lecture.title ?? undefined,
      });
    },
    [navigation],
  );

  const openAll = useCallback(() => {
    navigation.navigate(LecturesRoutes.LecturesList, { subjectId });
  }, [navigation, subjectId]);

  const handleRetry = useCallback(() => void refresh(), [refresh]);

  let body;
  if (isLoading && lastLoadedAt === null) {
    body = (
      <View
        accessibilityLabel={t.lectures.loading}
        accessibilityRole="progressbar"
        style={styles.loading}
      >
        <ActivityIndicator color={brand.primary} />
      </View>
    );
  } else if (errorKind && lastLoadedAt === null) {
    body = <ErrorState message={t.lectures.errors[errorKind]} onRetry={handleRetry} />;
  } else if (lectures.length === 0) {
    body = (
      <EmptyState
        icon={null}
        message={t.lectures.subjectSection.empty}
        title={t.lectures.emptyTitle}
      />
    );
  } else {
    body = (
      <Stack gap="sm">
        {lectures.slice(0, PREVIEW_LIMIT).map((lecture) => (
          <LectureCard compact key={lecture.id} lecture={lecture} onPress={openLecture} />
        ))}
        {lectures.length > PREVIEW_LIMIT ? (
          <AppButton
            onPress={openAll}
            title={t.lectures.subjectSection.openAll}
            variant="outline"
          />
        ) : null}
        <AppText color="muted" variant="caption">
          {t.lectures.totalCount(lectures.length)}
        </AppText>
      </Stack>
    );
  }

  return (
    <Stack gap="md">
      <SectionHeader
        subtitle={t.lectures.subjectSection.description}
        title={t.lectures.subjectSection.title}
      />
      {body}
    </Stack>
  );
}

const styles = StyleSheet.create({
  loading: { paddingVertical: spacing.lg, alignItems: 'center' },
});
