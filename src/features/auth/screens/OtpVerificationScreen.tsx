import { useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet } from 'react-native';

import { AppButton, AppScreen, AppText, AppTextInput, Stack } from '../../../components';
import { PublicRoutes } from '../../../navigation/routes';
import type { PublicStackParamList } from '../../../navigation/types';
import { spacing } from '../../../theme';
import { AuthFormCard, UnavailableAuthFlowScreen } from '../components';
import {
  sendRegistrationOtp,
  toSafeRegistrationErrorMessage,
  verifyRegistrationOtp,
} from '../services';
import { validateOtpCode } from '../utils/authFormValidation';
import { isSelfServiceAuthEnabled } from '../utils/selfServiceAuthAccess';

type OtpVerificationScreenProps = NativeStackScreenProps<PublicStackParamList, 'OtpVerification'>;

export function OtpVerificationScreen({ navigation, route }: OtpVerificationScreenProps) {
  if (!isSelfServiceAuthEnabled()) {
    return (
      <UnavailableAuthFlowScreen
        message="تأكيد رمز التحقق غير متاح حاليا كتدفق مستقل. استخدم تسجيل الدخول أو تواصل مع إدارة الجامعة."
        title="تأكيد الرمز"
      />
    );
  }

  const phoneNumber = route.params?.phoneNumber ?? '';
  const [code, setCode] = useState('');
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  async function handleVerify() {
    const codeError = validateOtpCode(code);

    if (codeError) {
      setValidationMessage(codeError);
      setErrorMessage(null);
      return;
    }

    if (!phoneNumber) {
      setErrorMessage('بيانات التحقق غير مكتملة. أعد التسجيل من البداية.');
      return;
    }

    setIsSubmitting(true);
    setValidationMessage(null);
    setErrorMessage(null);

    try {
      await verifyRegistrationOtp(phoneNumber, code.trim());
      navigation.replace(PublicRoutes.Login);
    } catch (error) {
      setErrorMessage(toSafeRegistrationErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResend() {
    if (!phoneNumber) {
      return;
    }

    setIsResending(true);
    setResendMessage(null);
    setErrorMessage(null);

    try {
      await sendRegistrationOtp(phoneNumber);
      setResendMessage('تم إرسال رمز جديد إلى رقم هاتفك.');
    } catch (error) {
      setErrorMessage(toSafeRegistrationErrorMessage(error));
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
            <AppText variant="h1">أدخل رمز التحقق</AppText>
            <AppText color="secondary" variant="body">
              أرسلنا رمزاً إلى وسيلة التواصل المرتبطة بحسابك.
            </AppText>
          </Stack>

          <AuthFormCard subtitle="أدخل الرمز المكوّن من 6 أرقام." title="رمز التحقق">
            <Stack gap="md">
              <AppTextInput
                autoCapitalize="none"
                disabled={isSubmitting}
                error={validationMessage ?? errorMessage ?? undefined}
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
              {resendMessage ? (
                <AppText color="success" variant="bodySmall">
                  {resendMessage}
                </AppText>
              ) : null}
              <AppButton
                disabled={isSubmitting}
                fullWidth
                loading={isSubmitting}
                onPress={() => {
                  void handleVerify();
                }}
                title="تأكيد الرمز"
              />
              <AppButton
                disabled={isSubmitting || isResending}
                fullWidth
                loading={isResending}
                onPress={() => {
                  void handleResend();
                }}
                title="إعادة إرسال الرمز"
                variant="outline"
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
