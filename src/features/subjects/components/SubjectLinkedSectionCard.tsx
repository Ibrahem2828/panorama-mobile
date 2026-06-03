import { Pressable, StyleSheet } from 'react-native';

import { AppBadge, AppCard, AppText, Stack } from '../../../components';
import { opacity } from '../../../theme';

type SubjectLinkedSectionCardProps = {
  title: string;
  description: string;
  disabled?: boolean;
  onPress?: () => void;
};

export function SubjectLinkedSectionCard({
  title,
  description,
  disabled = false,
  onPress,
}: SubjectLinkedSectionCardProps) {
  const isDisabled = disabled || !onPress;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        isDisabled ? styles.disabled : null,
        pressed && !isDisabled ? styles.pressed : null,
      ]}
    >
      <AppCard variant="muted">
        <Stack direction="horizontal" gap="md" style={styles.content}>
          <Stack gap="xs" style={styles.textBlock}>
            <AppText variant="title">{title}</AppText>
            <AppText color="secondary" variant="bodySmall">
              {description}
            </AppText>
          </Stack>
          <AppBadge label="لاحقا" variant="neutral" />
        </Stack>
      </AppCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textBlock: {
    flex: 1,
    minWidth: 0,
  },
  disabled: {
    opacity: opacity.disabled,
  },
  pressed: {
    opacity: opacity.pressed,
  },
});
