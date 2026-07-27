import { useEffect, useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet } from 'react-native';

import { AppButton, AppScreen, AppText, AppTextInput, Stack } from '../../../components';
import { PublicRoutes } from '../../../navigation/routes';
import type { PublicStackParamList } from '../../../navigation/types';
import { spacing } from '../../../theme';
import { AuthFormCard, PasswordInput } from '../components';
import {
  confirmPasswordReset,
  requestPasswordResetCode,
  toSafePasswordResetErrorMessage,
} from '../services';
import { validateOtpCode, validatePasswordPair } from '../utils/authFormValidation';

type Props = NativeStackScreenProps<PublicStackParamList, 'ResetPassword'>;
const RESEND_SECONDS = 60;

export function ResetPasswordScreen({ navigation, route }: Props) {
  const { identifier, channel } = route.params;
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (remainingSeconds <= 0) return;
    const timer = setInterval(() => setRemainingSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => clearInterval(timer);
  }, [remainingSeconds]);

  async function handleSubmit() {
    const otpError = validateOtpCode(code);
    const passwordError = validatePasswordPair(password, passwordConfirm);
    if (otpError || passwordError) return setErrorMessage(otpError ?? passwordError);
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await confirmPasswordReset({
        identifier,
        channel,
        code: code.trim(),
        new_password: password,
        new_password_confirm: passwordConfirm,
      });
      navigation.reset({ index: 0, routes: [{ name: PublicRoutes.Login }] });
    } catch (error) {
      setErrorMessage(toSafePasswordResetErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResend() {
    if (remainingSeconds > 0) return;
    setIsResending(true);
    try {
      await requestPasswordResetCode(identifier, channel);
      setRemainingSeconds(RESEND_SECONDS);
    } catch (error) {
      setErrorMessage(toSafePasswordResetErrorMessage(error));
    } finally {
      setIsResending(false);
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
            <AppText variant="h1">كلمة مرور جديدة</AppText>
            <AppText color="secondary">
              اختر كلمة مرور قوية ولا تعِد استخدامها في خدمات أخرى.
            </AppText>
          </Stack>
          <AuthFormCard subtitle={`أدخل الرمز المرسل إلى ${identifier}.`} title="إعادة التعيين">
            <Stack gap="md">
              <AppTextInput
                disabled={isSubmitting}
                keyboardType="number-pad"
                label="رمز التحقق"
                maxLength={6}
                onChangeText={(value) => {
                  setCode(value);
                  setErrorMessage(null);
                }}
                value={code}
              />
              <PasswordInput
                disabled={isSubmitting}
                error={errorMessage ?? undefined}
                onChangeText={setPassword}
                value={password}
              />
              <AppTextInput
                disabled={isSubmitting}
                label="تأكيد كلمة المرور"
                onChangeText={setPasswordConfirm}
                secureTextEntry
                value={passwordConfirm}
              />
              <AppButton
                disabled={isSubmitting}
                fullWidth
                loading={isSubmitting}
                onPress={() => void handleSubmit()}
                title="حفظ كلمة المرور"
              />
              <AppButton
                disabled={isSubmitting || isResending || remainingSeconds > 0}
                fullWidth
                loading={isResending}
                onPress={() => void handleResend()}
                title={
                  remainingSeconds > 0
                    ? `إعادة الإرسال بعد ${remainingSeconds}ث`
                    : 'إعادة إرسال الرمز'
                }
                variant="outline"
              />
            </Stack>
          </AuthFormCard>
          <Pressable onPress={() => navigation.navigate(PublicRoutes.Login)}>
            <AppText align="center" color="brand">
              العودة لتسجيل الدخول
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
