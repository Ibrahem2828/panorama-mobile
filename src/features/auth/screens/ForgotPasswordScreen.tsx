import { useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet } from 'react-native';

import { AppButton, AppScreen, AppText, AppTextInput, Stack } from '../../../components';
import { useTranslation } from '../../../i18n';
import { PublicRoutes } from '../../../navigation/routes';
import type { PublicStackParamList } from '../../../navigation/types';
import { spacing } from '../../../theme';
import { AuthFormCard } from '../components';
import { requestPasswordResetCode, toSafePasswordResetErrorMessage } from '../services';
import { isValidEmail } from '../utils/authFormValidation';

type Props = NativeStackScreenProps<PublicStackParamList, 'ForgotPassword'>;

export function ForgotPasswordScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    const identifier = email.trim().toLowerCase();
    if (!isValidEmail(identifier)) return setErrorMessage(t.auth.validation.emailInvalid);
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await requestPasswordResetCode(identifier, 'email');
      navigation.navigate(PublicRoutes.ResetPassword, { identifier, channel: 'email' });
    } catch (error) {
      setErrorMessage(toSafePasswordResetErrorMessage(error, t.auth.errors));
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
            <AppText variant="h1">{t.auth.forgotPassword.title}</AppText>
            <AppText color="secondary">{t.auth.forgotPassword.subtitle}</AppText>
          </Stack>
          <AuthFormCard
            subtitle={t.auth.forgotPassword.cardSubtitle}
            title={t.auth.forgotPassword.cardTitle}
          >
            <Stack gap="md">
              <AppTextInput
                autoCapitalize="none"
                disabled={isSubmitting}
                error={errorMessage ?? undefined}
                keyboardType="email-address"
                label={t.auth.fields.email}
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
                title={t.auth.forgotPassword.submit}
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
