import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Image, StyleSheet, View } from 'react-native';

import { AppButton, AppCard, AppText, Stack } from '../../../components';
import { colors, radius } from '../../../theme';
import type { VerificationCardImage } from '../types';

type VerificationCardImagePickerProps = {
  selectedImage: VerificationCardImage | null;
  onChange: (image: VerificationCardImage | null) => void;
  disabled?: boolean;
};

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
  const [localError, setLocalError] = useState<string | null>(null);

  async function handlePickImage() {
    setLocalError(null);

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setLocalError('يرجى السماح للتطبيق بالوصول إلى الصور لاختيار بطاقة الطالب.');
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
      setLocalError('لم يتم اختيار صورة صالحة. حاول مرة أخرى.');
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
        <Stack gap="xs">
          <AppText variant="title">صورة بطاقة الطالب</AppText>
          <AppText color="secondary" variant="bodySmall">
            اختر صورة واضحة من المعرض. لا يتم تسجيل مسار الصورة في السجلات.
          </AppText>
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
              لم يتم اختيار صورة بعد.
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
            title={selectedImage ? 'استبدال الصورة' : 'اختيار صورة'}
            variant="outline"
          />
          {selectedImage ? (
            <AppButton
              disabled={disabled}
              onPress={() => onChange(null)}
              title="إزالة الصورة"
              variant="ghost"
            />
          ) : null}
        </Stack>
      </Stack>
    </AppCard>
  );
}

const styles = StyleSheet.create({
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
