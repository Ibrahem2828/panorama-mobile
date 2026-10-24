import { useCallback, useEffect, useMemo, useState } from 'react';
import * as ScreenCapture from 'expo-screen-capture';
import { StyleSheet, View } from 'react-native';

import {
  AppHeader,
  AppIconButton,
  AppScreen,
  AppText,
  ErrorState,
  Icon,
  Stack,
} from '../../components';
import { useTranslation } from '../../i18n';
import { colors, spacing, useBrand } from '../../theme';
import { getIsRTL } from '../../utils/rtl';
import { JumpToPageModal } from '../lectures/components/JumpToPageModal';
import { NotesSheet } from '../lectures/components/NotesSheet';
import { PageTextPanel } from '../lectures/components/PageTextPanel';
import { ViewerPageStage } from '../lectures/components/ViewerPageStage';
import { useLectureNotes } from '../lectures/hooks/useLectureNotes';
import { useViewerPages } from '../lectures/hooks/useViewerPages';
import { applyPageNav, clampPage, stepZoom, ZOOM_FIT } from '../lectures/logic';
import { bookmarkForPage } from '../lectures/notesLogic';
import { AnnotationLayer, type Tool } from './annotations/AnnotationLayer';
import { AnnotationToolbar, defaultColorFor } from './annotations/AnnotationToolbar';
import { NoteEditorModal } from './annotations/NoteEditorModal';
import type { Point, Size } from './annotations/geometry';
import type { Annotation } from './annotations/model';
import { useAnnotations } from './annotations/useAnnotations';
import { ThumbnailStrip } from './ThumbnailStrip';
import type { DocRef } from './types';

type Props = {
  doc: DocRef;
  title: string;
  pageCount: number;
  initialPage?: number;
  onBack: () => void;
};

type NoteTarget = { point: Point; existing: Annotation | null } | null;

/**
 * The one reader for lectures and library files: protected page images with zoom, page jump, thumbnails, night mode,
 * text view, and the student's private marks (highlight, underline, pen, sticky notes, eraser, undo/redo).
 * Read mode scrolls / zooms / swipes; write mode gives one finger to the pen so the two never fight.
 */
