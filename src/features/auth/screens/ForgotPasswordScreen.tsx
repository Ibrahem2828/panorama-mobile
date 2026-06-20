import { useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet } from 'react-native';

import { AppButton, AppScreen, AppText, AppTextInput, Stack } from '../../../components';
import { PublicRoutes } from '../../../navigation/routes';
import type { PublicStackParamList } from '../../../navigation/types';
import { spacing } from '../../../theme';
import { AuthFormCard, UnavailableAuthFlowScreen } from '../components';
import { requestPasswordResetCode, toSafePasswordResetErrorMessage } from '../services';
import { isValidPhoneNumber, normalizePhoneNumber } from '../utils/authFormValidation';
import { isSelfServiceAuthEnabled } from '../utils/selfServiceAuthAccess';

type ForgotPasswordScreenProps = NativeStackScreenProps<PublicStackParamList, 'ForgotPassword'>;

export function ForgotPasswordScreen({ navigation }: ForgotPasswordScreenProps) {
  if (!isSelfServiceAuthEnabled()) {
    return (
      <UnavailableAuthFlowScreen
        message="استعادة كلمة المرور غير متاحة حاليا من التطبيق. تواصل مع إدارة الجامعة أو فريق الدعم الفني."
        title="نسيت كلمة المرور"
      />
    );
  }

  const [phoneNumber, setPhoneNumber] = useState('');
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    const normalizedPhone = normalizePhoneNumber(phoneNumber);

    if (!isValidPhoneNumber(normalizedPhone)) {
      setValidationMessage('يرجى إدخال رقم هاتف صالح مرتبط بحسابك.');
      setErrorMessage(null);
      return;
    }

    setIsSubmitting(true);
    setValidationMessage(null);
    setErrorMessage(null);

    try {
      await requestPasswordResetCode(normalizedPhone);
      navigation.navigate(PublicRoutes.ResetPassword, { phoneNumber: normalizedPhone });
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
            <AppText variant="h1">استعادة كلمة المرور</AppText>
            <AppText color="secondary" variant="body">
              سنرسل لك رمز تحقق لإعادة تعيين كلمة المرور.
            </AppText>
          </Stack>

          <AuthFormCard subtitle="أدخل رقم الهاتف المرتبط بحسابك الطلابي." title="رقم الهاتف">
            <Stack gap="md">
              <AppTextInput
                autoCapitalize="none"
                disabled={isSubmitting}
                error={validationMessage ?? errorMessage ?? undefined}
                keyboardType="phone-pad"
                label="رقم الهاتف"
                onChangeText={(value) => {
                  setPhoneNumber(value);
                  setValidationMessage(null);
                  setErrorMessage(null);
                }}
                placeholder="+963900000000"
                textContentType="telephoneNumber"
                value={phoneNumber}
              />
              <AppButton
                disabled={isSubmitting}
                fullWidth
                loading={isSubmitting}
                onPress={() => {
                  void handleSubmit();
                }}
                title="إرسال رمز التحقق"
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
