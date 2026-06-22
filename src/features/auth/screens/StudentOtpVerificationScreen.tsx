import { useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet } from 'react-native';

import { AppButton, AppScreen, AppText, Stack } from '../../../components';
import { OtpCodeInput } from '../../../components/forms/OtpCodeInput';
import { PublicRoutes } from '../../../navigation/routes';
import type { PublicStackParamList } from '../../../navigation/types';
import { spacing } from '../../../theme';
import { verifyStudentAccountOtp, toSafeD1ErrorMessage } from '../services';

type Props = NativeStackScreenProps<PublicStackParamList, 'StudentOtpVerification'>;

export function StudentOtpVerificationScreen({ route, navigation }: Props) {
  const { requestId } = route.params;
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleVerifyWithCode(verifyCode: string) {
    const trimmed = verifyCode.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    try {
      await verifyStudentAccountOtp(requestId, { code: trimmed });
      setSuccess(true);
    } catch (e) {
      setError(toSafeD1ErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    await handleVerifyWithCode(code);
  }

  if (success) {
    return (
      <AppScreen>
        <Stack gap="lg" align="center">
          <AppText variant="h1">تم تفعيل حسابك بنجاح</AppText>
          <AppButton onPress={() => navigation.navigate(PublicRoutes.Login)} title="تسجيل الدخول" />
        </Stack>
      </AppScreen>
    );
  }

  return (
    <AppScreen contentContainerStyle={styles.content} scroll>
      <Stack gap="lg">
        <AppText variant="h1">إدخال رمز التفعيل</AppText>
        <OtpCodeInput
          value={code}
          onChange={setCode}
          onComplete={(completed) => {
            if (completed.length === 6 && !loading) {
              setCode(completed);
              setTimeout(() => {
                handleVerifyWithCode(completed);
              }, 50);
            }
          }}
          error={error}
          disabled={loading}
          autoFocus
        />
        {error && <AppText color="error">{error}</AppText>}
        <AppButton loading={loading} onPress={handleVerify} title="تأكيد" />
        <AppButton onPress={() => navigation.goBack()} title="رجوع" variant="ghost" />
      </Stack>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: { paddingVertical: spacing.lg },
});
