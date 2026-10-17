import { StyleSheet, View } from 'react-native';

import { AppBadge, AppText, Icon } from '../../../components';
import type { IconName } from '../../../components';
import { colors, radius, spacing } from '../../../theme';
import type { StatusVariant } from '../../../types/common';
import { getVerificationRejectionReason, getVerificationStatus } from '../services';
import type { VerificationRecord } from '../types';
import { useTranslation, type TranslationCatalog } from '../../../i18n';

type VerificationStatusCardProps = {
  verification: VerificationRecord | null;
};

type VerificationStatusView = {
  label: string;
  description: string;
  variant: StatusVariant;
  icon: IconName;
  tint: string;
  soft: string;
};

function getStatusView(
  verification: VerificationRecord | null,
  t: TranslationCatalog['verificationFlow']['statusCard'],
): VerificationStatusView {
  const status = getVerificationStatus(verification);

  switch (status) {
    case 'approved':
      return {
        label: t.approvedLabel,
        description: t.approvedDescription,
        variant: 'success',
        icon: 'shield',
        tint: colors.semantic.success,
        soft: colors.semantic.successSoft,
      };
    case 'pending':
      return {
        label: t.pendingLabel,
        description: t.pendingDescription,
        variant: 'warning',
        icon: 'clock',
        tint: colors.semantic.warning,
        soft: colors.semantic.warningSoft,
      };
    case 'rejected':
      return {
        label: t.rejectedLabel,
        description: t.rejectedDescription,
        variant: 'error',
        icon: 'xCircle',
        tint: colors.semantic.error,
        soft: colors.semantic.errorSoft,
      };
    case 'needs_update':
      return {
        label: t.needsUpdateLabel,
        description: t.needsUpdateDescription,
        variant: 'warning',
        icon: 'alert',
        tint: colors.semantic.warning,
        soft: colors.semantic.warningSoft,
      };
    case 'none':
    default:
      return {
        label: t.notSubmittedLabel,
        description: t.notSubmittedDescription,
        variant: 'neutral',
        icon: 'idCard',
        tint: colors.text.secondary,
        soft: colors.background.muted,
      };
  }
}

/** Status hero: a coloured icon badge, the status label and a plain-language description. */
export function VerificationStatusCard({ verification }: VerificationStatusCardProps) {
  const { t } = useTranslation();
  const statusView = getStatusView(verification, t.verificationFlow.statusCard);
  const rejectionReason = getVerificationRejectionReason(verification);

  return (
    <View style={[styles.card, { backgroundColor: statusView.soft }]}>
      <View style={[styles.badge, { backgroundColor: statusView.tint }]}>
        <Icon color={colors.text.inverse} name={statusView.icon} size={32} />
      </View>
      <AppBadge label={statusView.label} size="md" variant={statusView.variant} />
      <AppText align="center" color="secondary" variant="body">
        {statusView.description}
      </AppText>

      {rejectionReason ? (
        <View style={styles.reasonBox}>
          <AppText color="error" variant="bodySmall" weight="600">
            {t.verificationFlow.statusCard.rejectionTitle}
          </AppText>
          <AppText color="secondary" variant="bodySmall">
            {rejectionReason}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.xl,
    borderRadius: radius.xl,
  },
  badge: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
  },
  reasonBox: {
    alignSelf: 'stretch',
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.background.surface,
  },
});
