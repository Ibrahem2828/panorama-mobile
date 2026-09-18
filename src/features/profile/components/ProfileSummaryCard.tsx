import { AppAvatar, AppBadge, AppCard, AppText, Stack } from '../../../components';
import { useTranslation } from '../../../i18n';
import {
  getAccountVerificationSummary,
  getProfileContactLabel,
  getProfileDisplayName,
  getProfileRoleLabel,
} from '../services';
import type { ProfileUser } from '../types';

type ProfileSummaryCardProps = {
  user: ProfileUser | null;
};

export function ProfileSummaryCard({ user }: ProfileSummaryCardProps) {
  const { t } = useTranslation();
  const displayName = getProfileDisplayName(user, t.profile);
  const summary = getAccountVerificationSummary(user, t.profile);

  return (
    <AppCard padding="lg" variant="elevated">
      <Stack gap="lg">
        <Stack align="center" direction="horizontal" gap="md">
          <AppAvatar name={displayName} size="lg" />
          <Stack gap="xs" style={{ flex: 1, minWidth: 0 }}>
            <AppText numberOfLines={2} variant="title">
              {displayName}
            </AppText>
            <AppText color="secondary" numberOfLines={1} variant="bodySmall">
              {getProfileContactLabel(user, t.profile)}
            </AppText>
            <AppText color="muted" variant="caption">
              {getProfileRoleLabel(user?.role, t.profile)}
            </AppText>
          </Stack>
        </Stack>

        <Stack direction="horizontal" gap="sm" wrap>
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
        </Stack>
      </Stack>
    </AppCard>
  );
}
