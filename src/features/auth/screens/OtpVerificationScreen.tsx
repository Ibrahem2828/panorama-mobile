import { useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppButton, AppText, Icon, OtpCodeInput, Stack } from '../../../components';
import { useTranslation } from '../../../i18n';
import { PublicRoutes } from '../../../navigation/routes';
import type { PublicStackParamList } from '../../../navigation/types';
import { radius, spacing, useBrand } from '../../../theme';
import { AuthScreen } from '../components';
import { formatCountdown, useResendCountdown } from '../hooks/useResendCountdown';
import {
  sendRegistrationOtp,
  toSafeRegistrationErrorMessage,
  verifyRegistrationOtp,
} from '../services';
import { validateOtpCode } from '../utils/authFormValidation';
import { isolateLtr } from '../../../utils/rtl';

type Props = NativeStackScreenProps<PublicStackParamList, 'OtpVerification'>;
const RESEND_SECONDS = 60;

export function OtpVerificationScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const brand = useBrand();
  const { identifier, channel } = route.params;
  const [code, setCode] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const { remaining, restart } = useResendCountdown(RESEND_SECONDS);

  async function verify(value: string) {
    if (isSubmitting) return;
    const validationError = validateOtpCode(value, t.auth.validation);
    if (validationError) return setErrorMessage(validationError);
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await verifyRegistrationOtp({ identifier, channel, code: value.trim() });
      navigation.reset({ index: 0, routes: [{ name: PublicRoutes.Login }] });
    } catch (error) {
      setErrorMessage(toSafeRegistrationErrorMessage(error, t.auth.errors));
      setCode('');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResend() {
    if (remaining > 0 || isResending) return;
    setIsResending(true);
    setErrorMessage(null);
    try {
      await sendRegistrationOtp({ identifier, channel });
      restart();
    } catch (error) {
      setErrorMessage(toSafeRegistrationErrorMessage(error, t.auth.errors));
    } finally {
      setIsResending(false);
    }
  }

  const destinationLabel =
    channel === 'email' ? t.auth.otp.destinationEmail : t.auth.otp.destinationPhone;

  return (
    <AuthScreen
      after={
        <Stack align="center" gap="xs">
          {channel === 'email' ? (
            <AppText align="center" color="muted" variant="caption">
              {t.auth.otp.spamHint}
            </AppText>
          ) : null}
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.goBack()}
            style={styles.link}
          >
            <AppText color="brand" variant="button">
              {t.auth.otp.wrongEmail}
            </AppText>
          </Pressable>
        </Stack>
      }
      footer={
        <AppButton
          disabled={isSubmitting || code.length < 6}
          fullWidth
          loading={isSubmitting}
          onPress={() => void verify(code)}
          size="lg"
          title={t.auth.otp.submit}
        />
      }
      onBack={() => navigation.goBack()}
      subtitle={t.auth.otp.sentTo(destinationLabel, isolateLtr(identifier))}
      title={t.auth.otp.title}
    >
      <View style={styles.center}>
        <View style={[styles.badge, { backgroundColor: brand.primarySoft }]}>
          <Icon color={brand.primary} name="mail" size={28} />
        </View>
      </View>
      <AppText align="center" color="secondary" variant="bodySmall">
        {t.auth.otp.cardSubtitle}
      </AppText>
      <OtpCodeInput
        disabled={isSubmitting}
        error={errorMessage}
        onChange={(value: string) => {
          setCode(value);
          setErrorMessage(null);
        }}
        onComplete={(value) => void verify(value)}
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
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center' },
  link: { minHeight: 44, justifyContent: 'center', paddingHorizontal: spacing.sm },
  badge: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
  },
});
