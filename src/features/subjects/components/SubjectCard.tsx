import { useRef } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';

import { AppBadge, AppCard, AppText, Stack } from '../../../components';
import { opacity } from '../../../theme';
import { createPressScaleAnim } from '../../../utils/motion';
import {
  getEntityLabel,
  getSubjectCode,
  getSubjectDescription,
  getSubjectDisplayName,
} from '../services';
import type { Subject } from '../types';

type SubjectCardProps = {
  subject: Subject;
  onPress?: () => void;
};

function getCountBadges(subject: Subject) {
  return [
    typeof subject.files_count === 'number' ? `ملفات ${subject.files_count}` : null,
    typeof subject.groups_count === 'number' ? `مجموعات ${subject.groups_count}` : null,
    typeof subject.lectures_count === 'number' ? `محاضرات ${subject.lectures_count}` : null,
  ].filter((value): value is string => Boolean(value));
}

export function SubjectCard({ subject, onPress }: SubjectCardProps) {
  const title = getSubjectDisplayName(subject);
  const code = getSubjectCode(subject);
  const description = getSubjectDescription(subject);
  const academicYear = getEntityLabel(subject.academic_year);
  const semester = getEntityLabel(subject.semester);
  const countBadges = getCountBadges(subject);

  const { scale, onPressIn, onPressOut } = useRef(createPressScaleAnim()).current;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={!onPress}
      onPress={onPress}
      onPressIn={onPress ? onPressIn : undefined}
      onPressOut={onPress ? onPressOut : undefined}
      style={({ pressed }) => [pressed && onPress ? styles.pressed : null]}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <AppCard variant="elevated">
          <Stack gap="md">
            <Stack direction="horizontal" gap="md" style={styles.header}>
              <Stack gap="xs" style={styles.titleBlock}>
                <AppText variant="title">{title}</AppText>
                {code ? (
                  <AppText color="muted" variant="caption">
                    رمز المادة: {code}
                  </AppText>
                ) : null}
              </Stack>
              <AppBadge label="مادة" variant="brand" />
            </Stack>

            {description ? (
              <AppText color="secondary" variant="bodySmall">
                {description}
              </AppText>
            ) : null}

            <Stack direction="horizontal" gap="sm" wrap>
              {academicYear ? <AppBadge label={`السنة ${academicYear}`} variant="info" /> : null}
              {semester ? <AppBadge label={`الفصل ${semester}`} variant="neutral" /> : null}
              {countBadges.map((label) => (
                <AppBadge key={label} label={label} variant="neutral" />
              ))}
            </Stack>
          </Stack>
        </AppCard>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: opacity.pressed,
  },
  header: {
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
  },
});
