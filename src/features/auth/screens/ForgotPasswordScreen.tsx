import { useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AppButton, AppTextInput } from '../../../components';
import { useTranslation } from '../../../i18n';
import { PublicRoutes } from '../../../navigation/routes';
import type { PublicStackParamList } from '../../../navigation/types';
import { AuthScreen } from '../components';
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
    <AuthScreen
      footer={
        <AppButton
          disabled={isSubmitting}
          fullWidth
          loading={isSubmitting}
          onPress={() => void handleSubmit()}
          size="lg"
          title={t.auth.forgotPassword.submit}
        />
      }
      onBack={() => navigation.goBack()}
      subtitle={t.auth.forgotPassword.subtitle}
      title={t.auth.forgotPassword.title}
    >
      <AppTextInput
        autoCapitalize="none"
        autoComplete="email"
        autoCorrect={false}
        disabled={isSubmitting}
        error={errorMessage ?? undefined}
        helperText={t.auth.forgotPassword.cardSubtitle}
        keyboardType="email-address"
        label={t.auth.fields.email}
        onChangeText={(value) => {
          setEmail(value);
          setErrorMessage(null);
        }}
        placeholder={t.auth.fields.emailPlaceholder}
        textContentType="emailAddress"
        value={email}
      />
    </AuthScreen>
  );
}
