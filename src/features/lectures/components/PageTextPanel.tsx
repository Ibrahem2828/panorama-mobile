import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { AppButton, AppText } from '../../../components';
import { useTranslation } from '../../../i18n';
import { colors, spacing, useBrand } from '../../../theme';
import type { PageText } from '../types';

type Props = {
  page: number;
  loadText: (page: number) => Promise<PageText>;
};

type State =
  | { page: number; status: 'loading' }
  | { page: number; status: 'error' }
  | { page: number; status: 'ready'; text: string };

/** Extracted text of the current page (cached per page for the life of the viewer). */
export function PageTextPanel({ page, loadText }: Props) {
  const { t } = useTranslation();
  const brand = useBrand();
  const cache = useRef(new Map<number, string>());
  const [state, setState] = useState<State>(() => {
    const cached = cache.current.get(page);
    return cached === undefined
      ? { page, status: 'loading' }
      : { page, status: 'ready', text: cached };
  });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const cached = cache.current.get(page);
    if (cached !== undefined) {
      setState({ page, status: 'ready', text: cached });
      return;
    }
    let cancelled = false;
    setState({ page, status: 'loading' });
    loadText(page).then(
      (result) => {
        if (cancelled) return;
        cache.current.set(page, result.text);
        setState({ page, status: 'ready', text: result.text });
      },
      () => {
        if (!cancelled) setState({ page, status: 'error' });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [page, loadText, attempt]);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);
  const current = state.page === page ? state : { page, status: 'loading' as const };

  return (
    <View style={styles.container}>
      <AppText variant="subtitle">{t.lectures.viewer.textTitle}</AppText>
      {current.status === 'loading' ? (
        <View style={styles.center}>
          <ActivityIndicator color={brand.primary} />
          <AppText color="secondary" variant="bodySmall">
            {t.lectures.viewer.textLoading}
          </AppText>
        </View>
      ) : current.status === 'error' ? (
        <View style={styles.center}>
          <AppText align="center" color="error" variant="bodySmall">
            {t.lectures.viewer.textError}
          </AppText>
          <AppButton onPress={retry} size="sm" title={t.lectures.viewer.retry} variant="outline" />
        </View>
      ) : current.text.trim() ? (
        <ScrollView contentContainerStyle={styles.textContent}>
          <AppText selectable variant="body">
            {current.text}
          </AppText>
        </ScrollView>
      ) : (
        <AppText color="secondary" variant="bodySmall">
          {t.lectures.viewer.textEmpty}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.background.surface,
  },
  center: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.lg },
  textContent: { paddingBottom: spacing.xl },
});
