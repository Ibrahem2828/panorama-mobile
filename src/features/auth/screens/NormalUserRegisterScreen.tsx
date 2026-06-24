import { useRef, useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Animated, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';

import { AppButton, AppScreen, AppText, AppTextInput, Stack } from '../../../components';
import { PublicRoutes } from '../../../navigation/routes';
import type { PublicStackParamList } from '../../../navigation/types';
import { spacing } from '../../../theme';
import { createEntranceAnim, MOTION } from '../../../utils/motion';
import { AuthFormCard, PasswordInput } from '../components';
import { registerNormalUser, toSafeD1ErrorMessage } from '../services';
import {
  isValidEmail,
  isValidPhoneNumber,
  normalizePhoneNumber,
  validatePasswordPair,
} from '../utils/authFormValidation';

type Props = NativeStackScreenProps<PublicStackParamList, 'NormalUserRegister'>;

type FormErrors = {
  fullName?: string;
  email?: string;
  phone?: string;
  password?: string;
  passwordConfirm?: string;
};

export function NormalUserRegisterScreen({ navigation }: Props) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cardAnim = useRef(createEntranceAnim(12)).current;
  cardAnim.animate(MOTION.duration.slow).start();

  const displayedError = validationMessage ?? errorMessage;

  function clearErrors() {
    setValidationMessage(null);
    setErrorMessage(null);
    setFieldErrors({});
  }

  function validate(): FormErrors {
    const errors: FormErrors = {};
    const name = fullName.trim();
    const em = email.trim();
    const phone = normalizePhoneNumber(phoneNumber);
    const passErr = validatePasswordPair(password, passwordConfirm);

    if (!name) errors.fullName = 'يرجى إدخال الاسم الكامل.';
    if (!em) errors.email = 'يرجى إدخال البريد الإلكتروني.';
    else if (!isValidEmail(em)) errors.email = 'يرجى إدخال بريد إلكتروني صحيح.';
    if (!phone) errors.phone = 'يرجى إدخال رقم الجوال.';
    else if (!isValidPhoneNumber(phone)) errors.phone = 'يرجى إدخال رقم جوال صحيح.';
    if (!password) errors.password = 'يرجى إدخال كلمة المرور.';
    if (!passwordConfirm) errors.passwordConfirm = 'يرجى تأكيد كلمة المرور.';
    if (password && passwordConfirm && passErr) {
      errors.passwordConfirm = passErr;
    }
    return errors;
  }

  function hasErrors(errors: FormErrors): boolean {
    return Object.keys(errors).length > 0;
  }

  async function handleSubmit() {
    if (isSubmitting) return;
    clearErrors();
    const errors = validate();
    if (hasErrors(errors)) {
      setFieldErrors(errors);
      return;
    }
    setIsSubmitting(true);
    try {
      await registerNormalUser({
        full_name: fullName.trim(),
        email: email.trim(),
        phone_number: normalizePhoneNumber(phoneNumber),
        password,
        password_confirm: passwordConfirm,
      });
      navigation.replace(PublicRoutes.PhoneOtpVerification, {
        phoneNumber: normalizePhoneNumber(phoneNumber),
        otpPurpose: 'verify_phone',
        source: 'normal_register',
      });
    } catch (err) {
      setErrorMessage(toSafeD1ErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AppScreen contentContainerStyle={styles.content} scroll>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboard}
      >
        <Stack gap="lg">
          <Animated.View
            style={{
              opacity: cardAnim.opacity,
              transform: [{ translateY: cardAnim.translateY }],
            }}
          >
            <AuthFormCard
              title="إنشاء حساب مستخدم عادي"
              subtitle="سيتم التحقق من رقم الجوال برمز التحقق."
            >
              <Stack gap="md">
                <AppTextInput
                  label="الاسم الكامل"
                  value={fullName}
                  onChangeText={(v) => {
                    setFullName(v);
                    setFieldErrors((prev) => ({ ...prev, fullName: undefined }));
                  }}
                  autoCapitalize="words"
                  disabled={isSubmitting}
                  error={fieldErrors.fullName}
                />
                <AppTextInput
                  label="البريد الإلكتروني"
                  value={email}
                  onChangeText={(v) => {
                    setEmail(v);
                    setFieldErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  disabled={isSubmitting}
                  error={fieldErrors.email}
                />
                <AppTextInput
                  label="رقم الجوال"
                  value={phoneNumber}
                  onChangeText={(v) => {
                    setPhoneNumber(v);
                    setFieldErrors((prev) => ({ ...prev, phone: undefined }));
                  }}
                  keyboardType="phone-pad"
                  disabled={isSubmitting}
                  error={fieldErrors.phone}
                />
                <PasswordInput
                  value={password}
                  onChangeText={(v) => {
                    setPassword(v);
                    setFieldErrors((prev) => ({ ...prev, password: undefined }));
                  }}
                  disabled={isSubmitting}
                  error={fieldErrors.password}
                />
                <AppTextInput
                  label="تأكيد كلمة المرور"
                  value={passwordConfirm}
                  onChangeText={(v) => {
                    setPasswordConfirm(v);
                    setFieldErrors((prev) => ({ ...prev, passwordConfirm: undefined }));
                  }}
                  secureTextEntry
                  disabled={isSubmitting}
                  error={fieldErrors.passwordConfirm}
                />

                {displayedError ? (
                  <AppText color="error" variant="bodySmall">
                    {displayedError}
                  </AppText>
                ) : null}

                <AppButton
                  fullWidth
                  loading={isSubmitting}
                  disabled={isSubmitting}
                  onPress={handleSubmit}
                  title="إنشاء الحساب"
                />
              </Stack>
            </AuthFormCard>
          </Animated.View>

          <AppText
            align="center"
            color="muted"
            variant="caption"
            onPress={() => navigation.goBack()}
          >
            العودة
          </AppText>
        </Stack>
      </KeyboardAvoidingView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: { paddingVertical: spacing.lg },
  keyboard: { flex: 1 },
});
