import { useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { Image, KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native';

import { AppButton, AppScreen, AppText, AppTextInput, Stack } from '../../../components';
import { PublicRoutes } from '../../../navigation/routes';
import type { PublicStackParamList } from '../../../navigation/types';
import { spacing } from '../../../theme';
import { AuthFormCard } from '../components';
import { submitStudentAccountRequest, toSafeD1ErrorMessage } from '../services';

type Props = NativeStackScreenProps<PublicStackParamList, 'StudentAccountRequest'>;

export function StudentAccountRequestScreen({ navigation }: Props) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [university, setUniversity] = useState('');
  const [studentNumber, setStudentNumber] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [selectedCard, setSelectedCard] = useState<{
    uri: string;
    name: string;
    type: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function pickCard() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      const uri = asset.uri;
      const name = uri.split('/').pop() || 'card.jpg';
      const type = asset.mimeType || 'image/jpeg';
      setSelectedCard({ uri, name, type });
      setError(null);
    }
  }

  async function handleSubmit() {
    if (!fullName || !phone || !university || !studentNumber || !password) {
      setError('يرجى تعبئة الحقول الأساسية.');
      return;
    }
    if (!selectedCard) {
      setError('يرجى اختيار صورة البطاقة الجامعية.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await submitStudentAccountRequest(
        {
          full_name: fullName.trim(),
          phone_number: phone.trim(),
          university: university.trim(),
          student_number: studentNumber.trim(),
          password,
          password_confirm: passwordConfirm || password,
        },
        selectedCard,
      );
      navigation.replace(PublicRoutes.StudentRequestSubmitted, {
        requestId: (res as { data?: { request_id?: string | number } })?.data?.request_id,
      });
    } catch (e) {
      setError(toSafeD1ErrorMessage(e));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AppScreen contentContainerStyle={styles.content} scroll>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Stack gap="lg">
          <AuthFormCard title="طلب إنشاء حساب طالب" subtitle="سيتم مراجعة طلبك من الإدارة.">
            <Stack gap="md">
              <AppTextInput
                label="الاسم الكامل"
                value={fullName}
                onChangeText={setFullName}
                disabled={isSubmitting}
              />
              <AppTextInput
                label="رقم الجوال"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                disabled={isSubmitting}
              />
              <AppTextInput
                label="الجامعة"
                value={university}
                onChangeText={setUniversity}
                disabled={isSubmitting}
              />
              <AppTextInput
                label="الرقم الجامعي"
                value={studentNumber}
                onChangeText={setStudentNumber}
                disabled={isSubmitting}
              />
              <AppTextInput
                label="كلمة المرور"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                disabled={isSubmitting}
              />
              <AppTextInput
                label="تأكيد كلمة المرور"
                value={passwordConfirm}
                onChangeText={setPasswordConfirm}
                secureTextEntry
                disabled={isSubmitting}
              />

              <Stack gap="sm">
                <AppText variant="bodySmall" color="secondary">
                  صورة البطاقة الجامعية (مطلوبة)
                </AppText>
                <Pressable onPress={pickCard} style={styles.pickerButton}>
                  <AppText color="brand">
                    {selectedCard ? 'تغيير الصورة' : 'اختيار صورة البطاقة'}
                  </AppText>
                </Pressable>

                {selectedCard && (
                  <View style={styles.previewRow}>
                    <Image
                      source={{ uri: selectedCard.uri }}
                      style={styles.previewImage}
                      resizeMode="cover"
                    />
                    <Stack gap="xs" style={styles.previewInfo}>
                      <AppText variant="caption" numberOfLines={1}>
                        {selectedCard.name}
                      </AppText>
                      <Pressable onPress={() => setSelectedCard(null)}>
                        <AppText color="error" variant="caption">
                          إزالة
                        </AppText>
                      </Pressable>
                    </Stack>
                  </View>
                )}
              </Stack>

              {error ? <AppText color="error">{error}</AppText> : null}
              <AppButton
                fullWidth
                loading={isSubmitting}
                onPress={handleSubmit}
                title="إرسال الطلب"
                disabled={!selectedCard}
              />
            </Stack>
          </AuthFormCard>
        </Stack>
      </KeyboardAvoidingView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: { paddingVertical: spacing.lg },
  pickerButton: {
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    alignItems: 'center',
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: spacing.sm,
  },
  previewImage: {
    width: 56,
    height: 56,
    borderRadius: 6,
  },
  previewInfo: {
    flex: 1,
  },
});
