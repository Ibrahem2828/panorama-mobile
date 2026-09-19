import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Image, StyleSheet, View } from 'react-native';

import { images } from '../../../assets/images';
import { AppButton, AppCard, AppText, Stack } from '../../../components';
import { colors, radius, spacing } from '../../../theme';
import type { VerificationCardImage } from '../types';
import { useTranslation } from '../../../i18n';

type VerificationCardImagePickerProps = {
  selectedImage: VerificationCardImage | null;
  onChange: (image: VerificationCardImage | null) => void;
  disabled?: boolean;
};

const CARD_EXAMPLES = [
  {
    image: images.verification.cardExampleGood,
    labelKey: 'exampleClear' as const,
  },
  {
    image: images.verification.cardExampleBlurry,
    labelKey: 'exampleBlurry' as const,
  },
  {
    image: images.verification.cardExampleCropped,
    labelKey: 'exampleCropped' as const,
  },
  {
    image: images.verification.cardExampleDark,
    labelKey: 'exampleDark' as const,
  },
] as const;

function getImageName(asset: ImagePicker.ImagePickerAsset): string {
  return asset.fileName ?? `student-card-${Date.now()}.jpg`;
}

function getImageType(asset: ImagePicker.ImagePickerAsset): string {
  return asset.mimeType ?? 'image/jpeg';
}

export function VerificationCardImagePicker({
  selectedImage,
  onChange,
  disabled = false,
}: VerificationCardImagePickerProps) {
  const { t } = useTranslation();
  const [localError, setLocalError] = useState<string | null>(null);

  async function handlePickImage() {
    setLocalError(null);

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setLocalError(t.verificationFlow.imagePicker.permissionDenied);
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
      setLocalError(t.verificationFlow.imagePicker.invalidImage);
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

  return (
    <AppCard padding="lg" variant="default">
      <Stack gap="md">
        <Image
          accessibilityIgnoresInvertColors
          accessibilityLabel={t.verificationFlow.imagePicker.guideAlt}
          resizeMode="contain"
          source={images.verification.studentCardGuide}
          style={styles.guideImage}
        />

        <Stack gap="xs">
          <AppText variant="title">{t.verificationFlow.imagePicker.title}</AppText>
          <AppText color="secondary" variant="bodySmall">
            {t.verificationFlow.imagePicker.description}
          </AppText>
        </Stack>

        <Stack direction="horizontal" gap="sm" wrap>
          {CARD_EXAMPLES.map((example) => (
            <View key={example.labelKey} style={styles.exampleItem}>
              <Image
                accessibilityIgnoresInvertColors
                accessibilityLabel={t.verificationFlow.imagePicker.exampleAlt(
                  t.verificationFlow.imagePicker[example.labelKey],
                )}
                resizeMode="contain"
                source={example.image}
                style={styles.exampleImage}
              />
              <AppText align="center" color="secondary" variant="caption">
                {t.verificationFlow.imagePicker[example.labelKey]}
              </AppText>
            </View>
          ))}
        </Stack>

        <View style={styles.preview}>
          {selectedImage ? (
            <Image
              accessibilityIgnoresInvertColors
              resizeMode="cover"
              source={{ uri: selectedImage.uri }}
              style={styles.previewImage}
            />
          ) : (
            <AppText align="center" color="secondary" variant="bodySmall">
              {t.verificationFlow.imagePicker.noImage}
            </AppText>
          )}
        </View>

        {selectedImage ? (
          <AppText color="muted" variant="caption">
            {selectedImage.name} · {selectedImage.type}
          </AppText>
        ) : null}

        {localError ? (
          <AppText color="error" variant="bodySmall">
            {localError}
          </AppText>
        ) : null}

        <Stack direction="horizontal" gap="sm" wrap>
          <AppButton
            disabled={disabled}
            onPress={() => {
              void handlePickImage();
            }}
            title={
              selectedImage
                ? t.verificationFlow.imagePicker.replace
                : t.verificationFlow.imagePicker.pick
            }
            variant="outline"
          />
          {selectedImage ? (
            <AppButton
              disabled={disabled}
              onPress={() => onChange(null)}
              title={t.verificationFlow.imagePicker.remove}
              variant="ghost"
            />
          ) : null}
        </Stack>
      </Stack>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  guideImage: {
    alignSelf: 'center',
    width: 240,
    maxWidth: '86%',
    height: 160,
  },
  exampleItem: {
    width: 76,
    alignItems: 'center',
    gap: spacing.xs,
  },
  exampleImage: {
    width: 72,
    height: 52,
    borderRadius: 8,
  },
  preview: {
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radius.card,
    backgroundColor: colors.background.muted,
  },
  previewImage: {
    width: '100%',
    height: 220,
  },
});
