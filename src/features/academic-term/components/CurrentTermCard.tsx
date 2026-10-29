import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppCard, AppText } from '../../../components';
import { useTranslation } from '../../../i18n';
import { colors, radius, spacing, useBrand } from '../../../theme';
import { useTermStore } from '../termStore';

/**
 * Shows the semester the university is in now and the other one, whatever year the student is in: students may register
 * subjects of any year or semester. Renders nothing until the term is known, so offline or failed loads leave no gap.
 */
export function CurrentTermCard() {
  const { t } = useTranslation();
  const brand = useBrand();
  const term = useTermStore((state) => state.currentTerm);
  const load = useTermStore((state) => state.loadCurrentTerm);

  useEffect(() => {
    void load();
  }, [load]);

  if (!term) {
    return null;
  }

  return (
    <AppCard variant="muted">
      <View style={styles.stack}>
        <AppText variant="title">{term.term_label || t.academicTerm.card.title}</AppText>
        <View style={styles.row}>
          <View style={[styles.pill, { backgroundColor: brand.primarySoft }]}>
            <AppText color="muted" variant="caption">
              {t.academicTerm.card.current}
            </AppText>
            <AppText color="brand" variant="label" weight="700">
              {term.semester.name}
            </AppText>
          </View>
          {term.other_semester ? (
            <View style={styles.pill}>
              <AppText color="muted" variant="caption">
                {t.academicTerm.card.other}
              </AppText>
              <AppText variant="label">{term.other_semester.name}</AppText>
            </View>
          ) : null}
        </View>
        <AppText color="secondary" variant="caption">
          {t.academicTerm.card.anyLevel}
        </AppText>
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  stack: { gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm },
  pill: {
    flex: 1,
    gap: spacing.xxs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
});
