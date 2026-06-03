import { AppAvatar, AppBadge, AppCard, AppText, Stack } from '../../../components';
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
  const displayName = getProfileDisplayName(user);
  const summary = getAccountVerificationSummary(user);

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
              {getProfileContactLabel(user)}
            </AppText>
            <AppText color="muted" variant="caption">
              {getProfileRoleLabel(user?.role)}
            </AppText>
          </Stack>
        </Stack>

        <Stack direction="horizontal" gap="sm" wrap>
          <AppBadge label={summary.label} variant={summary.variant} />
          {user?.is_email_verified !== undefined ? (
            <AppBadge
              label={user.is_email_verified ? 'البريد مؤكد' : 'البريد غير مؤكد'}
              variant={user.is_email_verified ? 'success' : 'warning'}
            />
          ) : null}
          {user?.is_phone_verified !== undefined ? (
            <AppBadge
              label={user.is_phone_verified ? 'الهاتف مؤكد' : 'الهاتف غير مؤكد'}
              variant={user.is_phone_verified ? 'success' : 'warning'}
            />
          ) : null}
        </Stack>
      </Stack>
    </AppCard>
  );
}
