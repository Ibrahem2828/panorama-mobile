import { useEffect, useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet } from 'react-native';

import { AppButton, AppScreen, AppText, Stack } from '../../../components';
import { OtpCodeInput } from '../../../components/forms/OtpCodeInput';
import { useTranslation } from '../../../i18n';
import { PublicRoutes } from '../../../navigation/routes';
import type { PublicStackParamList } from '../../../navigation/types';
import { spacing } from '../../../theme';
import { AuthFormCard } from '../components';
import {
  sendRegistrationOtp,
  toSafeRegistrationErrorMessage,
  verifyRegistrationOtp,
} from '../services';
import { validateOtpCode } from '../utils/authFormValidation';

type Props = NativeStackScreenProps<PublicStackParamList, 'OtpVerification'>;
const RESEND_SECONDS = 60;

export function OtpVerificationScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { identifier, channel } = route.params;
  const [code, setCode] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (remainingSeconds <= 0) return;
    const timer = setInterval(() => setRemainingSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => clearInterval(timer);
  }, [remainingSeconds]);

  async function handleVerify() {
    const validationError = validateOtpCode(code, t.auth.validation);
    if (validationError) return setErrorMessage(validationError);
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await verifyRegistrationOtp({ identifier, channel, code: code.trim() });
      navigation.reset({ index: 0, routes: [{ name: PublicRoutes.Login }] });
    } catch (error) {
      setErrorMessage(toSafeRegistrationErrorMessage(error, t.auth.errors));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResend() {
    if (remainingSeconds > 0) return;
    setIsResending(true);
    setErrorMessage(null);
    try {
      await sendRegistrationOtp({ identifier, channel });
      setRemainingSeconds(RESEND_SECONDS);
    } catch (error) {
      setErrorMessage(toSafeRegistrationErrorMessage(error, t.auth.errors));
    } finally {
      setIsResending(false);
    }
  }

  const destinationLabel =
    channel === 'email' ? t.auth.otp.destinationEmail : t.auth.otp.destinationPhone;

  return (
    <AppScreen contentContainerStyle={styles.content} scroll>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoid}
      >
        <Stack gap="lg">
          <Stack gap="xs">
            <AppText variant="h1">{t.auth.otp.title}</AppText>
            <AppText color="secondary" variant="body">
              {t.auth.otp.sentTo(destinationLabel, identifier)}
            </AppText>
          </Stack>
          <AuthFormCard subtitle={t.auth.otp.cardSubtitle} title={t.auth.otp.cardTitle}>
            <Stack gap="md">
              <OtpCodeInput
                disabled={isSubmitting}
                error={errorMessage ?? undefined}
                onChange={(value: string) => {
                  setCode(value);
                  setErrorMessage(null);
                }}
                value={code}
              />
              <AppButton
                disabled={isSubmitting}
                fullWidth
                loading={isSubmitting}
                onPress={() => void handleVerify()}
                title={t.auth.otp.submit}
              />
              <AppButton
                disabled={isSubmitting || isResending || remainingSeconds > 0}
                fullWidth
                loading={isResending}
                onPress={() => void handleResend()}
                title={
                  remainingSeconds > 0 ? t.auth.otp.resendIn(remainingSeconds) : t.auth.otp.resend
                }
                variant="outline"
              />
            </Stack>
          </AuthFormCard>
          <Pressable onPress={() => navigation.navigate(PublicRoutes.Login)}>
            <AppText align="center" color="brand">
              {t.auth.backToLogin}
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
