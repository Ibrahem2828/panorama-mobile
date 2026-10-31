import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppBadge, AppText, Icon } from '../../../components';
import { useTranslation } from '../../../i18n';
import { colors, radius, shadows, useBrand } from '../../../theme';
import { getIsRTL, isolateLtr } from '../../../utils/rtl';
import { formatLevelChip, getSubjectBadges } from '../services';
import type { CatalogSubject } from '../types';

type SubjectCardProps = {
  subject: CatalogSubject;
  onPress?: () => void;
};

/** A read-only catalogue card: name, code, year and semester, and the student's own state. Tapping opens the details. */
function SubjectCardComponent({ subject, onPress }: SubjectCardProps) {
  const { t } = useTranslation();
  const brand = useBrand();
  const level = formatLevelChip(subject, t.subjects);
  const badges = getSubjectBadges(subject);

  return (
    <Pressable
      accessibilityLabel={subject.name}
      accessibilityRole="button"
      android_ripple={{ color: brand.primarySoft }}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed ? styles.pressed : null]}
    >
      <View style={[styles.accent, { backgroundColor: brand.primary }]} />
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <View style={[styles.iconBox, { backgroundColor: brand.primarySoft }]}>
            <Icon color={brand.primary} name="book" size={20} />
          </View>
          <View style={styles.titleBlock}>
            <AppText numberOfLines={2} variant="title">
              {subject.name}
            </AppText>
            {subject.code ? (
              <AppText color="muted" numberOfLines={1} style={styles.ltr} variant="caption">
                {isolateLtr(subject.code)}
              </AppText>
            ) : null}
          </View>
        </View>
        <View style={styles.badges}>
          {level ? <AppBadge label={level} variant="info" /> : null}
          {badges.includes('enrolled') ? (
            <AppBadge label={t.subjects.badges.enrolled} variant="success" />
          ) : null}
          {badges.includes('currentTerm') ? (
            <AppBadge label={t.subjects.badges.currentTerm} variant="brand" />
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

export const SubjectCard = memo(SubjectCardComponent);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    overflow: 'hidden',
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.default,
    backgroundColor: colors.background.surface,
    ...shadows.card,
  },
  pressed: { opacity: 0.92 },
  accent: { width: 5 },
  body: { flex: 1, gap: 12, padding: 14 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: { flex: 1, minWidth: 0, gap: 2 },
  // Latin text keeps its own order but stays on the same edge as the Arabic title.
  ltr: { writingDirection: 'ltr', textAlign: getIsRTL() ? 'right' : 'left' },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
});
