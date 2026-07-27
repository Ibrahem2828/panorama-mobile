import { useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet } from 'react-native';

import { AppButton, AppScreen, AppText, AppTextInput, Stack } from '../../../components';
import { PublicRoutes } from '../../../navigation/routes';
import type { PublicStackParamList } from '../../../navigation/types';
import { spacing } from '../../../theme';
import { AuthFormCard, PasswordInput, PhoneInputWithCountryCode } from '../components';
import { registerNormalUser, toSafeRegistrationErrorMessage } from '../services';
import {
  isValidEmail,
  normalizePhoneNumber,
  validatePasswordPair,
  validatePhoneNumber,
} from '../utils/authFormValidation';

type Props = NativeStackScreenProps<PublicStackParamList, 'NormalUserRegister'>;

export function NormalUserRegisterScreen({ navigation }: Props) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
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
    if (passwordError) return setErrorMessage(passwordError);

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const response = await registerNormalUser({
        full_name: name,
        email: mail,
        phone_number: phone,
        password,
        password_confirm: passwordConfirm,
        otp_channel: 'email',
      });
      navigation.replace(PublicRoutes.OtpVerification, {
        identifier: response.user.email ?? mail,
        channel: response.otp_channel,
        source: 'normal_register',
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
            <AppText variant="h1">إنشاء حساب عام</AppText>
            <AppText color="secondary">سيتم التحقق عبر البريد الإلكتروني.</AppText>
          </Stack>
          <AuthFormCard
            subtitle="يمكن استخدام الخدمات العامة وفق صلاحيات النظام."
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
          <Pressable onPress={() => navigation.goBack()}>
            <AppText align="center" color="brand">
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
  keyboardAvoid: { flex: 1 },
});
