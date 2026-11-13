import { useEffect } from 'react';

import { useTranslation } from '../../../i18n';
import { ProfileActionItem } from '../../profile/components/ProfileActionItem';
import { usePhoneVerificationStore } from '../store/phoneVerificationStore';

type PhoneVerificationEntryProps = {
  onPress: () => void;
};

/**
 * The account-screen row that opens the verification flow. Its subtitle and badge follow the request (nothing asked yet,
 * waiting for staff, code to type), which it reads quietly when the account screen opens.
 */
export function PhoneVerificationEntry({ onPress }: PhoneVerificationEntryProps) {
  const { t } = useTranslation();
  const copy = t.phoneVerify;
  const status = usePhoneVerificationStore((state) => state.request?.status);

  useEffect(() => {
    void usePhoneVerificationStore.getState().load({ silent: true });
  }, []);

  const subtitle =
    status === 'pending_staff'
      ? copy.entry.subtitleWaiting
      : status === 'code_sent'
        ? copy.entry.subtitleCode
        : copy.entry.subtitleUnverified;
  const badge =
    status === 'pending_staff'
      ? copy.entry.badgeWaiting
      : status === 'code_sent'
        ? copy.entry.badgeCode
        : copy.entry.badgeNeeded;

  return (
    <ProfileActionItem
      badge={badge}
      badgeVariant="warning"
      icon="phone"
      onPress={onPress}
      subtitle={subtitle}
      title={copy.title}
    />
  );
}
