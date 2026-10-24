import { useState } from 'react';
import { Image, Linking, StyleSheet, View } from 'react-native';

import { AppButton, AppIconButton, AppText, Icon, Stack } from '../../../components';
import { useTranslation } from '../../../i18n';
import { colors, radius, spacing, useBrand } from '../../../theme';
import { formatFileSize } from '../../files/services';
import {
  DOCUMENT_POLICY,
  policyLimitMegabytes,
  type AttachmentPolicy,
  type AttachmentSource,
} from '../services/attachmentPolicy';
import { fileExtension, type LocalFile, type UploadProblem } from '../services/localFile';
import { pickFromSource } from '../services/pickSource';
import { AttachmentSourceSheet } from './AttachmentSourceSheet';

type AttachmentPickerProps = {
  file: LocalFile | null;
  onChange: (file: LocalFile | null) => void;
  /** What this upload spot accepts (defaults to the backend document policy). */
  policy?: AttachmentPolicy;
  disabled?: boolean;
  /** 0..100 while the attachment is being uploaded, null otherwise. */
  uploadPercent?: number | null;
  /** A server-side problem with the attachment (for example a rejected file). */
  error?: string | null;
  /** Shown next to a server-side problem so the user can send the same file again. */
  onRetry?: () => void;
};

const THUMB_SIZE = 44;
const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp'];

type Problem = UploadProblem | 'error' | 'camera' | null;

/**
 * The unified upload picker: one button opens a sheet with the photo album, the camera and the device's files (only those
 * the spot allows), then the chosen file shows as a chip with preview, size, progress, retry and remove.
 */
export function AttachmentPicker({
  file,
  onChange,
  policy = DOCUMENT_POLICY,
  disabled = false,
  uploadPercent = null,
  error,
  onRetry,
}: AttachmentPickerProps) {
  const { t } = useTranslation();
  const brand = useBrand();
  const [problem, setProblem] = useState<Problem>(null);
  const [canOpenSettings, setCanOpenSettings] = useState(false);
  const [isPicking, setIsPicking] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  async function handleSource(source: AttachmentSource) {
    if (isPicking) {
      return;
    }

    setIsPicking(true);
    setProblem(null);
    setCanOpenSettings(false);

    const result = await pickFromSource(source, policy);

    setIsPicking(false);

    if (result.status === 'picked') {
      onChange(result.files[0] ?? null);
    } else if (result.status === 'invalid') {
      setProblem(result.problem);
    } else if (result.status === 'permission_denied') {
      setProblem('camera');
      setCanOpenSettings(result.canOpenSettings);
    } else if (result.status === 'error') {
      setProblem('error');
    }
  }

  const limit = policyLimitMegabytes(policy);
  const problemText =
    error ??
    (problem === 'type'
      ? t.attachments.invalidType
      : problem === 'size'
        ? t.attachments.tooLarge(limit)
        : problem === 'empty'
          ? t.attachments.empty
          : problem === 'camera'
            ? t.attachments.cameraDenied
            : problem === 'error'
              ? t.attachments.pickerFailed
              : null);
  const isImage = file ? IMAGE_EXTENSIONS.includes(fileExtension(file.name)) : false;

  return (
    <Stack gap="sm">
      {file ? (
        <View accessibilityLabel={t.attachments.selected} accessible style={styles.chip}>
          <Stack align="center" direction="horizontal" gap="md">
            {isImage ? (
              <Image
                accessibilityIgnoresInvertColors
                resizeMode="cover"
                source={{ uri: file.uri }}
                style={styles.thumb}
              />
            ) : (
              <View style={[styles.thumb, styles.documentThumb]}>
                <Icon color={brand.primary} name="file" size={22} />
              </View>
            )}
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
            onPress={() => setSheetOpen(true)}
            size="sm"
            title={t.attachments.attach}
            variant="outline"
          />
          <AppText color="muted" variant="caption">
            {t.attachments.hint(limit)}
          </AppText>
        </>
      )}
      {problemText ? (
        <Stack align="center" direction="horizontal" gap="sm" wrap>
          <AppText color="error" style={styles.body} variant="bodySmall">
            {problemText}
          </AppText>
          {problem === 'camera' && canOpenSettings ? (
            <AppButton
              onPress={() => void Linking.openSettings()}
              size="sm"
              title={t.attachments.openSettings}
              variant="outline"
            />
          ) : null}
          {error && onRetry ? (
            <AppButton onPress={onRetry} size="sm" title={t.attachments.retry} variant="outline" />
          ) : null}
        </Stack>
      ) : null}
      <AttachmentSourceSheet
        onClose={() => setSheetOpen(false)}
        onSelect={(source) => void handleSource(source)}
        sources={policy.sources}
        visible={sheetOpen}
      />
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
  documentThumb: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.surface,
  },
  body: { flex: 1, minWidth: 0 },
  track: {
    height: 6,
    borderRadius: radius.full,
    backgroundColor: colors.gray[100],
    overflow: 'hidden',
  },
  fill: { height: 6, borderRadius: radius.full },
});
