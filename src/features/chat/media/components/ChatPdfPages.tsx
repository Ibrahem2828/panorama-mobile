import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { AppIconButton, AppText, Icon } from '../../../../components';
import { useTranslation } from '../../../../i18n';
import { radius, spacing } from '../../../../theme';
import {
  createPageDirectory,
  getPdfPageCount,
  PdfRenderError,
  removePageDirectory,
  renderPdfPage,
} from '../services/pdfRenderer';
import { ZoomableImage } from './ZoomableImage';

type PdfState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; pageCount: number };

/**
 * A PDF inside the app: Android's own PdfRenderer draws one page at a time into the app-private cache (removed when the viewer
 * closes), shown with the same pinch / double-tap zoom as pictures. Next page is rendered ahead of time. The PDF itself never
 * leaves private storage and there is no way to export it.
 */
export function ChatPdfPages({
  uri,
  onPageLabel,
}: {
  uri: string;
  onPageLabel: (label: string | null) => void;
}) {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const [state, setState] = useState<PdfState>({ status: 'loading' });
  const [page, setPage] = useState(0);
  const [images, setImages] = useState<Record<number, string>>({});
  const [failedPage, setFailedPage] = useState(false);
  const directory = useMemo(
    () =>
      createPageDirectory(`${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`),
    [],
  );
  const rendering = useRef(new Set<number>());
  const renderWidth = Math.min(1800, Math.round(width * 2));

  useEffect(() => {
    let active = true;

    getPdfPageCount(uri).then(
      (pageCount) => {
        if (active) setState(pageCount > 0 ? { status: 'ready', pageCount } : { status: 'error' });
      },
      (error: unknown) => {
        if (active)
          setState(error instanceof PdfRenderError ? { status: 'error' } : { status: 'error' });
      },
    );

    return () => {
      active = false;
    };
  }, [uri]);

  useEffect(() => () => removePageDirectory(directory), [directory]);

  const ensurePage = useCallback(
    async (index: number) => {
      if (state.status !== 'ready' || index < 0 || index >= state.pageCount) {
        return;
      }

      if (images[index] || rendering.current.has(index)) {
        return;
      }

      rendering.current.add(index);

      try {
        const rendered = await renderPdfPage(uri, index, renderWidth, directory);

        setImages((current) => ({ ...current, [index]: rendered.uri }));
      } catch {
        if (index === page) setFailedPage(true);
      } finally {
        rendering.current.delete(index);
      }
    },
    [directory, images, page, renderWidth, state, uri],
  );

  useEffect(() => {
    setFailedPage(false);
    void ensurePage(page);
    void ensurePage(page + 1);
  }, [ensurePage, page]);

  useEffect(() => {
    onPageLabel(
      state.status === 'ready' ? t.chat.media.viewer.page(page + 1, state.pageCount) : null,
    );

    return () => onPageLabel(null);
  }, [onPageLabel, page, state, t]);

  if (state.status === 'error' || failedPage) {
    return (
      <View style={styles.center}>
        <Icon color="#B8BDC9" name="alert" size={32} />
        <AppText align="center" style={styles.muted}>
          {t.chat.media.viewer.pdfFailed}
        </AppText>
      </View>
    );
  }

  if (state.status === 'loading') {
    return (
      <View style={styles.center}>
        <AppText style={styles.muted}>{t.chat.media.viewer.pdfLoading}</AppText>
      </View>
    );
  }

  const go = (delta: number) =>
    setPage((current) => Math.min(state.pageCount - 1, Math.max(0, current + delta)));

  return (
    <View style={styles.flex}>
      <ZoomableImage
        accessibilityLabel={t.chat.media.viewer.page(page + 1, state.pageCount)}
        onError={() => setFailedPage(true)}
        onSwipe={(direction) => go(direction === 'next' ? 1 : -1)}
        uri={images[page] ?? null}
      />
      {state.pageCount > 1 ? (
        <View style={styles.pager}>
          <AppIconButton
            accessibilityLabel={t.chat.media.viewer.page(Math.max(1, page), state.pageCount)}
            disabled={page === 0}
            icon={<Icon color="#FFFFFF" name="chevronRight" />}
            onPress={() => go(-1)}
          />
          <AppText style={styles.white} variant="label">
            {t.chat.media.viewer.page(page + 1, state.pageCount)}
          </AppText>
          <AppIconButton
            accessibilityLabel={t.chat.media.viewer.page(
              Math.min(state.pageCount, page + 2),
              state.pageCount,
            )}
            disabled={page >= state.pageCount - 1}
            icon={<Icon color="#FFFFFF" name="chevronLeft" />}
            onPress={() => go(1)}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xl,
  },
  muted: { color: '#B8BDC9' },
  white: { color: '#FFFFFF' },
  pager: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
});
