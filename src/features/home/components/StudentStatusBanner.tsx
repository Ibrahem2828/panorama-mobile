import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { ArtworkTone } from '../../../components';
import { AppText, Icon, IconTile } from '../../../components';
import { useTranslation } from '../../../i18n';
import { colors, opacity, radius, spacing } from '../../../theme';
import { getIsRTL } from '../../../utils/rtl';
import type { StudentStatusInput } from '../services/homePresentation';
import { getStudentStatusView } from '../services/homePresentation';

type StudentStatusBannerProps = StudentStatusInput & {
  onPress: () => void;
};

const TONE_BY_VARIANT: Record<string, ArtworkTone> = {
  warning: 'warning',
  error: 'error',
  info: 'info',
  success: 'success',
  neutral: 'neutral',
  brand: 'brand',
};

/** Slim banner telling a student what is left to do (complete profile / verification). */
function StudentStatusBannerComponent({ onPress, ...status }: StudentStatusBannerProps) {
  const { t } = useTranslation();
  const view = getStudentStatusView(status, t.home.studentStatus);

  if (!view.visible) {
    return null;
  }

  return (
    <Pressable
      accessibilityLabel={`${view.label}. ${view.description}`}
      accessibilityRole="button"
      android_ripple={{ color: colors.ripple, foreground: true }}
      onPress={onPress}
      style={({ pressed }) => [styles.banner, pressed ? styles.pressed : null]}
    >
      <IconTile icon={view.icon} size="sm" tone={TONE_BY_VARIANT[view.variant] ?? 'brand'} />
      <View style={styles.text}>
        <AppText variant="label" weight="700">
          {view.label}
        </AppText>
        <AppText color="secondary" variant="caption">
          {view.description}
        </AppText>
      </View>
      <Icon
        color={colors.text.muted}
        name={getIsRTL() ? 'chevronLeft' : 'chevronRight'}
        size={18}
      />
    </Pressable>
  );
}

export const StudentStatusBanner = memo(StudentStatusBannerComponent);

const styles = StyleSheet.create({
  banner: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.gray[200],
    backgroundColor: colors.background.surface,
    overflow: 'hidden',
  },
  pressed: { opacity: opacity.pressed },
  text: { flex: 1, minWidth: 0 },
});
