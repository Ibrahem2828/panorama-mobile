import { AppButton, AppTextInput, Stack } from '../../../components';
import { useTranslation } from '../../../i18n';
import { AttachmentPicker, type LocalFile } from '../../attachments';

type SupportMessageInputProps = {
  value: string;
  error?: string;
  disabled?: boolean;
  loading?: boolean;
  attachment?: LocalFile | null;
  uploadPercent?: number | null;
  onChangeAttachment?: (file: LocalFile | null) => void;
  onCancelUpload?: () => void;
  onChangeText: (value: string) => void;
  onSubmit: () => void;
};

export function SupportMessageInput({
  value,
  error,
  disabled = false,
  loading = false,
  attachment = null,
  uploadPercent = null,
  onChangeAttachment,
  onCancelUpload,
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
      {onChangeAttachment ? (
        <AttachmentPicker
          disabled={disabled || loading}
          file={attachment}
          onChange={onChangeAttachment}
          uploadPercent={loading ? uploadPercent : null}
        />
      ) : null}
      {loading && uploadPercent !== null && onCancelUpload ? (
        <AppButton onPress={onCancelUpload} title={t.support.cancelUpload} variant="outline" />
      ) : (
        <AppButton
          disabled={disabled || value.trim().length === 0}
          loading={loading}
          onPress={onSubmit}
          title={t.support.details.sendReply}
        />
      )}
    </Stack>
  );
}
