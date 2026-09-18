import { useEffect, useRef, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Animated,
  Easing,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
} from 'react-native';

import { images } from '../../../assets/images';
import { AppButton, AppScreen, AppText, AppTextInput, Stack } from '../../../components';
import { useTranslation } from '../../../i18n';
import { PublicRoutes } from '../../../navigation/routes';
import type { PublicStackParamList } from '../../../navigation/types';
import { spacing } from '../../../theme';
import { AuthFormCard, PasswordInput } from '../components';
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
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslate = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(cardTranslate, {
        toValue: 0,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [cardOpacity, cardTranslate]);

  function updateField(value: string, field: 'identifier' | 'password') {
    if (field === 'identifier') setIdentifier(value);
    else setPassword(value);
    setValidationMessage(null);
    clearError();
  }

  async function handleSubmit() {
    if (!identifier.trim() || !password) {
      setValidationMessage(t.auth.login.missingCredentials);
      return;
    }
    try {
      await login({ identifier: identifier.trim(), password });
    } catch {
      // Auth store owns the safe user-facing message.
    }
  }

  return (
    <AppScreen contentContainerStyle={styles.content} scroll>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoid}
      >
        <Stack gap="xl">
          <Stack align="center" gap="sm">
            <Image
              accessibilityIgnoresInvertColors
              accessibilityLabel={t.auth.logoAlt}
              resizeMode="contain"
              source={images.brand.logoFullAr}
              style={styles.logo}
            />
            <AppText variant="h1">{t.appName}</AppText>
            <AppText align="center" color="secondary" variant="body">
              {t.auth.login.tagline}
            </AppText>
          </Stack>

          <Animated.View
            style={{ opacity: cardOpacity, transform: [{ translateY: cardTranslate }] }}
          >
            <AuthFormCard subtitle={t.auth.login.cardSubtitle} title={t.auth.login.title}>
              <Stack gap="md">
                <AppTextInput
                  autoCapitalize="none"
                  autoCorrect={false}
                  disabled={isSubmitting}
                  error={validationMessage ?? errorMessage ?? undefined}
                  keyboardType="email-address"
                  label={t.auth.fields.identifier}
                  onChangeText={(value) => updateField(value, 'identifier')}
                  placeholder={t.auth.fields.identifierPlaceholder}
                  textContentType="username"
                  value={identifier}
                />
                <PasswordInput
                  disabled={isSubmitting}
                  onChangeText={(value) => updateField(value, 'password')}
                  value={password}
                />
                <AppButton
                  disabled={isSubmitting}
                  fullWidth
                  loading={isSubmitting}
                  onPress={() => void handleSubmit()}
                  title={t.auth.login.submit}
                />
              </Stack>
            </AuthFormCard>
          </Animated.View>

          <Stack align="center" gap="sm">
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
            <Pressable
              accessibilityRole="button"
              disabled={isSubmitting}
              onPress={() => navigation.navigate(PublicRoutes.ForgotPassword)}
              style={styles.link}
            >
              <AppText color="brand" variant="button">
                {t.auth.login.forgotPassword}
              </AppText>
            </Pressable>
          </Stack>
        </Stack>
      </KeyboardAvoidingView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: { justifyContent: 'center', gap: spacing.xl },
  keyboardAvoid: { flex: 1 },
  logo: { width: 230, maxWidth: '84%', height: 150 },
  link: { minHeight: 44, justifyContent: 'center', paddingHorizontal: spacing.sm },
});
