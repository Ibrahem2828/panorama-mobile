import { useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';

import { AppButton, AppScreen, AppText, AppTextInput, Stack } from '../../../components';
import { PublicRoutes } from '../../../navigation/routes';
import type { PublicStackParamList } from '../../../navigation/types';
import { spacing } from '../../../theme';
import { AuthFormCard, PasswordInput } from '../components';
import { registerNormalUser, toSafeD1ErrorMessage } from '../services';
import {
  isValidEmail,
  isValidPhoneNumber,
  normalizePhoneNumber,
  validatePasswordPair,
} from '../utils/authFormValidation';

type Props = NativeStackScreenProps<PublicStackParamList, 'NormalUserRegister'>;

const REQUIRED = 'يرجى تعبئة جميع الحقول المطلوبة.';
const PASSWORD_MISMATCH = 'كلمتا المرور غير متطابقتين.';

export function NormalUserRegisterScreen({ navigation }: Props) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const displayedError = validationMessage ?? errorMessage;

  function clearErrors() {
    setValidationMessage(null);
    setErrorMessage(null);
  }

  async function handleSubmit() {
    const name = fullName.trim();
    const em = email.trim();
    const phone = normalizePhoneNumber(phoneNumber);
    const passErr = validatePasswordPair(password, passwordConfirm);

    if (!name || !em || !phone || !password || !passwordConfirm) {
      setValidationMessage(REQUIRED);
      return;
    }
    if (!isValidEmail(em)) {
      setValidationMessage('يرجى إدخال بريد إلكتروني صحيح.');
      return;
    }
    if (!isValidPhoneNumber(phone)) {
      setValidationMessage('يرجى إدخال رقم جوال صحيح.');
      return;
    }
    if (passErr) {
      setValidationMessage(PASSWORD_MISMATCH);
      return;
    }

    setIsSubmitting(true);
    clearErrors();

    try {
      await registerNormalUser({
        full_name: name,
        email: em,
        phone_number: phone,
        password,
        password_confirm: passwordConfirm,
      });

      // Navigate to phone OTP
      navigation.replace(PublicRoutes.PhoneOtpVerification, {
        phoneNumber: phone,
        otpPurpose: 'verify_phone',
        source: 'normal_register',
      });
    } catch (err) {
      setErrorMessage(toSafeD1ErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AppScreen contentContainerStyle={styles.content} scroll>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboard}
      >
        <Stack gap="lg">
          <AuthFormCard
            title="إنشاء حساب مستخدم عادي"
            subtitle="سيتم التحقق من رقم الجوال برمز OTP."
          >
            <Stack gap="md">
              <AppTextInput
                label="الاسم الكامل"
                value={fullName}
                onChangeText={(v) => {
                  setFullName(v);
                  clearErrors();
                }}
                autoCapitalize="words"
                disabled={isSubmitting}
              />
              <AppTextInput
                label="البريد الإلكتروني"
                value={email}
                onChangeText={(v) => {
                  setEmail(v);
                  clearErrors();
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                disabled={isSubmitting}
              />
              <AppTextInput
                label="رقم الجوال"
                value={phoneNumber}
                onChangeText={(v) => {
                  setPhoneNumber(v);
                  clearErrors();
                }}
                keyboardType="phone-pad"
                disabled={isSubmitting}
              />
              <PasswordInput
                value={password}
                onChangeText={(v) => {
                  setPassword(v);
                  clearErrors();
                }}
                disabled={isSubmitting}
              />
              <AppTextInput
                label="تأكيد كلمة المرور"
                value={passwordConfirm}
                onChangeText={(v) => {
                  setPasswordConfirm(v);
                  clearErrors();
                }}
                secureTextEntry
                disabled={isSubmitting}
              />

              {displayedError ? (
                <AppText color="error" variant="bodySmall">
                  {displayedError}
                </AppText>
              ) : null}

              <AppButton
                fullWidth
                loading={isSubmitting}
                disabled={isSubmitting}
                onPress={handleSubmit}
                title="إنشاء الحساب"
              />
            </Stack>
          </AuthFormCard>

          <AppText
            align="center"
            color="muted"
            variant="caption"
            onPress={() => navigation.goBack()}
          >
            العودة
          </AppText>
        </Stack>
      </KeyboardAvoidingView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: { paddingVertical: spacing.lg },
  keyboard: { flex: 1 },
});
