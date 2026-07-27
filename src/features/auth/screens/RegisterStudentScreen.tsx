import { useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet } from 'react-native';

import { AppButton, AppScreen, AppText, AppTextInput, Stack } from '../../../components';
import { PublicRoutes } from '../../../navigation/routes';
import type { PublicStackParamList } from '../../../navigation/types';
import { spacing } from '../../../theme';
import { AuthFormCard, PasswordInput, PhoneInputWithCountryCode } from '../components';
import { registerStudentAccount, toSafeRegistrationErrorMessage } from '../services';
import {
  isValidEmail,
  normalizePhoneNumber,
  validatePasswordPair,
  validatePhoneNumber,
} from '../utils/authFormValidation';

type Props = NativeStackScreenProps<PublicStackParamList, 'RegisterStudent'>;

export function RegisterStudentScreen({ navigation }: Props) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [studentNumber, setStudentNumber] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    const name = fullName.trim();
    const mail = email.trim().toLowerCase();
    const phone = normalizePhoneNumber(phoneNumber);
    const passwordError = validatePasswordPair(password, passwordConfirm);
    if (!name) return setErrorMessage('يرجى إدخال الاسم الكامل.');
    if (!isValidEmail(mail)) return setErrorMessage('يرجى إدخال بريد إلكتروني صالح.');
    const phoneError = validatePhoneNumber(phone);
    if (phoneError) return setErrorMessage(phoneError);
    if (!studentNumber.trim()) return setErrorMessage('يرجى إدخال الرقم الجامعي.');
    if (passwordError) return setErrorMessage(passwordError);

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const response = await registerStudentAccount({
        full_name: name,
        email: mail,
        phone_number: phone,
        student_number: studentNumber.trim(),
        password,
        password_confirm: passwordConfirm,
        otp_channel: 'email',
      });
      navigation.replace(PublicRoutes.OtpVerification, {
        identifier: response.user.email ?? mail,
        channel: response.otp_channel,
        source: 'student_register',
      });
    } catch (error) {
      setErrorMessage(toSafeRegistrationErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AppScreen contentContainerStyle={styles.content} scroll>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoid}
      >
        <Stack gap="lg">
          <Stack gap="xs">
            <AppText variant="h1">إنشاء حساب طالب</AppText>
            <AppText color="secondary" variant="body">
              سيصل رمز التحقق إلى البريد الإلكتروني.
            </AppText>
          </Stack>
          <AuthFormCard
            subtitle="بعد التحقق ستكمل بياناتك الأكاديمية وترفع البطاقة الجامعية."
            title="بيانات الحساب"
          >
            <Stack gap="md">
              <AppTextInput
                disabled={isSubmitting}
                label="الاسم الكامل"
                onChangeText={setFullName}
                value={fullName}
              />
              <AppTextInput
                autoCapitalize="none"
                disabled={isSubmitting}
                keyboardType="email-address"
                label="البريد الإلكتروني"
                onChangeText={setEmail}
                value={email}
              />
              <PhoneInputWithCountryCode
                disabled={isSubmitting}
                label="رقم الهاتف"
                onChangeText={setPhoneNumber}
                value={phoneNumber}
              />
              <AppTextInput
                disabled={isSubmitting}
                keyboardType="number-pad"
                label="الرقم الجامعي"
                onChangeText={setStudentNumber}
                value={studentNumber}
              />
              <PasswordInput disabled={isSubmitting} onChangeText={setPassword} value={password} />
              <AppTextInput
                disabled={isSubmitting}
                label="تأكيد كلمة المرور"
                onChangeText={setPasswordConfirm}
                secureTextEntry
                value={passwordConfirm}
              />
              {errorMessage ? (
                <AppText color="error" variant="bodySmall">
                  {errorMessage}
                </AppText>
              ) : null}
              <AppButton
                disabled={isSubmitting}
                fullWidth
                loading={isSubmitting}
                onPress={() => void handleSubmit()}
                title="إنشاء الحساب"
              />
            </Stack>
          </AuthFormCard>
          <Pressable onPress={() => navigation.navigate(PublicRoutes.Login)}>
            <AppText align="center" color="brand">
              لديك حساب؟ تسجيل الدخول
            </AppText>
          </Pressable>
        </Stack>
      </KeyboardAvoidingView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: { justifyContent: 'center', gap: spacing.xl },
  keyboardAvoid: { flex: 1 },
});
