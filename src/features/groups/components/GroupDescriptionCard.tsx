import { AppButton, AppCard, AppText, Stack } from '../../../components';

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
  return (
    <AppCard variant="default">
      <Stack gap="md">
        <AppText variant="title">وصف المجموعة</AppText>
        <AppText color={description ? 'secondary' : 'muted'} variant="bodySmall">
          {description ?? 'لا يوجد وصف متاح لهذه المجموعة حاليًا.'}
        </AppText>
        {hasWhatsAppChannel && onOpenWhatsApp ? (
          <AppButton
            loading={isOpeningWhatsApp}
            onPress={onOpenWhatsApp}
            title="فتح قناة واتساب المصرح بها"
            variant="outline"
          />
        ) : null}
        {hasWhatsAppChannel ? (
          <AppText color="muted" variant="caption">
            لا يظهر رابط واتساب داخل بيانات المجموعة. يطلب التطبيق إذنًا مؤقتًا من الخادم عند الفتح.
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
