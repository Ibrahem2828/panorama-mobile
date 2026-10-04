import { AppBadge } from '../../../components';
import { useTranslation, type TranslationCatalog } from '../../../i18n';
import type { GroupMembershipStatus } from '../types';

type GroupMembershipBadgeProps = {
  status?: GroupMembershipStatus | null;
};

function getMembershipLabel(
  status: GroupMembershipStatus | null | undefined,
  t: TranslationCatalog['groups']['membership'],
): string {
  switch (status) {
    case 'pending':
      return t.pending;
    case 'approved':
      return t.member;
    case 'rejected':
      return t.rejected;
    case 'blocked':
      return t.blocked;
    case 'left':
      return t.left;
    case 'none':
    case undefined:
    case null:
      return t.notJoined;
    default:
      return t.fallback;
  }
}

function getMembershipVariant(status?: GroupMembershipStatus | null) {
  switch (status) {
    case 'approved':
      return 'success' as const;
    case 'pending':
      return 'warning' as const;
    case 'rejected':
    case 'blocked':
      return 'error' as const;
    case 'left':
      return 'neutral' as const;
    default:
      return 'info' as const;
  }
}

export function GroupMembershipBadge({ status }: GroupMembershipBadgeProps) {
  const { t } = useTranslation();

  return (
    <AppBadge
      label={getMembershipLabel(status, t.groups.membership)}
      size="sm"
      variant={getMembershipVariant(status)}
    />
  );
}
