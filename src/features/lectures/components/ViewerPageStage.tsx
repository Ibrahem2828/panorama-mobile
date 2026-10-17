import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import type { LayoutChangeEvent } from 'react-native';

import { AppButton, AppText } from '../../../components';
import { useTranslation } from '../../../i18n';
import { colors, spacing, useBrand } from '../../../theme';
import { getIsRTL } from '../../../utils/rtl';
import type { ViewerPages } from '../hooks/useViewerPages';
import { prefetchPages, toggleZoom, ZOOM_FIT, type LectureErrorKind } from '../logic';

type Props = {
  title: string;
  page: number;
  pageCount: number;
  zoom: number;
  pages: ViewerPages;
  onZoomChange: (zoom: number) => void;
  onNavigate: (direction: 'next' | 'prev') => void;
};

const DOUBLE_TAP_MS = 280;
const SWIPE_DISTANCE = 56;
const TAP_SLOP = 10;

type Size = { width: number; height: number };
type PageError = { page: number; kind: LectureErrorKind };

/**
 * One protected page: a low-res thumbnail first, then the full image streamed by the native image loader (with the
 * viewer-session header), neighbouring pages prefetched at the same size so the next swipe is instant.
 *
 * Zoom without extra dependencies: double-tap or the zoom buttons scale the page inside a two-axis ScrollView (iOS also
 * gets native pinch from the ScrollView). Swipe changes page while the page fits the screen.
 */
