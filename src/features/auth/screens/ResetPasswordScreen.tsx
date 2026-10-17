import { useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, View } from 'react-native';

import { AppButton, AppText, FormAlert, OtpCodeInput } from '../../../components';
import { useTranslation } from '../../../i18n';
import { PublicRoutes } from '../../../navigation/routes';
import type { PublicStackParamList } from '../../../navigation/types';
import { AuthScreen, PasswordInput } from '../components';
import { formatCountdown, useResendCountdown } from '../hooks/useResendCountdown';
import {
  confirmPasswordReset,
  requestPasswordResetCode,
  toSafePasswordResetErrorMessage,
} from '../services';
import { validateOtpCode, validatePasswordPair } from '../utils/authFormValidation';

type Props = NativeStackScreenProps<PublicStackParamList, 'ResetPassword'>;
const RESEND_SECONDS = 60;

export function ResetPasswordScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { identifier, channel } = route.params;
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const { remaining, restart } = useResendCountdown(RESEND_SECONDS);

  async function handleSubmit() {
    const otpError = validateOtpCode(code, t.auth.validation);
    const pairError = validatePasswordPair(password, passwordConfirm, t.auth.validation);
    setCodeError(otpError);
    setPasswordError(pairError);
    if (otpError || pairError) return;
    setIsSubmitting(true);
    setServerError(null);
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
      setServerError(toSafePasswordResetErrorMessage(error, t.auth.errors));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResend() {
    if (remaining > 0 || isResending) return;
    setIsResending(true);
    setServerError(null);
    try {
      await requestPasswordResetCode(identifier, channel);
      restart();
    } catch (error) {
      setServerError(toSafePasswordResetErrorMessage(error, t.auth.errors));
    } finally {
      setIsResending(false);
    }
  }

  return (
    <AuthScreen
      footer={
        <AppButton
          disabled={isSubmitting}
          fullWidth
          loading={isSubmitting}
          onPress={() => void handleSubmit()}
          size="lg"
          title={t.auth.resetPassword.submit}
        />
      }
      onBack={() => navigation.goBack()}
      subtitle={t.auth.resetPassword.cardSubtitle(identifier)}
      title={t.auth.resetPassword.title}
    >
      {serverError ? <FormAlert message={serverError} /> : null}
      <OtpCodeInput
        disabled={isSubmitting}
        error={codeError}
        onChange={(value: string) => {
          setCode(value);
          setCodeError(null);
        }}
        value={code}
      />
      <View style={styles.center}>
        {remaining > 0 ? (
          <AppText color="muted" variant="bodySmall">
            {t.auth.otp.resendIn(formatCountdown(remaining))}
          </AppText>
        ) : (
          <AppButton
            disabled={isSubmitting || isResending}
            loading={isResending}
            onPress={() => void handleResend()}
            size="sm"
            title={t.auth.otp.resend}
            variant="outline"
          />
        )}
      </View>
      <PasswordInput
        autoComplete="new-password"
        disabled={isSubmitting}
        error={
          passwordError && passwordError !== t.auth.validation.passwordMismatch
            ? passwordError
            : undefined
        }
        helperText={t.auth.fields.passwordHint}
        label={t.auth.resetPassword.newPassword}
        onChangeText={(value) => {
          setPassword(value);
          setPasswordError(null);
        }}
        value={password}
      />
      <PasswordInput
        autoComplete="new-password"
        disabled={isSubmitting}
        error={passwordError === t.auth.validation.passwordMismatch ? passwordError : undefined}
        label={t.auth.fields.passwordConfirm}
        onChangeText={(value) => {
          setPasswordConfirm(value);
          setPasswordError(null);
        }}
        placeholder={t.auth.fields.passwordConfirmPlaceholder}
        value={passwordConfirm}
      />
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center' },
});
