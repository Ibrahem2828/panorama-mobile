import type { IconName } from '../../../components/icons';
import type { TranslationCatalog } from '../../../i18n';
import type { StatusVariant } from '../../../types/common';
import type { Announcement } from '../types';

const DAY_MS = 24 * 60 * 60 * 1000;

/** True when the announcement was published within the last `days` days. */
export function isFreshAnnouncement(
  announcement: Pick<Announcement, 'start_date' | 'created_at' | 'updated_at'>,
  now: number = Date.now(),
  days = 3,
): boolean {
  const raw = announcement.start_date ?? announcement.created_at ?? announcement.updated_at;
  if (!raw) {
    return false;
  }
  const time = Date.parse(raw);
  if (Number.isNaN(time)) {
    return false;
  }
  const age = now - time;
  return age >= -DAY_MS && age <= days * DAY_MS;
}

/** Icon used for an announcement, from its (free-text) type. */
export function getAnnouncementIcon(type?: string | null): IconName {
  const normalized = type?.trim().toLowerCase() ?? '';
  if (/(urgent|important|alert|warning|عاجل|مهم)/u.test(normalized)) {
    return 'alert';
  }
  if (/(event|calendar|exam|schedule|موعد|امتحان|فعالية)/u.test(normalized)) {
    return 'calendar';
  }
  if (/(print|طباعة)/u.test(normalized)) {
    return 'printer';
  }
  return 'megaphone';
}

export type StudentStatusInput = {
  profileComplete: boolean;
  verificationStatus: string;
  hasProfileState: boolean;
  hasVerificationState: boolean;
};

export type StudentStatusView = {
  /** False when there is nothing the student needs to act on (loading or verified). */
  visible: boolean;
  label: string;
  description: string;
  variant: StatusVariant;
  icon: IconName;
};

export function getStudentStatusView(
  {
    profileComplete,
    verificationStatus,
    hasProfileState,
    hasVerificationState,
  }: StudentStatusInput,
  t: TranslationCatalog['home']['studentStatus'],
): StudentStatusView {
  if (!hasProfileState || !hasVerificationState) {
    return {
      visible: false,
      label: t.loadingLabel,
      description: t.loadingDescription,
      variant: 'neutral',
      icon: 'clock',
    };
  }

  if (!profileComplete) {
    return {
      visible: true,
      label: t.incompleteLabel,
      description: t.incompleteDescription,
      variant: 'warning',
      icon: 'user',
    };
  }

  switch (verificationStatus) {
    case 'approved':
      return {
        visible: false,
        label: t.verifiedLabel,
        description: t.verifiedDescription,
        variant: 'success',
        icon: 'shield',
      };
    case 'pending':
      return {
        visible: true,
        label: t.pendingLabel,
        description: t.pendingDescription,
        variant: 'info',
        icon: 'clock',
      };
    case 'rejected':
      return {
        visible: true,
        label: t.rejectedLabel,
        description: t.rejectedDescription,
        variant: 'error',
        icon: 'alert',
      };
    case 'needs_update':
      return {
        visible: true,
        label: t.needsUpdateLabel,
        description: t.needsUpdateDescription,
        variant: 'warning',
        icon: 'upload',
      };
    default:
      return {
        visible: true,
        label: t.unknownLabel,
        description: t.unknownDescription,
        variant: 'neutral',
        icon: 'info',
      };
  }
}
