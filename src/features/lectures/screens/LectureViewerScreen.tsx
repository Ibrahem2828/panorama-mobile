import { useCallback, useMemo } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet } from 'react-native';

import { AppHeader, AppScreen, ErrorState, LoadingState } from '../../../components';
import { useTranslation } from '../../../i18n';
import type { HomeStackParamList } from '../../../navigation/types';
import { useNetworkStore } from '../../../offline/networkStore';
import { spacing } from '../../../theme';
import { DocumentViewerBody } from '../../viewer/DocumentViewerBody';
import { OfflineLectureViewer } from '../offline/OfflineLectureViewer';
import { keyOf } from '../offline/licenseLogic';
import { useOfflineLibrary } from '../offline/offlineLibrary';
import { LectureProcessingView } from '../components/LectureProcessingView';
import { useLecture } from '../hooks/useLecture';
import { isViewable, lectureTitle } from '../logic';

type Props = NativeStackScreenProps<HomeStackParamList, 'LectureViewer'>;

/** Opens a lecture in the unified viewer once it is processed; otherwise shows its processing state. */
export function LectureViewerScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { lectureId, title: routeTitle, page: initialPage, offline } = route.params;
  const isOnline = useNetworkStore((state) => state.isOnline);
  const saved = useOfflineLibrary((library) => library.entries[keyOf(lectureId)]);
  const { lecture, isLoading, errorKind, reload } = useLecture(lectureId);
  const goBack = useCallback(() => navigation.goBack(), [navigation]);
  const title = lecture
    ? lectureTitle(lecture, t.lectures.untitled)
    : (routeTitle ?? t.lectures.title);
  const doc = useMemo(() => ({ kind: 'lecture' as const, id: lectureId }), [lectureId]);

  // The saved encrypted copy is opened on request, and whenever the phone is offline and one exists.
  if (saved?.status === 'complete' && (offline === true || !isOnline)) {
    return (
      <OfflineLectureViewer
        lectureId={saved.lectureId}
        onBack={goBack}
        title={saved.title || title}
      />
    );
  }

  if (lecture && isViewable(lecture)) {
    return (
      <DocumentViewerBody
        doc={doc}
        initialPage={initialPage}
        onBack={goBack}
        pageCount={lecture.page_count}
        title={title}
      />
    );
  }

  return (
    <AppScreen contentContainerStyle={styles.statusContent} scroll>
      <AppHeader onBack={goBack} showBack title={title} />
      {lecture ? (
        <LectureProcessingView lecture={lecture} onReady={reload} />
      ) : isLoading ? (
        <LoadingState message={t.lectures.detail.loading} />
      ) : (
        <ErrorState
          message={t.lectures.errors[errorKind ?? 'unknown']}
          onRetry={errorKind === 'notFound' || errorKind === 'forbidden' ? undefined : reload}
          title={t.lectures.detail.unavailableTitle}
        />
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  statusContent: { gap: spacing.xl },
});
