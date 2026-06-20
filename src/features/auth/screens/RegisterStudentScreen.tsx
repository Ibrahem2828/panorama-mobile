import { useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet } from 'react-native';

import { AppButton, AppScreen, AppText, AppTextInput, Stack } from '../../../components';
import { PublicRoutes } from '../../../navigation/routes';
import type { PublicStackParamList } from '../../../navigation/types';
import { spacing } from '../../../theme';
import { AuthFormCard, PasswordInput, UnavailableAuthFlowScreen } from '../components';
import { registerStudentAccount, toSafeRegistrationErrorMessage } from '../services';
import {
  isValidEmail,
  isValidPhoneNumber,
  normalizePhoneNumber,
  validatePasswordPair,
} from '../utils/authFormValidation';
import { isSelfServiceAuthEnabled } from '../utils/selfServiceAuthAccess';

type RegisterStudentScreenProps = NativeStackScreenProps<PublicStackParamList, 'RegisterStudent'>;

export function RegisterStudentScreen({ navigation }: RegisterStudentScreenProps) {
  if (!isSelfServiceAuthEnabled()) {
    return (
      <UnavailableAuthFlowScreen
        message="إنشاء حساب الطالب غير متاح حاليا من التطبيق. تواصل مع إدارة الجامعة للحصول على حساب أو لاستكمال التسجيل."
        title="إنشاء حساب طالب"
      />
    );
  }

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [studentNumber, setStudentNumber] = useState('');
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
    const normalizedName = fullName.trim();
    const normalizedEmail = email.trim();
    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    const normalizedStudentNumber = studentNumber.trim();
    const passwordError = validatePasswordPair(password, passwordConfirm);

    if (!normalizedName) {
      setValidationMessage('يرجى إدخال الاسم الكامل.');
      return;
    }

    if (!isValidEmail(normalizedEmail)) {
      setValidationMessage('يرجى إدخال بريد إلكتروني صالح.');
      return;
    }

    if (!isValidPhoneNumber(normalizedPhone)) {
      setValidationMessage('يرجى إدخال رقم هاتف صالح.');
      return;
    }

    if (!normalizedStudentNumber) {
      setValidationMessage('يرجى إدخال الرقم الجامعي.');
      return;
    }

    if (passwordError) {
      setValidationMessage(passwordError);
      return;
    }

    setIsSubmitting(true);
    clearErrors();

    try {
      await registerStudentAccount({
        full_name: normalizedName,
        email: normalizedEmail,
        phone_number: normalizedPhone,
        student_number: normalizedStudentNumber,
        password,
        password_confirm: passwordConfirm,
      });

      navigation.navigate(PublicRoutes.OtpVerification, {
        phoneNumber: normalizedPhone,
        flow: 'register',
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
              أدخل بياناتك الأساسية لبدء استخدام بانوراما.
            </AppText>
          </Stack>

          <AuthFormCard subtitle="جميع الحقول مطلوبة لإنشاء حساب طالب جديد." title="بيانات الحساب">
            <Stack gap="md">
              <AppTextInput
                autoCapitalize="words"
                disabled={isSubmitting}
                label="الاسم الكامل"
                onChangeText={(value) => {
                  setFullName(value);
                  clearErrors();
                }}
                placeholder="الاسم كما في السجلات الجامعية"
                value={fullName}
              />
              <AppTextInput
                autoCapitalize="none"
                autoCorrect={false}
                disabled={isSubmitting}
                keyboardType="email-address"
                label="البريد الإلكتروني"
                onChangeText={(value) => {
                  setEmail(value);
                  clearErrors();
                }}
                placeholder="student@university.edu"
                textContentType="emailAddress"
                value={email}
              />
              <AppTextInput
                autoCapitalize="none"
                disabled={isSubmitting}
                keyboardType="phone-pad"
                label="رقم الهاتف"
                onChangeText={(value) => {
                  setPhoneNumber(value);
                  clearErrors();
                }}
                placeholder="+963900000000"
                textContentType="telephoneNumber"
                value={phoneNumber}
              />
              <AppTextInput
                autoCapitalize="none"
                disabled={isSubmitting}
                label="الرقم الجامعي"
                onChangeText={(value) => {
                  setStudentNumber(value);
                  clearErrors();
                }}
                placeholder="2150094"
                value={studentNumber}
              />
              <PasswordInput
                disabled={isSubmitting}
                error={displayedError ?? undefined}
                onChangeText={(value) => {
                  setPassword(value);
                  clearErrors();
                }}
                value={password}
              />
              <AppTextInput
                autoCapitalize="none"
                disabled={isSubmitting}
                label="تأكيد كلمة المرور"
                onChangeText={(value) => {
                  setPasswordConfirm(value);
                  clearErrors();
                }}
                placeholder="أعد إدخال كلمة المرور"
                secureTextEntry
                textContentType="password"
                value={passwordConfirm}
              />
              <AppButton
                disabled={isSubmitting}
                fullWidth
                loading={isSubmitting}
                onPress={() => {
                  void handleSubmit();
                }}
                title="إنشاء الحساب"
              />
            </Stack>
          </AuthFormCard>

          <Pressable
            accessibilityRole="button"
            disabled={isSubmitting}
            onPress={() => navigation.navigate(PublicRoutes.Login)}
          >
            <AppText align="center" color="brand" variant="body">
              لديك حساب؟ العودة لتسجيل الدخول
            </AppText>
          </Pressable>
        </Stack>
      </KeyboardAvoidingView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    justifyContent: 'center',
    gap: spacing.xl,
  },
  keyboardAvoid: {
    flex: 1,
  },
});
