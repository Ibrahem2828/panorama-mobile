import { Image, StyleSheet, View } from 'react-native';

import { images } from '../../../assets/images';
import { AppBadge, AppCard, AppText, Stack } from '../../../components';
import { colors, radius, spacing } from '../../../theme';
import { useTranslation, type TranslationCatalog } from '../../../i18n';
import { getProfileRoleLabel } from '../../profile/services';

type HomeGreetingCardProps = {
  displayName?: string | null;
  userRole?: string | null;
  unreadNotificationsCount: number;
};

function getGreeting(
  displayName: string | null | undefined,
  t: TranslationCatalog['home']['greeting'],
): string {
  return displayName?.trim() ? t.withName(displayName.trim()) : t.generic;
}

export function HomeGreetingCard({
  displayName,
  userRole,
  unreadNotificationsCount,
}: HomeGreetingCardProps) {
  const { t } = useTranslation();

  return (
    <AppCard padding="lg" variant="elevated">
      <Stack gap="md">
        <View style={styles.header}>
          <View style={styles.titleBlock}>
            <AppText variant="h2">{getGreeting(displayName, t.home.greeting)}</AppText>
            <AppText color="secondary" variant="body">
              {t.home.greeting.tagline}
            </AppText>
          </View>
          <Image
            accessibilityIgnoresInvertColors
            accessibilityLabel="Panorama student journey illustration"
            resizeMode="cover"
            source={images.illustrations.dashboardHero}
            style={styles.heroImage}
          />
          {unreadNotificationsCount > 0 ? (
            <AppBadge
              label={t.home.greeting.unread(unreadNotificationsCount)}
              size="md"
              variant="warning"
            />
          ) : null}
        </View>

        {userRole ? (
          <AppText color="muted" variant="caption">
            {t.home.greeting.accountType(getProfileRoleLabel(userRole, t.profile))}
          </AppText>
        ) : null}
      </Stack>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.default,
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  heroImage: {
    width: 74,
    height: 74,
    borderRadius: radius.card,
    backgroundColor: colors.background.muted,
  },
});
