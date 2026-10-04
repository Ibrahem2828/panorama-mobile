import { AppButton, AppTextInput, Stack } from '../../../components';
import { useTranslation } from '../../../i18n';

type SupportMessageInputProps = {
  value: string;
  error?: string;
  disabled?: boolean;
  loading?: boolean;
  onChangeText: (value: string) => void;
  onSubmit: () => void;
};

export function SupportMessageInput({
  value,
  error,
  disabled = false,
  loading = false,
  onChangeText,
  onSubmit,
}: SupportMessageInputProps) {
  const { t } = useTranslation();
  return (
    <Stack gap="md">
      <AppTextInput
        disabled={disabled}
        error={error}
        label={t.support.details.replyLabel}
        multiline
        onChangeText={onChangeText}
        placeholder={t.support.details.replyPlaceholder}
        value={value}
      />
      <AppButton
        disabled={disabled || value.trim().length === 0}
        loading={loading}
        onPress={onSubmit}
        title={t.support.details.sendReply}
      />
    </Stack>
  );
}
