import { useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet } from 'react-native';

import { AppButton, AppScreen, AppText, AppTextInput, Stack } from '../../../components';
import { PublicRoutes } from '../../../navigation/routes';
import type { PublicStackParamList } from '../../../navigation/types';
import { spacing } from '../../../theme';
import { AuthFormCard, PasswordInput, UnavailableAuthFlowScreen } from '../components';
import { confirmPasswordReset, toSafePasswordResetErrorMessage } from '../services';
import { validateOtpCode, validatePasswordPair } from '../utils/authFormValidation';
import { isSelfServiceAuthEnabled } from '../utils/selfServiceAuthAccess';

type ResetPasswordScreenProps = NativeStackScreenProps<PublicStackParamList, 'ResetPassword'>;

export function ResetPasswordScreen({ navigation, route }: ResetPasswordScreenProps) {
  if (!isSelfServiceAuthEnabled()) {
    return (
      <UnavailableAuthFlowScreen
        message="إعادة تعيين كلمة المرور غير متاحة حاليا من التطبيق. تواصل مع إدارة الجامعة للمساعدة."
        title="إعادة تعيين كلمة المرور"
      />
    );
  }

  const phoneNumber = route.params?.phoneNumber ?? '';
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const displayedError = validationMessage ?? errorMessage;

  async function handleSubmit() {
    const codeError = validateOtpCode(code);
    const passwordError = validatePasswordPair(password, passwordConfirm);

    if (codeError) {
      setValidationMessage(codeError);
      return;
    }

    if (passwordError) {
      setValidationMessage(passwordError);
      return;
    }

    if (!phoneNumber) {
      setErrorMessage('بيانات الاستعادة غير مكتملة. ابدأ من شاشة نسيت كلمة المرور.');
      return;
    }

    setIsSubmitting(true);
    setValidationMessage(null);
    setErrorMessage(null);

    try {
      await confirmPasswordReset({
        phone_number: phoneNumber,
        code: code.trim(),
        new_password: password,
        new_password_confirm: passwordConfirm,
      });

      navigation.replace(PublicRoutes.Login);
    } catch (error) {
      setErrorMessage(toSafePasswordResetErrorMessage(error));
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
            <AppText variant="h1">تعيين كلمة مرور جديدة</AppText>
            <AppText color="secondary" variant="body">
              اختر كلمة مرور قوية وآمنة لحسابك.
            </AppText>
          </Stack>

          <AuthFormCard
            subtitle="أدخل رمز التحقق وكلمة المرور الجديدة."
            title="كلمة المرور الجديدة"
          >
            <Stack gap="md">
              <AppTextInput
                autoCapitalize="none"
                disabled={isSubmitting}
                keyboardType="number-pad"
                label="رمز التحقق"
                maxLength={8}
                onChangeText={(value) => {
                  setCode(value);
                  setValidationMessage(null);
                  setErrorMessage(null);
                }}
                placeholder="123456"
                value={code}
              />
              <PasswordInput
                disabled={isSubmitting}
                error={displayedError ?? undefined}
                onChangeText={(value) => {
                  setPassword(value);
                  setValidationMessage(null);
                  setErrorMessage(null);
                }}
                value={password}
              />
              <AppTextInput
                autoCapitalize="none"
                disabled={isSubmitting}
                label="تأكيد كلمة المرور"
                onChangeText={(value) => {
                  setPasswordConfirm(value);
                  setValidationMessage(null);
                  setErrorMessage(null);
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
                title="حفظ كلمة المرور"
              />
            </Stack>
          </AuthFormCard>

          <Pressable
            accessibilityRole="button"
            disabled={isSubmitting}
            onPress={() => navigation.navigate(PublicRoutes.Login)}
          >
            <AppText align="center" color="brand" variant="body">
              العودة لتسجيل الدخول
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
