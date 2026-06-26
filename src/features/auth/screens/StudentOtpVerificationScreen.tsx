import { useEffect, useRef, useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Animated, StyleSheet } from 'react-native';

import { images } from '../../../assets/images';
import { AppButton, AppScreen, AppText, Stack } from '../../../components';
import { Illustration } from '../../../components/media/Illustration';
import { LoadingState } from '../../../components/feedback/LoadingState';
import { OtpCodeInput } from '../../../components/forms/OtpCodeInput';
import { PublicRoutes } from '../../../navigation/routes';
import type { PublicStackParamList } from '../../../navigation/types';
import type { StudentAccountRequestStatus } from '../../../api/types';
import { spacing } from '../../../theme';
import { createFadeInAnim, MOTION } from '../../../utils/motion';
import { AuthFormCard } from '../components';
import {
  getStudentAccountRequestStatus,
  toSafeD1ErrorMessage,
  verifyStudentAccountOtp,
} from '../services';

type Props = NativeStackScreenProps<PublicStackParamList, 'StudentOtpVerification'>;

const NOT_APPROVED = 'لم تتم الموافقة على طلبك بعد. لا يمكن إدخال رمز التفعيل حالياً.';

export function StudentOtpVerificationScreen({ route, navigation }: Props) {
  const { requestId } = route.params;
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  const successAnim = useRef(createFadeInAnim()).current;

  const canSubmit = code.trim().length === 6 && !loading && !success && allowed;

  useEffect(() => {
    let mounted = true;
    async function checkAccess() {
      try {
        const res = await getStudentAccountRequestStatus(requestId);
        const status = res?.data?.status as StudentAccountRequestStatus | undefined;
        const canEnter = res?.data?.can_enter_otp === true;
        if (mounted) {
          setAllowed(status === 'approved_pending_otp' || status === 'otp_sent' || canEnter);
        }
      } catch {
        if (mounted) setAllowed(false);
      } finally {
        if (mounted) setInitialLoading(false);
      }
    }
    void checkAccess();
    return () => {
      mounted = false;
    };
  }, [requestId]);

  async function handleVerifyWithCode(verifyCode: string) {
    const trimmed = verifyCode.trim();
    if (trimmed.length !== 6) return;
    setLoading(true);
    setError(null);
    try {
      await verifyStudentAccountOtp(requestId, { code: trimmed });
      setSuccess(true);
      successAnim.animate(MOTION.duration.slow).start();
      setTimeout(() => {
        navigation.reset({ index: 0, routes: [{ name: PublicRoutes.Login }] });
      }, 2000);
    } catch (e) {
      setError(toSafeD1ErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    await handleVerifyWithCode(code);
  }

  if (initialLoading) {
    return (
      <AppScreen>
        <LoadingState centered message="جاري التحقق من حالة الطلب..." />
      </AppScreen>
    );
  }

  if (!allowed) {
    return (
      <AppScreen contentContainerStyle={styles.content} scroll>
        <Stack gap="xl" align="center" style={styles.centerStack}>
          <Illustration
            accessibilityLabel="غير مصرح"
            size="md"
            source={images.illustrations.warning}
          />
          <Stack gap="sm" align="center">
            <AppText variant="h2" align="center">
              رمز التفعيل غير متاح
            </AppText>
            <AppText color="secondary" align="center" variant="body">
              {NOT_APPROVED}
            </AppText>
          </Stack>
          <AppButton onPress={() => navigation.goBack()} title="رجوع" variant="outline" />
        </Stack>
      </AppScreen>
    );
  }

  if (success) {
    return (
      <AppScreen contentContainerStyle={styles.content} scroll>
        <Animated.View style={{ opacity: successAnim.opacity, flex: 1 }}>
          <Stack gap="xl" align="center" style={styles.centerStack}>
            <Illustration
              accessibilityLabel="تم التفعيل"
              size="md"
              source={images.illustrations.success}
            />
            <Stack gap="sm" align="center">
              <AppText variant="h2" align="center">
                تم تفعيل حساب الطالب بنجاح
              </AppText>
              <AppText color="secondary" align="center" variant="body">
                يمكنك تسجيل الدخول الآن.
              </AppText>
            </Stack>
            <AppButton
              fullWidth
              onPress={() => navigation.reset({ index: 0, routes: [{ name: PublicRoutes.Login }] })}
              title="تسجيل الدخول"
            />
          </Stack>
        </Animated.View>
      </AppScreen>
    );
  }

  return (
    <AppScreen contentContainerStyle={styles.content} scroll>
      <Stack gap="lg" align="center">
        <Illustration
          accessibilityLabel="تفعيل الحساب"
          size="sm"
          source={images.illustrations.universityBuilding}
        />

        <AuthFormCard
          title="إدخال رمز التفعيل"
          subtitle="أدخل رمز التفعيل الذي أرسلته الإدارة إلى رقم واتساب المسجل."
        >
          <Stack gap="md">
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
              loading={loading}
              autoFocus
            />

            <AppButton
              fullWidth
              disabled={!canSubmit}
              loading={loading}
              onPress={handleVerify}
              title="تحقق من الرمز"
            />
          </Stack>
        </AuthFormCard>

        <AppButton onPress={() => navigation.goBack()} title="رجوع" variant="ghost" />
      </Stack>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: { paddingVertical: spacing.lg },
  centerStack: {
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.md,
  },
});
