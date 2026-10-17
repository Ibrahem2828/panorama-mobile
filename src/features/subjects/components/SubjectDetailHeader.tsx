import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { AppText, Icon } from '../../../components';
import { useTranslation } from '../../../i18n';
import { radius, spacing, useBrand } from '../../../theme';
import {
  getSubjectCode,
  getSubjectDescription,
  getSubjectDisplayName,
  parseSubjectMeta,
} from '../services';
import type { Subject } from '../types';
import { useSubjectLabels } from '../useSubjectLabels';

type SubjectDetailHeaderProps = {
  subject: Subject;
};

export function SubjectDetailHeader({ subject }: SubjectDetailHeaderProps) {
  const { t } = useTranslation();
  const brand = useBrand();
  const labels = useSubjectLabels();
  const onTint = (alpha: number) =>
    brand.onPrimary === '#FFFFFF' ? `rgba(255,255,255,${alpha})` : `rgba(11,16,32,${alpha})`;
  const title = getSubjectDisplayName(subject, t.subjects);
  const code = getSubjectCode(subject);
  const description = getSubjectDescription(subject);
  const { credits, category } = parseSubjectMeta(subject);
  const chips = [
    code ? t.subjects.codeBadge(code) : null,
    labels.year(subject.academic_year),
    labels.semester(subject.semester),
    labels.major(subject.major),
    credits,
    category,
  ].filter((value): value is string => Boolean(value));

  return (
    <View style={styles.card}>
      <View style={[styles.body, { backgroundColor: brand.primary }]}>
        <View style={styles.iconRow}>
          <View style={[styles.iconBubble, { backgroundColor: onTint(0.18) }]}>
            <Icon color={brand.onPrimary} name="book" size={24} />
          </View>
        </View>
        <AppText style={{ color: brand.onPrimary }} variant="h2">
          {title}
        </AppText>
        {description ? (
          <AppText style={{ color: onTint(0.9) }} variant="bodySmall">
            {description}
          </AppText>
        ) : null}
        {chips.length > 0 ? (
          <View style={styles.chips}>
            {chips.map((chip) => (
              <View key={chip} style={[styles.chip, { backgroundColor: onTint(0.18) }]}>
                <AppText style={{ color: brand.onPrimary }} variant="caption" weight="600">
                  {chip}
                </AppText>
              </View>
            ))}
          </View>
        ) : null}
      </View>
      <LinearGradient
        colors={brand.ribbon}
        end={{ x: 1, y: 0 }}
        start={{ x: 0, y: 0 }}
        style={styles.ribbon}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xxl,
    overflow: 'hidden',
  },
  body: {
    gap: spacing.md,
    padding: spacing.card.lg,
  },
  iconRow: {
    flexDirection: 'row',
  },
  iconBubble: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
  },
  ribbon: {
    height: 6,
  },
});
