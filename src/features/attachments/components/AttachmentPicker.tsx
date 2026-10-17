import { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { AppButton, AppIconButton, AppText, Icon, Stack } from '../../../components';
import { useTranslation } from '../../../i18n';
import { colors, radius, spacing, useBrand } from '../../../theme';
import { formatFileSize } from '../../files/services';
import { pickImage } from '../services/imagePicker';
import type { LocalFile, UploadProblem } from '../services/localFile';

type AttachmentPickerProps = {
  file: LocalFile | null;
  onChange: (file: LocalFile | null) => void;
  disabled?: boolean;
  /** 0..100 while the attachment is being uploaded, null otherwise. */
  uploadPercent?: number | null;
  /** A server-side problem with the attachment (for example a rejected file). */
  error?: string | null;
};

const THUMB_SIZE = 44;

/** Attach one image: a button, then a chip with preview, name, size and a remove action. */
export function AttachmentPicker({
  file,
  onChange,
  disabled = false,
  uploadPercent = null,
  error,
}: AttachmentPickerProps) {
  const { t } = useTranslation();
  const brand = useBrand();
  const [problem, setProblem] = useState<UploadProblem | 'error' | null>(null);
  const [isPicking, setIsPicking] = useState(false);

  async function handlePick() {
    if (isPicking) {
      return;
    }

    setIsPicking(true);
    setProblem(null);

    const result = await pickImage();

    setIsPicking(false);

    if (result.status === 'picked') {
      onChange(result.file);
    } else if (result.status === 'invalid') {
      setProblem(result.problem);
    } else if (result.status === 'error') {
      setProblem('error');
    }
  }

  const problemText =
    error ??
    (problem === 'type'
      ? t.attachments.invalidType
      : problem === 'size'
        ? t.attachments.tooLarge
        : problem === 'empty'
          ? t.attachments.empty
          : problem === 'error'
            ? t.attachments.pickerFailed
            : null);

  return (
    <Stack gap="sm">
      {file ? (
        <View accessibilityLabel={t.attachments.selected} accessible style={styles.chip}>
          <Stack align="center" direction="horizontal" gap="md">
            <Image
              accessibilityIgnoresInvertColors
              resizeMode="cover"
              source={{ uri: file.uri }}
              style={styles.thumb}
            />
            <Stack gap="xs" style={styles.body}>
              <AppText numberOfLines={1} variant="bodySmall" weight="600">
                {file.name}
              </AppText>
              <AppText color="muted" variant="caption">
                {uploadPercent !== null
                  ? t.attachments.uploading(uploadPercent)
                  : formatFileSize(file.size, t.files)}
              </AppText>
            </Stack>
            <AppIconButton
              accessibilityLabel={t.attachments.remove}
              disabled={disabled || uploadPercent !== null}
              icon={<Icon name="close" size={18} />}
              onPress={() => onChange(null)}
              size="sm"
              variant="ghost"
            />
          </Stack>
          {uploadPercent !== null ? (
            <View
              accessibilityRole="progressbar"
              accessibilityValue={{ min: 0, max: 100, now: uploadPercent }}
              style={styles.track}
            >
              <View
                style={[
                  styles.fill,
                  { width: `${uploadPercent}%`, backgroundColor: brand.primary },
                ]}
              />
            </View>
          ) : null}
        </View>
      ) : (
        <>
          <AppButton
            disabled={disabled}
            leftIcon={<Icon color={brand.primary} name="paperclip" size={18} />}
            loading={isPicking}
            onPress={() => void handlePick()}
            size="sm"
            title={t.attachments.attach}
            variant="outline"
          />
          <AppText color="muted" variant="caption">
            {t.attachments.hint}
          </AppText>
        </>
      )}
      {problemText ? (
        <AppText color="error" variant="bodySmall">
          {problemText}
        </AppText>
      ) : null}
    </Stack>
  );
}

const styles = StyleSheet.create({
  chip: {
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radius.card,
    padding: spacing.sm,
    backgroundColor: colors.background.muted,
  },
  thumb: { width: THUMB_SIZE, height: THUMB_SIZE, borderRadius: radius.md },
  body: { flex: 1, minWidth: 0 },
  track: {
    height: 6,
    borderRadius: radius.full,
    backgroundColor: colors.gray[100],
    overflow: 'hidden',
  },
  fill: { height: 6, borderRadius: radius.full },
});