export function DocumentViewerBody({ doc, title, pageCount, initialPage, onBack }: Props) {
  const { t } = useTranslation();
  const brand = useBrand();
  const total = pageCount;
  const [page, setPage] = useState(() => clampPage(initialPage ?? 1, total));
  const [zoom, setZoom] = useState<number>(ZOOM_FIT);
  const [showText, setShowText] = useState(false);
  const [showThumbs, setShowThumbs] = useState(false);
  const [night, setNight] = useState(false);
  const [writing, setWriting] = useState(false);
  const [tool, setTool] = useState<Tool>('highlight');
  const [color, setColor] = useState('yellow');
  const [width, setWidth] = useState(1);
  const [notesOpen, setNotesOpen] = useState(false);
  const [jumpOpen, setJumpOpen] = useState(false);
  const [noteTarget, setNoteTarget] = useState<NoteTarget>(null);
  const [limitReached, setLimitReached] = useState(false);
  const [bookmarkProblem, setBookmarkProblem] = useState(false);
  const pages = useViewerPages(doc, page);
  const notesApi = useLectureNotes(doc.id, doc.kind === 'lecture');
  const annotations = useAnnotations(doc);
  const isLecture = doc.kind === 'lecture';
  const bookmarked = isLecture && bookmarkForPage(notesApi.notes, page) !== null;
  const rtl = getIsRTL();

  // Document pages are protected content: block screenshots and screen recording while the viewer is open.
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

    if (!result.ok) {
      setBookmarkProblem(true);
    }
  }, [notesApi, page, t]);

  const pickTool = useCallback((next: Tool) => {
    setTool(next);
    setColor(defaultColorFor(next));
    setWidth(1);
  }, []);

  const toggleWriting = useCallback(() => {
    setWriting((value) => !value);
    setZoom(ZOOM_FIT); // writing happens on the fitted page; read mode is where you zoom
    setShowText(false);
  }, []);

  const addMark = useCallback(
    (mark: Omit<Annotation, 'clientId' | 'version' | 'deleted'>) => {
      setLimitReached(annotations.add(mark) === null);
    },
    [annotations],
  );

  const saveNote = useCallback(
    (text: string) => {
      const target = noteTarget;

      setNoteTarget(null);

      if (!target) {
        return;
      }

      if (target.existing) {
        // Keep the note where it was: only the text changes.
        const data = target.existing.data;

        if ('x' in data) {
          annotations.edit(target.existing.clientId, { data: { x: data.x, y: data.y, text } });
        }
      } else {
        addMark({
          page,
          kind: 'note',
          color: '',
          width: 0,
          data: { x: target.point.x, y: target.point.y, text },
        });
      }
    },
    [addMark, annotations, noteTarget, page],
  );

  const pageMarks = annotations.forPage(page);
  const noteText =
    noteTarget?.existing && 'text' in noteTarget.existing.data ? noteTarget.existing.data.text : '';

  const renderOverlay = useCallback(
    (box: Size) => (
      <AnnotationLayer
        color={color}
        items={pageMarks}
        mode={writing ? 'write' : 'read'}
        onAdd={addMark}
        onErase={annotations.remove}
        onNote={(point, existing) => setNoteTarget({ point, existing })}
        page={page}
        size={box}
        tool={tool}
        width={width}
      />
    ),
    // `annotations.version` changes whenever any mark changes, which is when this overlay must refresh.
    [color, writing, addMark, annotations.remove, page, tool, width, annotations.version],
  );

  const bookmarkButton = useMemo(
    () =>
      isLecture ? (
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
      ) : undefined,
    [bookmarked, brand.accent, isLecture, t, toggleBookmark],
  );

  return (
    <AppScreen
      backgroundColor={night ? '#0B1220' : colors.background.surface}
      horizontalPadding={false}
    >
      <View style={styles.topBar}>
        <AppHeader
          onBack={onBack}
          rightAction={bookmarkButton}
          showBack
          style={styles.header}
          title={title}
        />
        <Stack align="center" direction="horizontal" gap="xs" style={styles.notice}>
          <Icon color={colors.text.muted} name="lock" size={14} />
          <AppText color="muted" style={styles.noticeText} variant="caption">
            {t.lectures.viewer.protectedNotice}
          </AppText>
          {annotations.pending ? (
            <AppText color="muted" variant="caption">
              {annotations.syncError ? t.docViewer.syncError : t.docViewer.syncPending}
            </AppText>
          ) : null}
        </Stack>
        {bookmarkProblem ? (
          <AppText color="error" style={styles.notice} variant="caption">
            {t.lectures.viewer.bookmarkError}
          </AppText>
        ) : null}
        {limitReached ? (
          <AppText color="error" style={styles.notice} variant="caption">
            {t.docViewer.limitReached}
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
            night={night}
            onNavigate={navigate}
            onZoomChange={setZoom}
            page={page}
            pageCount={total}
            pages={pages}
            renderOverlay={renderOverlay}
            scrollLocked={writing}
            title={title}
            zoom={zoom}
          />
        )}
      </View>

      {writing ? (
        <AnnotationToolbar
          canRedo={annotations.canRedo}
          canUndo={annotations.canUndo}
          color={color}
          onColor={setColor}
          onRedo={annotations.redo}
          onTool={pickTool}
          onUndo={annotations.undo}
          onWidth={setWidth}
          tool={tool}
          width={width}
        />
      ) : null}

      {showThumbs ? (
        <ThumbnailStrip current={page} onSelect={goTo} pageCount={total} pages={pages} />
      ) : null}

      <View style={styles.controls}>
        <Stack align="center" direction="horizontal" gap="sm" justify="space-between">
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
        <Stack align="center" direction="horizontal" gap="sm" justify="space-between">
          <Stack align="center" direction="horizontal" gap="xs">
            <AppIconButton
              accessibilityLabel={t.lectures.viewer.zoomOut}
              disabled={showText || writing || zoom <= ZOOM_FIT}
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
              disabled={showText || writing}
              icon={<Icon name="plus" size={20} />}
              onPress={() => setZoom((value) => stepZoom(value, 1))}
              variant="ghost"
            />
          </Stack>
          <Stack align="center" direction="horizontal" gap="xs">
            <AppIconButton
              accessibilityLabel={showThumbs ? t.docViewer.hideThumbs : t.docViewer.showThumbs}
              icon={
                <Icon
                  color={showThumbs ? brand.primary : colors.text.secondary}
                  name="image"
                  size={20}
                />
              }
              onPress={() => setShowThumbs((value) => !value)}
              variant={showThumbs ? 'surface' : 'ghost'}
            />
            <AppIconButton
              accessibilityLabel={night ? t.docViewer.dayMode : t.docViewer.nightMode}
              icon={
                <Icon color={night ? brand.primary : colors.text.secondary} name="eye" size={20} />
              }
              onPress={() => setNight((value) => !value)}
              variant={night ? 'surface' : 'ghost'}
            />
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
              onPress={() => {
                setShowText((value) => !value);
                setWriting(false);
              }}
              variant={showText ? 'surface' : 'ghost'}
            />
            <AppIconButton
              accessibilityLabel={writing ? t.docViewer.readMode : t.docViewer.writeMode}
              icon={
                <Icon
                  color={writing ? brand.onPrimary : colors.text.secondary}
                  name="pencil"
                  size={20}
                />
              }
              onPress={toggleWriting}
              variant={writing ? 'primary' : 'ghost'}
            />
            {isLecture ? (
              <AppIconButton
                accessibilityLabel={t.lectures.viewer.notes}
                icon={<Icon color={colors.text.secondary} name="bookmark" size={20} />}
                onPress={() => setNotesOpen(true)}
                variant="ghost"
              />
            ) : null}
          </Stack>
        </Stack>
      </View>

      {isLecture ? (
        <NotesSheet
          notesApi={notesApi}
          onClose={() => setNotesOpen(false)}
          onJump={goTo}
          page={page}
          visible={notesOpen}
        />
      ) : null}
      <JumpToPageModal
        onClose={() => setJumpOpen(false)}
        onJump={(target) => {
          setJumpOpen(false);
          goTo(target);
        }}
        pageCount={total}
        visible={jumpOpen}
      />
      <NoteEditorModal
        initialText={noteText}
        onClose={() => setNoteTarget(null)}
        onDelete={
          noteTarget?.existing
            ? () => {
                annotations.remove(noteTarget.existing!.clientId);
                setNoteTarget(null);
              }
            : undefined
        }
        onSave={saveNote}
        visible={noteTarget !== null}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
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
