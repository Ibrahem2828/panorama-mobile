import { useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet } from 'react-native';

import { AppButton, AppScreen, AppText, AppTextInput, Stack } from '../../../components';
import { PublicRoutes } from '../../../navigation/routes';
import type { PublicStackParamList } from '../../../navigation/types';
import { spacing } from '../../../theme';
import { AuthFormCard } from '../components';
import { requestPasswordResetCode, toSafePasswordResetErrorMessage } from '../services';
import { isValidEmail } from '../utils/authFormValidation';

type Props = NativeStackScreenProps<PublicStackParamList, 'ForgotPassword'>;

export function ForgotPasswordScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    const identifier = email.trim().toLowerCase();
    if (!isValidEmail(identifier)) return setErrorMessage('يرجى إدخال بريد إلكتروني صالح.');
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await requestPasswordResetCode(identifier, 'email');
      navigation.navigate(PublicRoutes.ResetPassword, { identifier, channel: 'email' });
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
            <AppText color="secondary">
              سنرسل رمزًا إلى البريد المرتبط بالحساب دون كشف وجود الحساب.
            </AppText>
          </Stack>
          <AuthFormCard
            subtitle="أدخل البريد الإلكتروني المستخدم في بانوراما."
            title="البريد الإلكتروني"
          >
            <Stack gap="md">
              <AppTextInput
                autoCapitalize="none"
                disabled={isSubmitting}
                error={errorMessage ?? undefined}
                keyboardType="email-address"
                label="البريد الإلكتروني"
                onChangeText={(value) => {
                  setEmail(value);
                  setErrorMessage(null);
                }}
                value={email}
              />
              <AppButton
                disabled={isSubmitting}
                fullWidth
                loading={isSubmitting}
                onPress={() => void handleSubmit()}
                title="إرسال رمز الاستعادة"
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
