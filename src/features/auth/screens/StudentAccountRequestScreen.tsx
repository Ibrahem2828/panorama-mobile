import { useRef, useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import {
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import {
  AppButton,
  AppCard,
  AppScreen,
  AppText,
  AppTextInput,
  Divider,
  SectionHeader,
  Stack,
} from '../../../components';
import { PublicRoutes } from '../../../navigation/routes';
import type { PublicStackParamList } from '../../../navigation/types';
import { colors, radius, spacing } from '../../../theme';
import { createEntranceAnim, MOTION } from '../../../utils/motion';
import { AuthFormCard, PhoneInputWithCountryCode } from '../components';
import { submitStudentAccountRequest, toSafeD1ErrorMessage } from '../services';
import { validatePhoneNumber } from '../utils/authFormValidation';

type Props = NativeStackScreenProps<PublicStackParamList, 'StudentAccountRequest'>;

type FormErrors = {
  fullName?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  university?: string;
  faculty?: string;
  major?: string;
  studentNumber?: string;
  password?: string;
  passwordConfirm?: string;
  card?: string;
};

type CardAsset = {
  uri: string;
  name: string;
  type: string;
  fileSize?: number;
};

const PERMISSION_DENIED = 'لم نتمكن من الوصول إلى الصور. يمكنك السماح من إعدادات الجهاز.';
const INVALID_ASSET = 'تعذر استخدام هذا الملف. اختر صورة أخرى.';

export function StudentAccountRequestScreen({ navigation }: Props) {
  const cardAnim = useRef(createEntranceAnim(12)).current;
  cardAnim.animate(MOTION.duration.slow).start();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [university, setUniversity] = useState('');
  const [faculty, setFaculty] = useState('');
  const [major, setMajor] = useState('');
  const [studentNumber, setStudentNumber] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [selectedCard, setSelectedCard] = useState<CardAsset | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function clearErrors() {
    setError(null);
    setFieldErrors({});
  }

  function validate(): FormErrors {
    const errors: FormErrors = {};
    if (!fullName.trim()) errors.fullName = 'يرجى إدخال الاسم الكامل.';
    const phoneErr = validatePhoneNumber(phone);
    if (phoneErr) errors.phone = phoneErr;
    if (!university.trim()) errors.university = 'يرجى إدخال اسم الجامعة.';
    if (!studentNumber.trim()) errors.studentNumber = 'يرجى إدخال الرقم الجامعي.';
    if (!password) errors.password = 'يرجى إدخال كلمة المرور.';
    if (!passwordConfirm) errors.passwordConfirm = 'يرجى تأكيد كلمة المرور.';
    if (password && passwordConfirm && password !== passwordConfirm) {
      errors.passwordConfirm = 'كلمتا المرور غير متطابقتين.';
    }
    if (!selectedCard) errors.card = 'يرجى إرفاق صورة البطاقة الجامعية.';
    return errors;
  }

  function hasErrors(errors: FormErrors): boolean {
    return Object.keys(errors).length > 0;
  }

  async function pickCard() {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setError(PERMISSION_DENIED);
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });
      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset || !asset.uri) {
        setError(INVALID_ASSET);
        return;
      }
      const uri = asset.uri;
      const name = asset.fileName || uri.split('/').pop() || 'card.jpg';
      const type = asset.mimeType || 'image/jpeg';
      setSelectedCard({ uri, name, type, fileSize: asset.fileSize });
      if (fieldErrors.card) {
        setFieldErrors((prev) => ({ ...prev, card: undefined }));
      }
      setError(null);
    } catch {
      setError('تعذر اختيار الصورة. حاول مرة أخرى.');
    }
  }

  async function handleSubmit() {
    if (isSubmitting) return;
    clearErrors();
    const errors = validate();
    if (hasErrors(errors)) {
      setFieldErrors(errors);
      return;
    }
    setIsSubmitting(true);
    try {
      await submitStudentAccountRequest(
        {
          full_name: fullName.trim(),
          email: email.trim() || undefined,
          phone_number: phone.trim(),
          whatsapp_phone: whatsapp.trim() || undefined,
          university: university.trim(),
          faculty: faculty.trim() || undefined,
          major: major.trim() || undefined,
          student_number: studentNumber.trim(),
          password,
          password_confirm: passwordConfirm,
        },
        selectedCard!,
      );
      navigation.replace(PublicRoutes.StudentRequestSubmitted, {
        requestId: 'pending',
      });
    } catch (e) {
      setError(toSafeD1ErrorMessage(e));
    } finally {
      setIsSubmitting(false);
    }
  }

  function formatFileSize(bytes?: number): string {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <AppScreen contentContainerStyle={styles.content} scroll safeArea>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Stack gap="xl">
          <Animated.View
            style={{
              opacity: cardAnim.opacity,
              transform: [{ translateY: cardAnim.translateY }],
            }}
          >
            <AuthFormCard
              title="طلب إنشاء حساب طالب"
              subtitle="قدّم طلبك وسيتم مراجعته من قبل الإدارة."
            >
              <Stack gap="lg">
                {/* Section 1: بيانات الطالب */}
                <Stack gap="sm">
                  <SectionHeader title="بيانات الطالب" />
                  <Stack gap="md">
                    <AppTextInput
                      label="الاسم الكامل"
                      value={fullName}
                      onChangeText={(v) => {
                        setFullName(v);
                        setFieldErrors((prev) => ({ ...prev, fullName: undefined }));
                      }}
                      autoCapitalize="words"
                      disabled={isSubmitting}
                      error={fieldErrors.fullName}
                    />
                    <AppTextInput
                      label="البريد الإلكتروني"
                      value={email}
                      onChangeText={(v) => {
                        setEmail(v);
                        setFieldErrors((prev) => ({ ...prev, email: undefined }));
                      }}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      disabled={isSubmitting}
                      helperText="اختياري"
                    />
                    <PhoneInputWithCountryCode
                      label="رقم الجوال"
                      value={phone}
                      onChangeText={(v) => {
                        setPhone(v);
                        setFieldErrors((prev) => ({ ...prev, phone: undefined }));
                      }}
                      disabled={isSubmitting}
                      error={fieldErrors.phone}
                      placeholder="أدخل رقم الجوال"
                    />
                    <PhoneInputWithCountryCode
                      label="رقم واتساب (اختياري)"
                      value={whatsapp}
                      onChangeText={(v) => {
                        setWhatsapp(v);
                        setFieldErrors((prev) => ({ ...prev, whatsapp: undefined }));
                      }}
                      disabled={isSubmitting}
                      helperText="لإرسال رمز التفعيل بعد الموافقة"
                      placeholder="أدخل رقم واتساب"
                    />
                  </Stack>
                </Stack>

                <Divider />

                {/* Section 2: بيانات الجامعة */}
                <Stack gap="sm">
                  <SectionHeader title="بيانات الجامعة" />
                  <Stack gap="md">
                    <AppTextInput
                      label="الجامعة"
                      value={university}
                      onChangeText={(v) => {
                        setUniversity(v);
                        setFieldErrors((prev) => ({ ...prev, university: undefined }));
                      }}
                      disabled={isSubmitting}
                      error={fieldErrors.university}
                    />
                    <AppTextInput
                      label="الكلية (اختياري)"
                      value={faculty}
                      onChangeText={setFaculty}
                      disabled={isSubmitting}
                    />
                    <AppTextInput
                      label="التخصص (اختياري)"
                      value={major}
                      onChangeText={setMajor}
                      disabled={isSubmitting}
                    />
                    <AppTextInput
                      label="الرقم الجامعي"
                      value={studentNumber}
                      onChangeText={(v) => {
                        setStudentNumber(v);
                        setFieldErrors((prev) => ({ ...prev, studentNumber: undefined }));
                      }}
                      keyboardType="default"
                      disabled={isSubmitting}
                      error={fieldErrors.studentNumber}
                    />
                  </Stack>
                </Stack>

                <Divider />

                {/* Section 3: إثبات الطالب */}
                <Stack gap="sm">
                  <SectionHeader
                    title="إثبات الطالب"
                    subtitle="يجب أن يظهر الاسم والرقم الجامعي بوضوح."
                  />
                  <AppCard padding="md" variant="outlined">
                    <Stack gap="md">
                      <AppText variant="bodySmall" color="secondary">
                        أرفق صورة البطاقة الجامعية
                      </AppText>

                      {!selectedCard ? (
                        <AppButton
                          fullWidth
                          onPress={pickCard}
                          title="اختيار صورة"
                          variant="outline"
                          disabled={isSubmitting}
                        />
                      ) : (
                        <Stack gap="md">
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
                              {selectedCard.fileSize ? (
                                <AppText variant="caption" color="muted">
                                  {formatFileSize(selectedCard.fileSize)}
                                </AppText>
                              ) : null}
                            </Stack>
                          </View>
                          <Stack direction="horizontal" gap="sm">
                            <AppButton
                              onPress={pickCard}
                              title="استبدال الصورة"
                              variant="outline"
                              size="sm"
                              disabled={isSubmitting}
                            />
                            <Pressable
                              onPress={() => {
                                setSelectedCard(null);
                                setFieldErrors((prev) => ({ ...prev, card: undefined }));
                              }}
                              style={styles.removeButton}
                              disabled={isSubmitting}
                            >
                              <AppText color="error" variant="button">
                                إزالة
                              </AppText>
                            </Pressable>
                          </Stack>
                        </Stack>
                      )}

                      {fieldErrors.card ? (
                        <AppText color="error" variant="caption">
                          {fieldErrors.card}
                        </AppText>
                      ) : null}
                    </Stack>
                  </AppCard>
                </Stack>

                <Divider />

                {/* Section 4: كلمة المرور */}
                <Stack gap="sm">
                  <SectionHeader title="كلمة المرور" />
                  <Stack gap="md">
                    <AppTextInput
                      label="كلمة المرور"
                      value={password}
                      onChangeText={(v) => {
                        setPassword(v);
                        setFieldErrors((prev) => ({ ...prev, password: undefined }));
                      }}
                      secureTextEntry
                      disabled={isSubmitting}
                      error={fieldErrors.password}
                    />
                    <AppTextInput
                      label="تأكيد كلمة المرور"
                      value={passwordConfirm}
                      onChangeText={(v) => {
                        setPasswordConfirm(v);
                        setFieldErrors((prev) => ({ ...prev, passwordConfirm: undefined }));
                      }}
                      secureTextEntry
                      disabled={isSubmitting}
                      error={fieldErrors.passwordConfirm}
                    />
                  </Stack>
                </Stack>

                {error ? (
                  <AppText color="error" variant="bodySmall">
                    {error}
                  </AppText>
                ) : null}

                <AppButton
                  fullWidth
                  loading={isSubmitting}
                  disabled={isSubmitting}
                  onPress={handleSubmit}
                  title={isSubmitting ? 'جاري إرسال الطلب...' : 'إرسال الطلب'}
                />
              </Stack>
            </AuthFormCard>
          </Animated.View>

          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.backLink}
            disabled={isSubmitting}
          >
            <AppText color="brand" variant="button">
              العودة
            </AppText>
          </Pressable>
        </Stack>
      </KeyboardAvoidingView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: { paddingVertical: spacing.lg },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.background.muted,
    borderRadius: radius.sm,
    padding: spacing.sm,
  },
  previewImage: {
    width: 64,
    height: 64,
    borderRadius: radius.sm,
  },
  previewInfo: {
    flex: 1,
  },
  removeButton: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  backLink: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
});
