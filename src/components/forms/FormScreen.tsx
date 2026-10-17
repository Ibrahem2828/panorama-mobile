import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTranslation } from '../../i18n';
import { colors, layout, radius, spacing } from '../../theme';
import { getIsRTL } from '../../utils/rtl';
import { Icon } from '../icons';

type FormScreenProps = {
  children: ReactNode;
  /** Pinned under the scrolling content and always above the keyboard (primary action). */
  footer?: ReactNode;
  backgroundColor?: string;
  /** Centre the content vertically when it is shorter than the screen. */
  centered?: boolean;
};

/**
 * Screen shell for forms: safe areas, keyboard avoidance that works with Android
 * edge-to-edge (padding, not resize), scrolling content and a pinned footer so the primary
 * button never hides behind the keyboard.
 */
export function FormScreen({
  children,
  footer,
  backgroundColor = colors.background.surface,
  centered = false,
}: FormScreenProps) {
  return (
    <SafeAreaView style={[styles.root, { backgroundColor }]}>
      <KeyboardAvoidingView behavior="padding" style={styles.flex}>
        <ScrollView
          contentContainerStyle={[styles.content, centered ? styles.centered : null]}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={styles.flex}
        >
          {children}
        </ScrollView>
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/** Round back button whose arrow points the way "back" goes in the current direction. */
export function FormBackButton({ onPress }: { onPress: () => void }) {
  const { t } = useTranslation();

  return (
    <Pressable
      accessibilityLabel={t.common.back}
      accessibilityRole="button"
      hitSlop={6}
      onPress={onPress}
      style={({ pressed }) => [styles.back, pressed ? styles.backPressed : null]}
    >
      <Icon
        color={colors.text.primary}
        name={getIsRTL() ? 'chevronRight' : 'chevronLeft'}
        size={22}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    gap: spacing.xl,
    paddingHorizontal: layout.screenHorizontalPadding,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  centered: {
    justifyContent: 'center',
  },
  footer: {
    gap: spacing.sm,
    paddingHorizontal: layout.screenHorizontalPadding,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.default,
    backgroundColor: colors.background.surface,
  },
  back: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
    backgroundColor: colors.background.muted,
  },
  backPressed: {
    opacity: 0.7,
  },
});
