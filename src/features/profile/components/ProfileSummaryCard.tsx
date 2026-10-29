import { Image, StyleSheet, View } from 'react-native';

import { AppAvatar, AppBadge, AppCard, AppText } from '../../../components';
import { useTranslation } from '../../../i18n';
import { colors, radius, spacing, useBrand } from '../../../theme';
import {
  getAccountVerificationSummary,
  getProfileContactLabel,
  getProfileDisplayName,
  getProfileRoleLabel,
  isStaffRole,
} from '../services';
import type { ProfileUser } from '../types';

type ProfileSummaryCardProps = {
  user: ProfileUser | null;
  /** Student's faculty; shown as a badge carrying the faculty logo. */
  facultyName?: string | null;
};

export function ProfileSummaryCard({ user, facultyName }: ProfileSummaryCardProps) {
  const { t } = useTranslation();
  const brand = useBrand();
  const displayName = getProfileDisplayName(user, t.profile);
  const summary = getAccountVerificationSummary(user, t.profile);

  return (
    <AppCard padding="lg" variant="elevated">
      <View style={styles.stack}>
        <View style={styles.header}>
          <AppAvatar name={displayName} size="xl" />
          <View style={styles.identity}>
            <AppText variant="h3">{displayName}</AppText>
            <AppText color="secondary" variant="bodySmall">
              {getProfileContactLabel(user, t.profile)}
            </AppText>
            <AppText color="muted" variant="caption">
              {isStaffRole(user?.role) && user?.job_title
                ? user.job_title
                : getProfileRoleLabel(user?.role, t.profile)}
            </AppText>
          </View>
        </View>

        {facultyName ? (
          <View style={[styles.faculty, { backgroundColor: brand.primarySoft }]}>
            <Image
              accessibilityIgnoresInvertColors
              resizeMode="contain"
              source={brand.logo}
              style={styles.logo}
            />
            <AppText style={styles.facultyName} variant="label" weight="700">
              {facultyName}
            </AppText>
          </View>
        ) : null}

        <View style={styles.badges}>
          <AppBadge label={summary.label} variant={summary.variant} />
          {user?.is_email_verified !== undefined ? (
            <AppBadge
              label={
                user.is_email_verified
                  ? t.profile.summary.emailVerified
                  : t.profile.summary.emailUnverified
              }
              variant={user.is_email_verified ? 'success' : 'warning'}
            />
          ) : null}
          {user?.is_phone_verified !== undefined ? (
            <AppBadge
              label={
                user.is_phone_verified
                  ? t.profile.summary.phoneVerified
                  : t.profile.summary.phoneUnverified
              }
              variant={user.is_phone_verified ? 'success' : 'warning'}
            />
          ) : null}
        </View>
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  stack: { gap: spacing.lg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  identity: { flex: 1, minWidth: 0, gap: spacing.xxs },
  faculty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  logo: { width: 44, height: 34 },
  facultyName: { flex: 1, minWidth: 0 },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
