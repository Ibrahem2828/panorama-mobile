import { AppButton, AppCard, AppText, Stack } from '../../../components';
import { useTranslation } from '../../../i18n';

type GroupDescriptionCardProps = {
  description?: string | null;
  hasWhatsAppChannel?: boolean;
  isOpeningWhatsApp?: boolean;
  whatsAppErrorMessage?: string | null;
  onOpenWhatsApp?: () => void;
};

export function GroupDescriptionCard({
  description,
  hasWhatsAppChannel = false,
  isOpeningWhatsApp = false,
  whatsAppErrorMessage,
  onOpenWhatsApp,
}: GroupDescriptionCardProps) {
  const { t } = useTranslation();

  return (
    <AppCard variant="default">
      <Stack gap="md">
        <AppText variant="title">{t.groups.details.descriptionTitle}</AppText>
        <AppText color={description ? 'secondary' : 'muted'} variant="bodySmall">
          {description ?? t.groups.details.noDescription}
        </AppText>
        {hasWhatsAppChannel && onOpenWhatsApp ? (
          <AppButton
            loading={isOpeningWhatsApp}
            onPress={onOpenWhatsApp}
            title={t.groups.details.openWhatsApp}
            variant="outline"
          />
        ) : null}
        {hasWhatsAppChannel ? (
          <AppText color="muted" variant="caption">
            {t.groups.details.whatsAppNote}
          </AppText>
        ) : null}
        {whatsAppErrorMessage ? (
          <AppText color="error" variant="caption">
            {whatsAppErrorMessage}
          </AppText>
        ) : null}
      </Stack>
    </AppCard>
  );
}
