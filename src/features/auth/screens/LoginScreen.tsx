import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Pressable, StyleSheet } from 'react-native';

import { AppButton, AppText, AppTextInput, FormAlert, Stack } from '../../../components';
import { useTranslation } from '../../../i18n';
import { PublicRoutes } from '../../../navigation/routes';
import type { PublicStackParamList } from '../../../navigation/types';
import { spacing } from '../../../theme';
import { AuthScreen, PasswordInput } from '../components';
import { useAuthStore } from '../store';

type PublicNavigation = NativeStackNavigationProp<PublicStackParamList>;

export function LoginScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<PublicNavigation>();
  const login = useAuthStore((state) => state.login);
  const clearError = useAuthStore((state) => state.clearError);
  const isSubmitting = useAuthStore((state) => state.isSubmitting);
  const errorMessage = useAuthStore((state) => state.errorMessage);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [identifierError, setIdentifierError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  function updateField(value: string, field: 'identifier' | 'password') {
    if (field === 'identifier') {
      setIdentifier(value);
      setIdentifierError(null);
    } else {
      setPassword(value);
      setPasswordError(null);
    }
    clearError();
  }

  async function handleSubmit() {
    const missingIdentifier = !identifier.trim();
    const missingPassword = !password;
    if (missingIdentifier || missingPassword) {
      setIdentifierError(missingIdentifier ? t.auth.login.identifierRequired : null);
      setPasswordError(missingPassword ? t.auth.login.passwordRequired : null);
      return;
    }
    try {
      await login({ identifier: identifier.trim(), password });
    } catch {
      // Auth store owns the safe user-facing message.
    }
  }

  return (
    <AuthScreen
      after={
        <Stack align="center" gap="xs">
          <AppText align="center" color="secondary" variant="bodySmall">
            {t.auth.login.noAccount}
          </AppText>
          <Pressable
            accessibilityRole="button"
            disabled={isSubmitting}
            onPress={() => navigation.navigate(PublicRoutes.AccountTypeChoice)}
            style={styles.link}
          >
            <AppText color="brand" variant="button">
              {t.auth.login.createAccount}
            </AppText>
          </Pressable>
        </Stack>
      }
      footer={
        <AppButton
          disabled={isSubmitting}
          fullWidth
          loading={isSubmitting}
          onPress={() => void handleSubmit()}
          size="lg"
          title={t.auth.login.submit}
        />
      }
      logoSize="lg"
      subtitle={t.auth.login.cardSubtitle}
      title={t.auth.login.title}
    >
      {errorMessage ? <FormAlert message={errorMessage} /> : null}
      <AppTextInput
        autoCapitalize="none"
        autoComplete="username"
        autoCorrect={false}
        disabled={isSubmitting}
        error={identifierError ?? undefined}
        keyboardType="email-address"
        label={t.auth.fields.identifier}
        onChangeText={(value) => updateField(value, 'identifier')}
        placeholder={t.auth.fields.identifierPlaceholder}
        textContentType="username"
        value={identifier}
      />
      <PasswordInput
        autoComplete="current-password"
        disabled={isSubmitting}
        error={passwordError ?? undefined}
        onChangeText={(value) => updateField(value, 'password')}
        value={password}
      />
      <Pressable
        accessibilityRole="button"
        disabled={isSubmitting}
        onPress={() => navigation.navigate(PublicRoutes.ForgotPassword)}
        style={styles.forgot}
      >
        <AppText color="brand" variant="bodySmall" weight="600">
          {t.auth.login.forgotPassword}
        </AppText>
      </Pressable>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  link: { minHeight: 44, justifyContent: 'center', paddingHorizontal: spacing.sm },
  forgot: { alignSelf: 'flex-start', minHeight: 36, justifyContent: 'center' },
});
