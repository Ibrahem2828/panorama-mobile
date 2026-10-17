import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { AppButton, AppText, Icon, Stack } from '../../../components';
import { colors, radius, spacing, useBrand } from '../../../theme';
import type { VerificationCardImage } from '../types';
import { useTranslation } from '../../../i18n';

type VerificationCardImagePickerProps = {
  selectedImage: VerificationCardImage | null;
  onChange: (image: VerificationCardImage | null) => void;
  disabled?: boolean;
  /** True while the chosen image is being sent. */
  isUploading?: boolean;
  /** 0..1 upload progress. */
  progress?: number;
};

function getImageName(asset: ImagePicker.ImagePickerAsset): string {
  return asset.fileName ?? `student-card-${Date.now()}.jpg`;
}

function getImageType(asset: ImagePicker.ImagePickerAsset): string {
  return asset.mimeType ?? 'image/jpeg';
}

function GuidanceRow({ good, text }: { good: boolean; text: string }) {
  return (
    <View style={styles.tipRow}>
      <Icon
        color={good ? colors.semantic.success : colors.semantic.error}
        name={good ? 'checkCircle' : 'xCircle'}
        size={20}
      />
      <AppText color="secondary" style={styles.tipText} variant="bodySmall">
        {text}
      </AppText>
    </View>
  );
}

export function VerificationCardImagePicker({
  selectedImage,
  onChange,
  disabled = false,
  isUploading = false,
  progress = 0,
}: VerificationCardImagePickerProps) {
  const { t } = useTranslation();
  const brand = useBrand();
  const [localError, setLocalError] = useState<string | null>(null);
  const copy = t.verificationFlow.imagePicker;

  async function handlePickImage() {
    setLocalError(null);

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setLocalError(copy.permissionDenied);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [3, 2],
      quality: 0.9,
      allowsMultipleSelection: false,
    });

    if (result.canceled) {
      return;
    }

    const asset = result.assets[0];

    if (!asset) {
      setLocalError(copy.invalidImage);
      return;
    }

    onChange({
      uri: asset.uri,
      name: getImageName(asset),
      type: getImageType(asset),
      width: asset.width,
      height: asset.height,
      size: asset.fileSize,
    });
  }

  const percent = Math.round(Math.min(Math.max(progress, 0), 1) * 100);

  return (
    <Stack gap="lg">
      {selectedImage ? (
        <View style={styles.previewWrap}>
          <Image
            accessibilityIgnoresInvertColors
            accessibilityLabel={copy.previewAlt}
            resizeMode="cover"
            source={{ uri: selectedImage.uri }}
            style={styles.previewImage}
          />
          {isUploading ? (
            <View style={styles.uploadOverlay}>
              <AppText color="inverse" style={styles.overlayText} variant="subtitle" weight="600">
                {copy.uploading(percent)}
              </AppText>
              <View style={styles.track}>
                <View
                  style={[styles.fill, { width: `${percent}%`, backgroundColor: brand.onPrimary }]}
                />
              </View>
            </View>
          ) : null}
        </View>
      ) : (
        <Pressable
          accessibilityLabel={copy.pick}
          accessibilityRole="button"
          disabled={disabled}
          onPress={() => void handlePickImage()}
          style={({ pressed }) => [
            styles.dropZone,
            { borderColor: brand.primary, backgroundColor: brand.primarySoft },
            pressed ? styles.pressed : null,
          ]}
        >
          <View style={[styles.dropIcon, { backgroundColor: brand.primary }]}>
            <Icon color={brand.onPrimary} name="upload" size={28} />
          </View>
          <AppText color="brand" variant="subtitle" weight="600">
            {copy.pick}
          </AppText>
          <AppText align="center" color="secondary" variant="caption">
            {copy.pickHint}
          </AppText>
        </Pressable>
      )}

      {localError ? (
        <AppText color="error" variant="bodySmall">
          {localError}
        </AppText>
      ) : null}

      {selectedImage ? (
        <Stack direction="horizontal" gap="sm">
          <AppButton
            disabled={disabled}
            leftIcon={<Icon color={brand.primary} name="refresh" size={18} />}
            onPress={() => void handlePickImage()}
            size="sm"
            title={copy.replace}
            variant="outline"
          />
          <AppButton
            disabled={disabled}
            leftIcon={<Icon color={brand.primary} name="trash" size={18} />}
            onPress={() => onChange(null)}
            size="sm"
            title={copy.remove}
            variant="ghost"
          />
        </Stack>
      ) : null}

      <View style={styles.tips}>
        <AppText variant="subtitle" weight="600">
          {copy.tipsTitle}
        </AppText>
        <GuidanceRow good text={copy.goodWhole} />
        <GuidanceRow good text={copy.goodReadable} />
        <GuidanceRow good text={copy.goodLight} />
        <GuidanceRow good={false} text={copy.badCropped} />
        <GuidanceRow good={false} text={copy.badBlurry} />
        <GuidanceRow good={false} text={copy.badGlare} />
      </View>
    </Stack>
  );
}

const styles = StyleSheet.create({
  previewWrap: {
    aspectRatio: 3 / 2,
    overflow: 'hidden',
    borderRadius: radius.xl,
    backgroundColor: colors.background.muted,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  uploadOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    start: 0,
    end: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xl,
    backgroundColor: 'rgba(16, 24, 40, 0.62)',
  },
  overlayText: { color: '#FFFFFF' },
  track: {
    width: '80%',
    height: 8,
    overflow: 'hidden',
    borderRadius: radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  fill: {
    height: '100%',
    borderRadius: radius.full,
  },
  dropZone: {
    aspectRatio: 3 / 2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: radius.xl,
  },
  dropIcon: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
  },
  pressed: {
    opacity: 0.85,
  },
  tips: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.background.muted,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  tipText: {
    flex: 1,
  },
});
