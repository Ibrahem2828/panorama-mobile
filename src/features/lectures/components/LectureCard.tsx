import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppBadge, AppCard, AppText, Icon, Stack } from '../../../components';
import { useTranslation } from '../../../i18n';
import { colors, spacing, radius, useBrand } from '../../../theme';
import { formatDate } from '../../../utils/formatDateTime';
import { lectureTitle } from '../logic';
import type { Lecture } from '../types';
import { LectureStatusBadge } from './LectureStatusBadge';

type Props = {
  lecture: Lecture;
  onPress: (lecture: Lecture) => void;
  /** Compact rows are used inside other screens (subject details). */
  compact?: boolean;
};

function LectureCardBase({ lecture, onPress, compact = false }: Props) {
  const { t, locale } = useTranslation();
  const brand = useBrand();
  const title = lectureTitle(lecture, t.lectures.untitled);
  const date = formatDate(
    lecture.updated_at ?? lecture.published_at ?? lecture.created_at,
    locale,
    {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    },
  );
  const description = lecture.description;

  return (
    <Pressable
      accessibilityLabel={t.lectures.openLecture(title)}
      accessibilityRole="button"
      android_ripple={{ color: colors.ripple, foreground: true }}
      onPress={() => onPress(lecture)}
      style={({ pressed }) => (pressed ? styles.pressed : null)}
    >
      <AppCard padding={compact ? 'sm' : 'md'} variant={compact ? 'default' : 'elevated'}>
        <Stack direction="horizontal" gap="md" align="center">
          <View style={[styles.iconBox, { backgroundColor: brand.primarySoft }]}>
            <Icon color={brand.primary} name="lecture" size={22} />
          </View>
          <View style={styles.body}>
            <AppText numberOfLines={2} variant="subtitle">
              {title}
            </AppText>
            {!compact && description ? (
              <AppText color="secondary" numberOfLines={2} variant="bodySmall">
                {description}
              </AppText>
            ) : null}
            <Stack direction="horizontal" gap="xs" wrap>
              {!compact && lecture.subject_name ? (
                <AppBadge label={lecture.subject_name} variant="info" />
              ) : null}
              <AppBadge label={t.lectures.pagesCount(lecture.page_count)} variant="brand" />
              {lecture.status !== 'ready' ? <LectureStatusBadge status={lecture.status} /> : null}
              {!compact && date ? <AppBadge label={t.lectures.updatedOn(date)} /> : null}
            </Stack>
          </View>
          <Icon color={brand.primary} name="chevronLeft" size={18} />
        </Stack>
      </AppCard>
    </Pressable>
  );
}

export const LectureCard = memo(LectureCardBase);

const styles = StyleSheet.create({
  pressed: { opacity: 0.85 },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, minWidth: 0, gap: spacing.xs },
});
