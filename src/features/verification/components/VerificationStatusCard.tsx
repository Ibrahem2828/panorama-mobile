import { StyleSheet, View } from 'react-native';

import { images } from '../../../assets/images';
import { AppBadge, AppCard, AppText, Illustration, Stack } from '../../../components';
import { colors, spacing } from '../../../theme';
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
      };
    case 'pending':
      return {
        label: t.pendingLabel,
        description: t.pendingDescription,
        variant: 'warning',
      };
    case 'rejected':
      return {
        label: t.rejectedLabel,
        description: t.rejectedDescription,
        variant: 'error',
      };
    case 'needs_update':
      return {
        label: t.needsUpdateLabel,
        description: t.needsUpdateDescription,
        variant: 'warning',
      };
    case 'none':
    default:
      return {
        label: t.notSubmittedLabel,
        description: t.notSubmittedDescription,
        variant: 'neutral',
      };
  }
}

export function VerificationStatusCard({ verification }: VerificationStatusCardProps) {
  const { t } = useTranslation();
  const statusView = getStatusView(verification, t.verificationFlow.statusCard);
  const rejectionReason = getVerificationRejectionReason(verification);
  const status = getVerificationStatus(verification);
  const illustration =
    status === 'approved'
      ? images.verification.approved
      : status === 'pending'
        ? images.verification.pending
        : status === 'rejected' || status === 'needs_update'
          ? images.verification.rejected
          : images.verification.studentCardGuide;

  return (
    <AppCard padding="lg" variant="default">
      <Stack gap="md">
        <Illustration
          accessibilityLabel={t.verificationFlow.statusCard.illustrationAlt}
          size="lg"
          source={illustration}
        />

        <View style={styles.header}>
          <AppText variant="title">{t.verificationFlow.statusCard.title}</AppText>
          <AppBadge label={statusView.label} size="md" variant={statusView.variant} />
        </View>

        <AppText color="secondary" variant="body">
          {statusView.description}
        </AppText>

        {rejectionReason ? (
          <View style={styles.reasonBox}>
            <Stack gap="xs">
              <AppText color="error" variant="bodySmall" weight="600">
                {t.verificationFlow.statusCard.rejectionTitle}
              </AppText>
              <AppText color="secondary" variant="bodySmall">
                {rejectionReason}
              </AppText>
            </Stack>
          </View>
        ) : null}
      </Stack>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.default,
  },
  reasonBox: {
    padding: spacing.md,
    borderRadius: 8,
    backgroundColor: colors.background.muted,
  },
});
