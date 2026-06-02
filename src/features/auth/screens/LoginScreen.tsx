import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StyleSheet } from 'react-native';

import { AppButton, AppScreen, AppText, AppTextInput, Stack } from '../../../components';
import { PublicRoutes } from '../../../navigation/routes';
import type { PublicStackParamList } from '../../../navigation/types';
import { spacing } from '../../../theme';
import { AuthFormCard, PasswordInput } from '../components';
import { useAuthStore } from '../store';

type LoginNavigation = NativeStackNavigationProp<PublicStackParamList, 'Login'>;

const REQUIRED_FIELDS_MESSAGE = 'يرجى إدخال البريد أو رقم الهاتف وكلمة المرور.';

export function LoginScreen() {
  const navigation = useNavigation<LoginNavigation>();
  const login = useAuthStore((state) => state.login);
  const clearError = useAuthStore((state) => state.clearError);
  const isSubmitting = useAuthStore((state) => state.isSubmitting);
  const errorMessage = useAuthStore((state) => state.errorMessage);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const displayedError = validationMessage ?? errorMessage;

  function handleFieldChange(nextValue: string, field: 'identifier' | 'password') {
    if (field === 'identifier') {
      setIdentifier(nextValue);
    } else {
      setPassword(nextValue);
    }

    if (validationMessage) {
      setValidationMessage(null);
    }

    if (errorMessage) {
      clearError();
    }
  }

  async function handleSubmit() {
    const normalizedIdentifier = identifier.trim();

    if (!normalizedIdentifier || !password) {
      setValidationMessage(REQUIRED_FIELDS_MESSAGE);
      return;
    }

    try {
      await login({
        identifier: normalizedIdentifier,
        password,
      });
    } catch {
      // Auth store owns the user-facing error message.
    }
  }

  return (
    <AppScreen contentContainerStyle={styles.content} scroll>
      <Stack gap="xl">
        <Stack gap="sm">
          <AppText variant="h1">Panorama</AppText>
          <AppText color="secondary" variant="body">
            سجّل دخولك للوصول إلى خدماتك الجامعية.
          </AppText>
        </Stack>

        <AuthFormCard
          subtitle="استخدم البريد الإلكتروني أو رقم الهاتف المرتبط بحسابك."
          title="تسجيل الدخول"
        >
          <Stack gap="md">
            <AppTextInput
              autoCapitalize="none"
              autoCorrect={false}
              disabled={isSubmitting}
              keyboardType="email-address"
              label="البريد أو رقم الهاتف"
              onChangeText={(value) => handleFieldChange(value, 'identifier')}
              placeholder="student@example.com"
              textContentType="username"
              value={identifier}
            />
            <PasswordInput
              disabled={isSubmitting}
              onChangeText={(value) => handleFieldChange(value, 'password')}
              value={password}
            />

            {displayedError ? (
              <AppText color="error" variant="bodySmall">
                {displayedError}
              </AppText>
            ) : null}

            <AppButton
              fullWidth
              loading={isSubmitting}
              onPress={handleSubmit}
              title="تسجيل الدخول"
            />

            <Stack direction="horizontal" gap="sm" justify="space-between" wrap>
              <AppButton
                disabled={isSubmitting}
                onPress={() => navigation.navigate(PublicRoutes.RegisterStudent)}
                title="إنشاء حساب طالب"
                variant="ghost"
              />
              <AppButton
                disabled={isSubmitting}
                onPress={() => navigation.navigate(PublicRoutes.ForgotPassword)}
                title="نسيت كلمة المرور"
                variant="ghost"
              />
            </Stack>
          </Stack>
        </AuthFormCard>
      </Stack>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    justifyContent: 'center',
    gap: spacing.xl,
  },
});
