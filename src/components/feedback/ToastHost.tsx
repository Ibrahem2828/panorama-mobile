import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, spacing, zIndex } from '../../theme';
import { AppText } from '../common';
import { Icon } from '../icons';
import { useToastStore } from './toastStore';

const toneStyles = {
  success: { bg: colors.semantic.successSoft, fg: colors.semantic.success, icon: 'checkCircle' },
  error: { bg: colors.semantic.errorSoft, fg: colors.semantic.error, icon: 'alert' },
  info: { bg: colors.semantic.infoSoft, fg: colors.semantic.info, icon: 'info' },
} as const;

/** Draws the current toast near the bottom of the screen. Mount once, at the app root. */
export function ToastHost() {
  const message = useToastStore((state) => state.message);
  const tone = useToastStore((state) => state.tone);
  const insets = useSafeAreaInsets();

  if (!message) {
    return null;
  }

  const style = toneStyles[tone];

  return (
    <View
      pointerEvents="none"
      style={[styles.wrap, { bottom: insets.bottom + spacing.xxl + spacing.xl }]}
    >
      <View
        accessibilityLiveRegion="polite"
        accessibilityRole="alert"
        style={[styles.toast, { backgroundColor: style.bg, borderColor: style.fg }]}
      >
        <Icon color={style.fg} name={style.icon} size={20} />
        <AppText style={styles.text} variant="bodySmall">
          {message}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    alignItems: 'center',
    zIndex: zIndex.toast + 2000,
    elevation: zIndex.toast + 2000,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    maxWidth: 480,
  },
  text: { flexShrink: 1 },
});
