import { useCallback, useEffect, useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ScreenCapture from 'expo-screen-capture';
import { StyleSheet, View } from 'react-native';

import {
  AppHeader,
  AppIconButton,
  AppScreen,
  AppText,
  ErrorState,
  Icon,
  LoadingState,
  Stack,
} from '../../../components';
import { useTranslation } from '../../../i18n';
import type { HomeStackParamList } from '../../../navigation/types';
import { colors, spacing, useBrand } from '../../../theme';
import { getIsRTL } from '../../../utils/rtl';
import { BackButton } from '../components/BackButton';
import { JumpToPageModal } from '../components/JumpToPageModal';
import { LectureProcessingView } from '../components/LectureProcessingView';
import { NotesSheet } from '../components/NotesSheet';
import { PageTextPanel } from '../components/PageTextPanel';
import { ViewerPageStage } from '../components/ViewerPageStage';
import { useLecture } from '../hooks/useLecture';
import { useLectureNotes } from '../hooks/useLectureNotes';
import { useViewerPages } from '../hooks/useViewerPages';
import { applyPageNav, clampPage, isViewable, lectureTitle, stepZoom, ZOOM_FIT } from '../logic';
import { bookmarkForPage } from '../notesLogic';
import type { Lecture } from '../types';

type Props = NativeStackScreenProps<HomeStackParamList, 'LectureViewer'>;

export function LectureViewerScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { lectureId, title: routeTitle, page: initialPage } = route.params;
  const { lecture, isLoading, errorKind, reload } = useLecture(lectureId);
  const goBack = useCallback(() => navigation.goBack(), [navigation]);
  const title = lecture
    ? lectureTitle(lecture, t.lectures.untitled)
    : (routeTitle ?? t.lectures.title);

  if (lecture && isViewable(lecture)) {
    return <ViewerBody initialPage={initialPage} lecture={lecture} onBack={goBack} title={title} />;
  }

  return (
    <AppScreen contentContainerStyle={styles.statusContent} scroll>
      <AppHeader leftAction={<BackButton onPress={goBack} />} title={title} />
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

type BodyProps = {
  lecture: Lecture;
  title: string;
  initialPage?: number;
  onBack: () => void;
};

function ViewerBody({ lecture, title, initialPage, onBack }: BodyProps) {
  const { t } = useTranslation();
  const brand = useBrand();
  const total = lecture.page_count;
  const [page, setPage] = useState(() => clampPage(initialPage ?? 1, total));
  const [zoom, setZoom] = useState<number>(ZOOM_FIT);
  const [showText, setShowText] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [jumpOpen, setJumpOpen] = useState(false);
  const [bookmarkProblem, setBookmarkProblem] = useState(false);
  const pages = useViewerPages(lecture.id, page);
  const notesApi = useLectureNotes(lecture.id);
  const bookmarked = bookmarkForPage(notesApi.notes, page) !== null;
  const rtl = getIsRTL();

  // Lecture pages are protected content: block screenshots and screen recording while the viewer is open.
  useEffect(() => {
    void ScreenCapture.preventScreenCaptureAsync();
    return () => {
      void ScreenCapture.allowScreenCaptureAsync();
    };
  }, []);

  const goTo = useCallback(
    (target: number) => {
      setPage(clampPage(target, total));
      setZoom(ZOOM_FIT);
    },
    [total],
  );

  const navigate = useCallback(
    (direction: 'next' | 'prev') => goTo(applyPageNav(page, direction, total)),
    [goTo, page, total],
  );

  const toggleBookmark = useCallback(async () => {
    setBookmarkProblem(false);
    const result = await notesApi.toggleBookmark(page, t.lectures.notes.bookmarkContent(page));
    if (!result.ok) setBookmarkProblem(true);
  }, [notesApi, page, t]);

  const closeNotes = useCallback(() => setNotesOpen(false), []);
  const closeJump = useCallback(() => setJumpOpen(false), []);
  const handleJump = useCallback(
    (target: number) => {
      setJumpOpen(false);
      goTo(target);
    },
    [goTo],
  );

  return (
    <AppScreen backgroundColor={colors.background.surface} horizontalPadding={false}>
      <View style={styles.topBar}>
        <AppHeader
          leftAction={<BackButton onPress={onBack} />}
          rightAction={
            <AppIconButton
              accessibilityLabel={
                bookmarked ? t.lectures.viewer.bookmarkRemove : t.lectures.viewer.bookmarkAdd
              }
              icon={
                <Icon
                  color={bookmarked ? brand.accent : colors.text.secondary}
                  filled={bookmarked}
                  name="bookmark"
                  size={22}
                />
              }
              onPress={() => void toggleBookmark()}
              variant="ghost"
            />
          }
          style={styles.header}
          title={title}
        />
        <Stack direction="horizontal" gap="xs" align="center" style={styles.notice}>
          <Icon color={colors.text.muted} name="lock" size={14} />
          <AppText color="muted" style={styles.noticeText} variant="caption">
            {t.lectures.viewer.protectedNotice}
          </AppText>
        </Stack>
        {bookmarkProblem ? (
          <AppText color="error" style={styles.notice} variant="caption">
            {t.lectures.viewer.bookmarkError}
          </AppText>
        ) : null}
      </View>

      <View style={styles.stage}>
        {showText ? (
          <PageTextPanel loadText={pages.loadText} page={page} />
        ) : pages.sessionError ? (
          <ErrorState
            message={t.lectures.errors[pages.sessionError]}
            onRetry={() => pages.retry(page)}
            title={t.lectures.viewer.pageErrorTitle}
          />
        ) : (
          <ViewerPageStage
            onNavigate={navigate}
            onZoomChange={setZoom}
            page={page}
            pageCount={total}
            pages={pages}
            title={title}
            zoom={zoom}
          />
        )}
      </View>

      <View style={styles.controls}>
        <Stack direction="horizontal" gap="sm" align="center" justify="space-between">
          <AppIconButton
            accessibilityLabel={t.lectures.viewer.prev}
            disabled={page <= 1}
            icon={<Icon name={rtl ? 'chevronRight' : 'chevronLeft'} size={24} />}
            onPress={() => navigate('prev')}
            variant="surface"
          />
          <AppText
            accessibilityHint={t.lectures.viewer.jumpTitle}
            accessibilityLabel={t.lectures.viewer.pageOf(page, total)}
            accessibilityRole="button"
            align="center"
            onPress={() => setJumpOpen(true)}
            style={styles.indicator}
            variant="subtitle"
          >
            {t.lectures.viewer.pageOf(page, total)}
          </AppText>
          <AppIconButton
            accessibilityLabel={t.lectures.viewer.next}
            disabled={page >= total}
            icon={<Icon name={rtl ? 'chevronLeft' : 'chevronRight'} size={24} />}
            onPress={() => navigate('next')}
            variant="surface"
          />
        </Stack>
        <Stack direction="horizontal" gap="sm" align="center" justify="space-between">
          <Stack direction="horizontal" gap="xs" align="center">
            <AppIconButton
              accessibilityLabel={t.lectures.viewer.zoomOut}
              disabled={showText || zoom <= ZOOM_FIT}
              icon={<Icon name="minus" size={20} />}
              onPress={() => setZoom((value) => stepZoom(value, -1))}
              variant="ghost"
            />
            <AppText
              accessibilityLabel={t.lectures.viewer.zoomLevel(Math.round(zoom * 100))}
              color="secondary"
              variant="caption"
            >
              {Math.round(zoom * 100)}%
            </AppText>
            <AppIconButton
              accessibilityLabel={t.lectures.viewer.zoomIn}
              disabled={showText}
              icon={<Icon name="plus" size={20} />}
              onPress={() => setZoom((value) => stepZoom(value, 1))}
              variant="ghost"
            />
          </Stack>
          <Stack direction="horizontal" gap="xs" align="center">
            <AppIconButton
              accessibilityLabel={
                showText ? t.lectures.viewer.hideText : t.lectures.viewer.showText
              }
              icon={
                <Icon
                  color={showText ? brand.primary : colors.text.secondary}
                  name="file"
                  size={20}
                />
              }
              onPress={() => setShowText((value) => !value)}
              variant={showText ? 'surface' : 'ghost'}
            />
            <AppIconButton
              accessibilityLabel={t.lectures.viewer.notes}
              icon={<Icon color={colors.text.secondary} name="pencil" size={20} />}
              onPress={() => setNotesOpen(true)}
              variant="ghost"
            />
          </Stack>
        </Stack>
      </View>

      <NotesSheet
        notesApi={notesApi}
        onClose={closeNotes}
        onJump={goTo}
        page={page}
        visible={notesOpen}
      />
      <JumpToPageModal
        onClose={closeJump}
        onJump={handleJump}
        pageCount={total}
        visible={jumpOpen}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  statusContent: { gap: spacing.xl },
  topBar: { paddingHorizontal: spacing.sm, gap: spacing.xs },
  header: { minHeight: 56 },
  notice: { paddingHorizontal: spacing.md },
  noticeText: { flex: 1 },
  stage: { flex: 1 },
  controls: {
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.default,
    backgroundColor: colors.background.surface,
  },
  indicator: { flex: 1, paddingVertical: spacing.sm, minHeight: 44 },
});
