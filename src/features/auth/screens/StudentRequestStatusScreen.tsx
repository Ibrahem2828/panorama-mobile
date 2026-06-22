import { useEffect, useRef, useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Animated, StyleSheet } from 'react-native';

import { AppButton, AppScreen, AppText, Stack } from '../../../components';
import { PublicRoutes } from '../../../navigation/routes';
import type { PublicStackParamList } from '../../../navigation/types';
import type { StudentAccountRequestStatus } from '../../../api/types';
import { spacing } from '../../../theme';
import { createEntranceAnim } from '../../../utils/motion';
import { getStudentAccountRequestStatus, toSafeD1ErrorMessage } from '../services';

type Props = NativeStackScreenProps<PublicStackParamList, 'StudentRequestStatus'>;

export function StudentRequestStatusScreen({ route, navigation }: Props) {
  const { requestId } = route.params;
  const [status, setStatus] = useState<StudentAccountRequestStatus | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await getStudentAccountRequestStatus(requestId);
      const s = res?.data?.status as StudentAccountRequestStatus | undefined;
      setStatus(s || null);
      setMessage(res?.data?.public_message || '');
    } catch (e) {
      setError(toSafeD1ErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [requestId]);

  function goToOtpIfAllowed() {
    if (status === 'approved_pending_otp' || status === 'otp_sent') {
      navigation.replace(PublicRoutes.StudentOtpVerification, { requestId });
    }
  }

  const contentAnim = useRef(createEntranceAnim(8)).current;

  useEffect(() => {
    if (!loading && status) {
      contentAnim.animate().start();
    }
  }, [loading, status]);

  return (
    <AppScreen contentContainerStyle={styles.content} scroll>
      <Animated.View
        style={{
          opacity: contentAnim.opacity,
          transform: [{ translateY: contentAnim.translateY }],
        }}
      >
        <Stack gap="lg">
          <AppText variant="h1">حالة الطلب</AppText>
          {loading && <AppText>جاري التحميل...</AppText>}
          {error && <AppText color="error">{error}</AppText>}
          {status && (
            <Stack gap="sm">
              {status === 'pending_review' && (
                <Stack gap="xs">
                  <AppText variant="title">طلبك قيد المراجعة</AppText>
                  <AppText color="secondary">
                    يقوم فريق الإدارة بمراجعة بياناتك والبطاقة الجامعية. سيتم إرسال رمز التفعيل بعد
                    الموافقة.
                  </AppText>
                </Stack>
              )}
              {(status === 'approved_pending_otp' || status === 'otp_sent') && (
                <Stack gap="xs">
                  <AppText variant="title">تمت الموافقة على طلبك</AppText>
                  <AppText color="secondary">
                    أدخل رمز التفعيل الذي أرسلته الإدارة إلى رقم واتساب المسجل.
                  </AppText>
                </Stack>
              )}
              {status === 'active' && (
                <Stack gap="xs">
                  <AppText variant="title">تم تفعيل حسابك</AppText>
                  <AppText color="secondary">يمكنك الآن تسجيل الدخول إلى حسابك.</AppText>
                </Stack>
              )}
              {status === 'rejected' && (
                <Stack gap="xs">
                  <AppText variant="title">تم رفض الطلب</AppText>
                  {message ? <AppText color="error">{message}</AppText> : null}
                </Stack>
              )}
              {status === 'needs_update' && (
                <Stack gap="xs">
                  <AppText variant="title">يحتاج طلبك إلى تعديل</AppText>
                  {message ? (
                    <AppText color="secondary">{message}</AppText>
                  ) : (
                    <AppText color="secondary">
                      يرجى التواصل مع الإدارة لمعرفة الخطوة التالية.
                    </AppText>
                  )}
                </Stack>
              )}
              {status === 'expired' && (
                <Stack gap="xs">
                  <AppText variant="title">انتهت صلاحية الطلب</AppText>
                </Stack>
              )}
            </Stack>
          )}
          <AppButton onPress={load} title="تحديث الحالة" variant="outline" />
          {(status === 'approved_pending_otp' || status === 'otp_sent') && (
            <AppButton onPress={goToOtpIfAllowed} title="إدخال رمز التفعيل" />
          )}
          {status === 'active' && (
            <AppButton
              onPress={() => navigation.navigate(PublicRoutes.Login)}
              title="تسجيل الدخول"
            />
          )}
          <AppButton
            onPress={() => navigation.navigate(PublicRoutes.Login)}
            title="العودة لتسجيل الدخول"
            variant="ghost"
          />
        </Stack>
      </Animated.View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: { paddingVertical: spacing.lg },
});
