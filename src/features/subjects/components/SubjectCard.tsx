import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppBadge, AppText, Icon } from '../../../components';
import { useTranslation, type TranslationCatalog } from '../../../i18n';
import { colors, radius, shadows, useBrand } from '../../../theme';
import { getSubjectCode, getSubjectDisplayName, parseSubjectMeta } from '../services';
import type { Subject } from '../types';
import { useSubjectLabels } from '../useSubjectLabels';

type SubjectCardProps = {
  subject: Subject;
  onPress?: () => void;
};

function getCountBadges(subject: Subject, t: TranslationCatalog) {
  return [
    typeof subject.files_count === 'number' ? t.subjects.filesCount(subject.files_count) : null,
    typeof subject.groups_count === 'number' ? t.subjects.groupsCount(subject.groups_count) : null,
    typeof subject.lectures_count === 'number'
      ? t.subjects.lecturesCount(subject.lectures_count)
      : null,
  ].filter((value): value is string => Boolean(value));
}

function SubjectCardComponent({ subject, onPress }: SubjectCardProps) {
  const { t } = useTranslation();
  const brand = useBrand();
  const title = getSubjectDisplayName(subject, t.subjects);
  const code = getSubjectCode(subject);
  const { credits, category, englishName } = parseSubjectMeta(subject);
  const labels = useSubjectLabels();
  const academicYear = labels.year(subject.academic_year);
  const semester = labels.semester(subject.semester);
  const major = labels.major(subject.major);
  const countBadges = getCountBadges(subject, t);

  return (
    <Pressable
      accessibilityLabel={title}
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
              {title}
            </AppText>
            {englishName ? (
              <AppText color="muted" numberOfLines={1} style={styles.ltr} variant="caption">
                {englishName}
              </AppText>
            ) : null}
          </View>
          {code ? (
            <View style={[styles.codeBox, { backgroundColor: brand.primarySoft }]}>
              <AppText style={{ color: brand.primary }} variant="caption" weight="700">
                {code}
              </AppText>
            </View>
          ) : null}
        </View>
        <View style={styles.badges}>
          {academicYear ? <AppBadge label={academicYear} variant="info" /> : null}
          {semester ? <AppBadge label={semester} variant="neutral" /> : null}
          {credits ? <AppBadge label={credits} variant="neutral" /> : null}
          {category ? <AppBadge label={category} variant="brand" /> : null}
          <AppBadge label={major ?? t.subjects.general} variant={major ? 'warning' : 'success'} />
          {countBadges.map((label) => (
            <AppBadge key={label} label={label} variant="neutral" />
          ))}
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
  ltr: { writingDirection: 'ltr', textAlign: 'left' },
  codeBox: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
});
