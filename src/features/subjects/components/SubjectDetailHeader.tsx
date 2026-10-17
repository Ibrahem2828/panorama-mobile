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
          <View style={styles.iconBubble}>
            <Icon color="#FFFFFF" name="book" size={24} />
          </View>
        </View>
        <AppText style={styles.title} variant="h2">
          {title}
        </AppText>
        {description ? (
          <AppText style={styles.description} variant="bodySmall">
            {description}
          </AppText>
        ) : null}
        {chips.length > 0 ? (
          <View style={styles.chips}>
            {chips.map((chip) => (
              <View key={chip} style={styles.chip}>
                <AppText style={styles.chipText} variant="caption" weight="600">
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
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  title: {
    color: '#FFFFFF',
  },
  description: {
    color: 'rgba(255,255,255,0.88)',
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
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  chipText: {
    color: '#FFFFFF',
  },
  ribbon: {
    height: 6,
  },
});
