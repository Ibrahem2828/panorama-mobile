import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '../../theme';
import { AppText } from '../common';
import { Icon } from '../icons';

type FormAlertProps = {
  message: string;
  tone?: 'error' | 'info' | 'success';
};

const toneStyles = {
  error: { bg: colors.semantic.errorSoft, fg: colors.semantic.error, icon: 'alert' },
  info: { bg: colors.semantic.infoSoft, fg: colors.semantic.info, icon: 'info' },
  success: { bg: colors.semantic.successSoft, fg: colors.semantic.success, icon: 'checkCircle' },
} as const;

/** Inline banner for form-level messages (server errors, hints). */
export function FormAlert({ message, tone = 'error' }: FormAlertProps) {
  const style = toneStyles[tone];

  return (
    <View
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      style={[styles.box, { backgroundColor: style.bg }]}
    >
      <Icon color={style.fg} name={style.icon} size={20} />
      <AppText style={styles.text} variant="bodySmall">
        {message}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
  },
  text: {
    flex: 1,
  },
});
