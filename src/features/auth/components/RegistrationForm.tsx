import { useState } from 'react';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Pressable, StyleSheet } from 'react-native';

import { normalizeApiError } from '../../../api';
import { AppButton, AppText, AppTextInput, FormAlert, Stack } from '../../../components';
import { useTranslation } from '../../../i18n';
import { PublicRoutes } from '../../../navigation/routes';
import type { PublicStackParamList } from '../../../navigation/types';
import { spacing } from '../../../theme';
import { useRegistrationConsent } from '../hooks/useRegistrationConsent';
import {
  registerNormalUser,
  registerStudentAccount,
  toSafeRegistrationErrorMessage,
} from '../services';
import {
  normalizePhoneNumber,
  validateRegistrationFields,
  type RegistrationField,
  type RegistrationFieldErrors,
} from '../utils/authFormValidation';
import { AuthScreen } from './AuthScreen';
import { ConsentSection } from './ConsentSection';
import { PasswordInput } from './PasswordInput';
import { PhoneInputWithCountryCode } from './PhoneInputWithCountryCode';

type RegistrationFormProps = {
  variant: 'student' | 'normal';
  navigation: Pick<
    NativeStackNavigationProp<PublicStackParamList>,
    'goBack' | 'navigate' | 'replace'
  >;
};

/** One form for both account types; the student form adds the university number. */
export function RegistrationForm({ variant, navigation }: RegistrationFormProps) {
  const { t } = useTranslation();
  const isStudent = variant === 'student';
  const copy = isStudent ? t.auth.registerStudent : t.auth.registerNormal;
  const consent = useRegistrationConsent();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [studentNumber, setStudentNumber] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [fieldErrors, setFieldErrors] = useState<RegistrationFieldErrors>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function bind(field: RegistrationField, setter: (value: string) => void) {
    return (value: string) => {
      setter(value);
      setFieldErrors((current) => ({ ...current, [field]: undefined }));
      setErrorMessage(null);
    };
  }

  async function handleSubmit() {
    const errors = validateRegistrationFields(
      {
        fullName,
        email: email.trim().toLowerCase(),
        phone: phoneNumber,
        studentNumber,
        password,
        passwordConfirm,
      },
      t.auth.validation,
      { requireStudentNumber: isStudent },
    );
    const consentOk = consent.validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0 || !consentOk) return;

    const mail = email.trim().toLowerCase();
    const base = {
      full_name: fullName.trim(),
      email: mail,
      phone_number: normalizePhoneNumber(phoneNumber),
      password,
      password_confirm: passwordConfirm,
      otp_channel: 'email' as const,
      ...consent.body(),
    };

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const response = isStudent
        ? await registerStudentAccount({ ...base, student_number: studentNumber.trim() })
        : await registerNormalUser(base);
      navigation.replace(PublicRoutes.OtpVerification, {
        identifier: response.user.email ?? mail,
        channel: response.otp_channel,
        source: isStudent ? 'student_register' : 'normal_register',
      });
    } catch (error) {
      const normalized = normalizeApiError(error);
      const fields = normalized.fieldErrors ?? {};
      if ('accept_terms_version' in fields || 'accept_privacy_version' in fields) {
        // A newer version was published while the form was open: reload what to accept.
        consent.refresh();
      }
      setErrorMessage(toSafeRegistrationErrorMessage(error, t.auth.errors));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthScreen
      after={
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate(PublicRoutes.Login)}
          style={styles.link}
        >
          <AppText align="center" color="brand" variant="button">
            {t.auth.registerStudent.haveAccount}
          </AppText>
        </Pressable>
      }
      footer={
        <AppButton
          disabled={isSubmitting || consent.isLoading || consent.loadFailed}
          fullWidth
          loading={isSubmitting}
          onPress={() => void handleSubmit()}
          size="lg"
          title={copy.submit}
        />
      }
      onBack={() => navigation.goBack()}
      subtitle={copy.subtitle}
      title={copy.title}
    >
      {errorMessage ? <FormAlert message={errorMessage} /> : null}
      <AppTextInput
        autoComplete="name"
        disabled={isSubmitting}
        error={fieldErrors.fullName}
        label={t.auth.fields.fullName}
        onChangeText={bind('fullName', setFullName)}
        textContentType="name"
        value={fullName}
      />
      <AppTextInput
        autoCapitalize="none"
        autoComplete="email"
        autoCorrect={false}
        disabled={isSubmitting}
        error={fieldErrors.email}
        keyboardType="email-address"
        label={t.auth.fields.email}
        onChangeText={bind('email', setEmail)}
        placeholder={t.auth.fields.emailPlaceholder}
        textContentType="emailAddress"
        value={email}
      />
      <PhoneInputWithCountryCode
        disabled={isSubmitting}
        error={fieldErrors.phone}
        label={t.auth.fields.phone}
        onChangeText={bind('phone', setPhoneNumber)}
        value={phoneNumber}
      />
      {isStudent ? (
        <AppTextInput
          autoCorrect={false}
          disabled={isSubmitting}
          error={fieldErrors.studentNumber}
          helperText={t.auth.fields.studentNumberHelper}
          keyboardType="number-pad"
          label={t.auth.fields.studentNumber}
          onChangeText={bind('studentNumber', setStudentNumber)}
          value={studentNumber}
        />
      ) : null}
      <PasswordInput
        autoComplete="new-password"
        disabled={isSubmitting}
        error={fieldErrors.password}
        helperText={t.auth.fields.passwordHint}
        onChangeText={bind('password', setPassword)}
        value={password}
      />
      <PasswordInput
        autoComplete="new-password"
        disabled={isSubmitting}
        error={fieldErrors.passwordConfirm}
        label={t.auth.fields.passwordConfirm}
        onChangeText={bind('passwordConfirm', setPasswordConfirm)}
        placeholder={t.auth.fields.passwordConfirmPlaceholder}
        value={passwordConfirm}
      />
      <Stack gap="sm">
        <ConsentSection consent={consent} disabled={isSubmitting} />
      </Stack>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  link: { minHeight: 44, justifyContent: 'center', paddingHorizontal: spacing.sm },
});
