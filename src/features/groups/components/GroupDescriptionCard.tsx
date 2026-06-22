import { AppButton, AppCard, AppText, Stack } from '../../../components';

type GroupDescriptionCardProps = {
  description?: string | null;
  whatsAppLink?: string | null;
  isOpeningWhatsApp?: boolean;
  whatsAppErrorMessage?: string | null;
  onOpenWhatsApp?: () => void;
};

export function GroupDescriptionCard({
  description,
  whatsAppLink,
  isOpeningWhatsApp = false,
  whatsAppErrorMessage,
  onOpenWhatsApp,
}: GroupDescriptionCardProps) {
  return (
    <AppCard variant="default">
      <Stack gap="md">
        <AppText variant="title">وصف المجموعة</AppText>
        <AppText color={description ? 'secondary' : 'muted'} variant="bodySmall">
          {description ?? 'لا يوجد وصف متاح لهذه المجموعة حاليا.'}
        </AppText>
        {whatsAppLink && onOpenWhatsApp ? (
          <AppButton
            loading={isOpeningWhatsApp}
            onPress={onOpenWhatsApp}
            title="فتح رابط واتساب"
            variant="outline"
          />
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
