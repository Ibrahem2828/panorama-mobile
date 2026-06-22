import { useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';

import { AppButton, AppScreen, Stack } from '../../../components';
import { OtpCodeInput } from '../../../components/forms/OtpCodeInput';
import { PublicRoutes } from '../../../navigation/routes';
import type { PublicStackParamList } from '../../../navigation/types';
import { spacing } from '../../../theme';
import { AuthFormCard } from '../components';
import { verifyPhoneOtp, toSafeD1ErrorMessage } from '../services';

type Props = NativeStackScreenProps<PublicStackParamList, 'PhoneOtpVerification'>;

export function PhoneOtpVerificationScreen({ navigation, route }: Props) {
  const { phoneNumber } = route.params;
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleVerifyWithCode(verifyCode: string) {
    const trimmed = verifyCode.trim();
    if (!trimmed || trimmed.length < 4) {
      setError('أدخل رمز التحقق.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await verifyPhoneOtp({ phone_number: phoneNumber, code: trimmed });
      navigation.navigate(PublicRoutes.Login);
    } catch (e) {
      setError(toSafeD1ErrorMessage(e));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVerify() {
    await handleVerifyWithCode(code);
  }

  return (
    <AppScreen contentContainerStyle={styles.content} scroll>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Stack gap="lg">
          <AuthFormCard title="التحقق من رقم الجوال" subtitle={`تم إرسال رمز إلى ${phoneNumber}`}>
            <Stack gap="md">
              <OtpCodeInput
                value={code}
                onChange={setCode}
                onComplete={(completed) => {
                  if (completed.length === 6 && !isSubmitting) {
                    setCode(completed);
                    // trigger verify immediately on complete
                    setTimeout(() => {
                      handleVerifyWithCode(completed);
                    }, 50);
                  }
                }}
                error={error}
                disabled={isSubmitting}
                autoFocus
              />
              <AppButton fullWidth loading={isSubmitting} onPress={handleVerify} title="تأكيد" />
            </Stack>
          </AuthFormCard>
        </Stack>
      </KeyboardAvoidingView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: { paddingVertical: spacing.lg },
});
