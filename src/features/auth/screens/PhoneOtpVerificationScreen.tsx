import { useRef, useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Animated, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';

import { images } from '../../../assets/images';
import { AppButton, AppScreen, AppText, Stack } from '../../../components';
import { Illustration } from '../../../components/media/Illustration';
import { OtpCodeInput } from '../../../components/forms/OtpCodeInput';
import { PublicRoutes } from '../../../navigation/routes';
import type { PublicStackParamList } from '../../../navigation/types';
import { spacing } from '../../../theme';
import { createFadeInAnim, MOTION } from '../../../utils/motion';
import { AuthFormCard } from '../components';
import { verifyPhoneOtp, toSafeD1ErrorMessage } from '../services';

type Props = NativeStackScreenProps<PublicStackParamList, 'PhoneOtpVerification'>;

const MISSING_PHONE =
  'لا يمكن التحقق من رقم الجوال حالياً. يرجى تسجيل الدخول مرة أخرى أو التواصل مع الدعم.';

export function PhoneOtpVerificationScreen({ navigation, route }: Props) {
  const { phoneNumber } = route.params;
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const fadeAnim = useRef(createFadeInAnim()).current;

  const canSubmit = code.trim().length === 6 && !isSubmitting && !success;

  async function handleVerifyWithCode(verifyCode: string) {
    const trimmed = verifyCode.trim();
    if (trimmed.length !== 6) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await verifyPhoneOtp({ phone_number: phoneNumber, code: trimmed });
      setSuccess(true);
      fadeAnim.animate(MOTION.duration.slow).start();
      setTimeout(() => {
        navigation.reset({ index: 0, routes: [{ name: PublicRoutes.Login }] });
      }, 2000);
    } catch (e) {
      setError(toSafeD1ErrorMessage(e));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVerify() {
    await handleVerifyWithCode(code);
  }

  if (success) {
    return (
      <AppScreen contentContainerStyle={styles.content} scroll>
        <Animated.View style={{ opacity: fadeAnim.opacity, flex: 1 }}>
          <Stack gap="xl" align="center" style={styles.successContainer}>
            <Illustration
              accessibilityLabel="تم التحقق"
              size="md"
              source={images.illustrations.success}
            />
            <Stack gap="sm" align="center">
              <AppText variant="h2" align="center">
                تم التحقق من رقم الجوال بنجاح
              </AppText>
              <AppText color="secondary" align="center" variant="body">
                يمكنك تسجيل الدخول الآن.
              </AppText>
            </Stack>
            <AppButton
              fullWidth
              onPress={() => navigation.reset({ index: 0, routes: [{ name: PublicRoutes.Login }] })}
              title="تسجيل الدخول"
            />
          </Stack>
        </Animated.View>
      </AppScreen>
    );
  }

  return (
    <AppScreen contentContainerStyle={styles.content} scroll>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Stack gap="lg">
          <AuthFormCard
            title="التحقق من رقم الجوال"
            subtitle={phoneNumber ? `أدخل رمز التحقق المرسل إلى رقم الجوال.` : undefined}
          >
            <Stack gap="md">
              {!phoneNumber ? (
                <AppText color="error" variant="bodySmall">
                  {MISSING_PHONE}
                </AppText>
              ) : (
                <>
                  {phoneNumber ? (
                    <AppText color="secondary" variant="bodySmall" align="center">
                      {phoneNumber}
                    </AppText>
                  ) : null}

                  <OtpCodeInput
                    value={code}
                    onChange={setCode}
                    onComplete={(completed) => {
                      if (completed.length === 6 && !isSubmitting) {
                        setCode(completed);
                        setTimeout(() => {
                          handleVerifyWithCode(completed);
                        }, 50);
                      }
                    }}
                    error={error}
                    disabled={isSubmitting}
                    loading={isSubmitting}
                    autoFocus
                  />

                  <AppButton
                    fullWidth
                    disabled={!canSubmit}
                    loading={isSubmitting}
                    onPress={handleVerify}
                    title="تحقق من الرمز"
                  />
                </>
              )}
            </Stack>
          </AuthFormCard>
        </Stack>
      </KeyboardAvoidingView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: { paddingVertical: spacing.lg },
  successContainer: {
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.md,
  },
});
