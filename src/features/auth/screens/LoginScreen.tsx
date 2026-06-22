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
import { AppButton, AppCard, AppScreen, AppText, AppTextInput, Stack } from '../../../components';
import { PublicRoutes } from '../../../navigation/routes';
import type { PublicStackParamList } from '../../../navigation/types';
import { spacing } from '../../../theme';
import { AuthFormCard, PasswordInput } from '../components';
import { useAuthStore } from '../store';
import { isSelfServiceAuthEnabled } from '../utils/selfServiceAuthAccess';

const REQUIRED_FIELDS_MESSAGE = 'يرجى إدخال البريد أو رقم الهاتف وكلمة المرور.';

type PublicNavigation = NativeStackNavigationProp<PublicStackParamList>;

export function LoginScreen() {
  const navigation = useNavigation<PublicNavigation>();
  const selfServiceEnabled = isSelfServiceAuthEnabled();
  const login = useAuthStore((state) => state.login);
  const clearError = useAuthStore((state) => state.clearError);
  const isSubmitting = useAuthStore((state) => state.isSubmitting);
  const errorMessage = useAuthStore((state) => state.errorMessage);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const displayedError = validationMessage ?? errorMessage;

  // Subtle card entrance animation (React Native Animated)
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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoid}
      >
        <Stack gap="xl">
          <Stack align="center" gap="sm">
            <Image
              accessibilityIgnoresInvertColors
              accessibilityLabel="شعار بانوراما"
              resizeMode="contain"
              source={images.brand.logoFullBilingual}
              style={styles.logo}
            />
            <AppText variant="h1">بانوراما</AppText>
            <AppText color="secondary" variant="body">
              تطبيق الجامعة للطلاب. سجّل دخولك للوصول إلى المواد والخدمات.
            </AppText>
          </Stack>

          <Animated.View
            style={{
              opacity: cardOpacity,
              transform: [{ translateY: cardTranslate }],
            }}
          >
            <AuthFormCard
              subtitle="استخدم البريد الإلكتروني أو رقم الهاتف المرتبط بحسابك الطلابي."
              title="تسجيل الدخول"
            >
              <Stack gap="md">
                <AppTextInput
                  accessibilityLabel="البريد الإلكتروني أو رقم الهاتف"
                  autoCapitalize="none"
                  autoCorrect={false}
                  disabled={isSubmitting}
                  error={displayedError ?? undefined}
                  keyboardType="email-address"
                  label="البريد أو رقم الهاتف"
                  onChangeText={(value) => handleFieldChange(value, 'identifier')}
                  placeholder="student@university.edu"
                  textContentType="username"
                  value={identifier}
                />
                <PasswordInput
                  disabled={isSubmitting}
                  onChangeText={(value) => handleFieldChange(value, 'password')}
                  value={password}
                />

                <AppButton
                  accessibilityLabel="تسجيل الدخول"
                  disabled={isSubmitting}
                  fullWidth
                  loading={isSubmitting}
                  onPress={handleSubmit}
                  title="تسجيل الدخول"
                />
              </Stack>
            </AuthFormCard>
          </Animated.View>

          {selfServiceEnabled ? (
            <Stack gap="sm" style={styles.authLinks}>
              <Pressable
                accessibilityRole="button"
                disabled={isSubmitting}
                onPress={() => navigation.navigate(PublicRoutes.RegisterStudent)}
                style={styles.authLink}
              >
                <AppText color="brand" variant="button">
                  إنشاء حساب طالب
                </AppText>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                disabled={isSubmitting}
                onPress={() => navigation.navigate(PublicRoutes.ForgotPassword)}
                style={styles.authLink}
              >
                <AppText color="brand" variant="button">
                  نسيت كلمة المرور؟
                </AppText>
              </Pressable>
            </Stack>
          ) : (
            <AppCard padding="lg" variant="muted">
              <Stack gap="sm">
                <AppText variant="title">حساب جديد أو استعادة كلمة المرور</AppText>
                <AppText color="secondary" variant="bodySmall">
                  لإنشاء حساب طالب أو استعادة كلمة المرور، يرجى التواصل مع إدارة الجامعة حالياً.
                </AppText>
                <AppText color="muted" variant="caption">
                  التسجيل الذاتي غير متاح حالياً من التطبيق.
                </AppText>
              </Stack>
            </AppCard>
          )}
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
  logo: {
    width: 180,
    maxWidth: '70%',
    height: 56,
  },
  authLinks: {
    alignItems: 'center',
  },
  authLink: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
});