export function ViewerPageStage({
  title,
  page,
  pageCount,
  zoom,
  pages,
  onZoomChange,
  onNavigate,
}: Props) {
  const { t } = useTranslation();
  const brand = useBrand();
  const [size, setSize] = useState<Size | null>(null);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [thumbKey, setThumbKey] = useState<string | null>(null);
  const [error, setError] = useState<PageError | null>(null);
  const warmPages = useRef(new Set<number>());
  const lastTap = useRef(0);
  const latest = useRef({ zoom, onZoomChange, onNavigate });

  useEffect(() => {
    latest.current = { zoom, onZoomChange, onNavigate };
  });

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize((current) =>
      current && current.width === width && current.height === height ? current : { width, height },
    );
  }, []);

  const registerTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTap.current < DOUBLE_TAP_MS) {
      lastTap.current = 0;
      latest.current.onZoomChange(toggleZoom(latest.current.zoom));
    } else {
      lastTap.current = now;
    }
  }, []);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_event, gesture) =>
          Math.abs(gesture.dx) > 12 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.5,
        onPanResponderRelease: (_event, gesture) => {
          if (Math.abs(gesture.dx) < TAP_SLOP && Math.abs(gesture.dy) < TAP_SLOP) {
            registerTap();
            return;
          }
          if (Math.abs(gesture.dx) < SWIPE_DISTANCE) return;
          // Arabic reads right to left: the next page is on the left, so a swipe to the right advances.
          const towardsEnd = getIsRTL() ? gesture.dx > 0 : gesture.dx < 0;
          latest.current.onNavigate(towardsEnd ? 'next' : 'prev');
        },
      }),
    [registerTap],
  );

  const pageSource = pages.ready ? pages.getSource('page', page) : null;
  const pageKey = pages.sourceKey('page', page);
  const pageLoaded = loadedKey === pageKey || warmPages.current.has(page);
  const thumbSource =
    pages.ready && !pageLoaded && !warmPages.current.has(page)
      ? pages.getSource('thumbnail', page)
      : null;
  const thumbnailKey = pages.sourceKey('thumbnail', page);
  const pageError = error && error.page === page ? error.kind : null;

  const neighbours = useMemo(
    () => (loadedKey === pageKey ? prefetchPages(page, pageCount) : []),
    [loadedKey, pageKey, page, pageCount],
  );

  const handleImageError = useCallback(() => {
    void pages.onPageImageError(page).then((kind) => {
      if (kind) setError({ page, kind });
    });
  }, [page, pages]);

  const handleRetry = useCallback(() => {
    setError(null);
    setLoadedKey(null);
    pages.retry(page);
  }, [page, pages]);

  const showLoader = !pageError && !pageLoaded && thumbKey !== thumbnailKey;
  const fit = zoom <= ZOOM_FIT + 1e-6;

  function renderLayers(width: number, height: number) {
    const dimensions = { width, height };
    return (
      <View style={dimensions}>
        {thumbSource ? (
          <Image
            accessibilityIgnoresInvertColors
            fadeDuration={0}
            key={thumbnailKey}
            onLoad={() => setThumbKey(thumbnailKey)}
            resizeMode="contain"
            source={thumbSource}
            style={[styles.layer, dimensions]}
          />
        ) : null}
        {pageSource && !pageError ? (
          <Image
            accessibilityIgnoresInvertColors
            accessibilityLabel={t.lectures.viewer.pageAlt(title, page)}
            fadeDuration={0}
            key={pageKey}
            onError={handleImageError}
            onLoad={() => {
              warmPages.current.delete(page);
              setLoadedKey(pageKey);
            }}
            resizeMode="contain"
            source={pageSource}
            style={[styles.layer, dimensions]}
          />
        ) : null}
      </View>
    );
  }

  return (
    <View onLayout={handleLayout} style={styles.stage}>
      {size ? (
        <>
          {fit ? (
            <View {...panResponder.panHandlers} style={size}>
              {renderLayers(size.width, size.height)}
            </View>
          ) : (
            <ScrollView
              bounces={false}
              maximumZoomScale={Platform.OS === 'ios' ? 3 : 1}
              minimumZoomScale={1}
              nestedScrollEnabled
              showsVerticalScrollIndicator={false}
              style={size}
            >
              <ScrollView
                bounces={false}
                horizontal
                nestedScrollEnabled
                showsHorizontalScrollIndicator={false}
              >
                <Pressable
                  accessibilityLabel={t.lectures.viewer.zoomLevel(Math.round(zoom * 100))}
                  accessibilityRole="image"
                  onPress={registerTap}
                >
                  {renderLayers(size.width * zoom, size.height * zoom)}
                </Pressable>
              </ScrollView>
            </ScrollView>
          )}

          {/* Warm the neighbours at the same size the next page will be drawn with. */}
          {fit && neighbours.length > 0 ? (
            <View pointerEvents="none" style={[styles.warm, size]}>
              {neighbours.map((neighbour) => {
                const source = pages.getSource('page', neighbour);
                if (!source) return null;
                return (
                  <Image
                    accessibilityElementsHidden
                    fadeDuration={0}
                    importantForAccessibility="no-hide-descendants"
                    key={pages.sourceKey('page', neighbour)}
                    onLoad={() => warmPages.current.add(neighbour)}
                    resizeMode="contain"
                    source={source}
                    style={[styles.layer, size]}
                  />
                );
              })}
            </View>
          ) : null}

          {showLoader ? (
            <View pointerEvents="none" style={styles.overlay}>
              <ActivityIndicator color={brand.primary} size="large" />
              <AppText align="center" color="secondary" variant="bodySmall">
                {pages.ready ? t.lectures.viewer.loadingPage : t.lectures.viewer.sessionStarting}
              </AppText>
            </View>
          ) : null}

          {pageError ? (
            <View style={styles.overlay}>
              <AppText align="center" color="error" variant="title">
                {t.lectures.viewer.pageErrorTitle}
              </AppText>
              <AppText align="center" color="secondary" variant="bodySmall">
                {pageError === 'unknown'
                  ? t.lectures.viewer.pageErrorMessage
                  : t.lectures.errors[pageError]}
              </AppText>
              <AppButton onPress={handleRetry} title={t.lectures.viewer.retry} variant="outline" />
            </View>
          ) : null}
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  stage: { flex: 1, backgroundColor: colors.background.muted, overflow: 'hidden' },
  layer: { position: 'absolute', top: 0, start: 0 },
  warm: { position: 'absolute', top: 0, start: 0, opacity: 0 },
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xl,
  },
});
