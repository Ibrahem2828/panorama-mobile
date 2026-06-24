import { useCallback, useEffect, useRef, useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Animated, StyleSheet } from 'react-native';

import { images } from '../../../assets/images';
import { AppButton, AppCard, AppScreen, AppText, Stack } from '../../../components';
import { Illustration } from '../../../components/media/Illustration';
import { PublicRoutes } from '../../../navigation/routes';
import type { PublicStackParamList } from '../../../navigation/types';
import type { StudentAccountRequestStatus } from '../../../api/types';
import { spacing } from '../../../theme';
import { createEntranceAnim, createFadeInAnim } from '../../../utils/motion';
import { getStudentAccountRequestStatus, toSafeD1ErrorMessage } from '../services';

type Props = NativeStackScreenProps<PublicStackParamList, 'StudentRequestStatus'>;

type StatusInfo = {
  title: string;
  message: string;
  illustration?: typeof images.illustrations.success;
  ctaLabel?: string;
  ctaAction?: 'otp' | 'login' | null;
};

function getStatusInfo(
  status: StudentAccountRequestStatus,
  publicMessage?: string,
  rejectionReason?: string | null,
  needsUpdateReason?: string | null,
): StatusInfo {
  switch (status) {
    case 'pending_review':
      return {
        title: 'طلبك قيد المراجعة',
        message:
          'يقوم فريق الإدارة بمراجعة بياناتك والبطاقة الجامعية. سيتم إرسال رمز التفعيل بعد الموافقة.',
        illustration: images.illustrations.universityBuilding,
      };
    case 'approved_pending_otp':
    case 'otp_sent':
      return {
        title: 'تمت الموافقة على طلبك',
        message: 'أدخل رمز التفعيل الذي أرسلته الإدارة إلى رقم واتساب المسجل.',
        illustration: images.illustrations.success,
        ctaLabel: 'إدخال رمز التفعيل',
        ctaAction: 'otp',
      };
    case 'active':
      return {
        title: 'تم تفعيل حسابك',
        message: 'يمكنك الآن تسجيل الدخول إلى حسابك.',
        illustration: images.illustrations.success,
        ctaLabel: 'تسجيل الدخول',
        ctaAction: 'login',
      };
    case 'rejected':
      return {
        title: 'تم رفض الطلب',
        message: rejectionReason || publicMessage || 'للأسف، لم تتم الموافقة على طلبك.',
        illustration: images.illustrations.warning,
        ctaLabel: 'العودة لتسجيل الدخول',
        ctaAction: 'login',
      };
    case 'needs_update':
      return {
        title: 'يحتاج طلبك إلى تعديل',
        message:
          needsUpdateReason || publicMessage || 'يرجى التواصل مع الإدارة لمعرفة الخطوة التالية.',
        illustration: images.illustrations.warning,
        ctaLabel: 'العودة لتسجيل الدخول',
        ctaAction: 'login',
      };
    case 'expired':
      return {
        title: 'انتهت صلاحية الطلب',
        message: publicMessage || 'انتهت صلاحية طلبك. يمكنك تقديم طلب جديد.',
        illustration: images.illustrations.warning,
        ctaLabel: 'العودة لتسجيل الدخول',
        ctaAction: 'login',
      };
    default:
      return {
        title: 'حالة الطلب',
        message: publicMessage || 'يرجى المحاولة مرة أخرى أو التواصل مع الدعم.',
      };
  }
}

export function StudentRequestStatusScreen({ route, navigation }: Props) {
  const { requestId } = route.params;
  const [status, setStatus] = useState<StudentAccountRequestStatus | null>(null);
  const [publicMessage, setPublicMessage] = useState('');
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [needsUpdateReason, setNeedsUpdateReason] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const contentAnim = useRef(createEntranceAnim(12)).current;
  const refreshErrorAnim = useRef(createFadeInAnim()).current;

  const load = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      try {
        const res = await getStudentAccountRequestStatus(requestId);
        const s = res?.data?.status as StudentAccountRequestStatus | undefined;
        if (s) setStatus(s);
        setPublicMessage(res?.data?.public_message || '');
        setRejectionReason(res?.data?.rejection_reason ?? null);
        setNeedsUpdateReason(res?.data?.needs_update_reason ?? null);
        setLastChecked(new Date());
      } catch (e) {
        if (!isRefresh) setError(toSafeD1ErrorMessage(e));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [requestId],
  );

  useEffect(() => {
    void load(false);
  }, [load]);

  useEffect(() => {
    if (!loading && status) {
      contentAnim.animate().start();
    }
  }, [loading, status]);

  useEffect(() => {
    if (error) {
      refreshErrorAnim.animate().start();
    }
  }, [error]);

  function goToOtpIfAllowed() {
    if (status === 'approved_pending_otp' || status === 'otp_sent') {
      navigation.replace(PublicRoutes.StudentOtpVerification, { requestId });
    }
  }

  function formatLastChecked(date: Date): string {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  const info = status
    ? getStatusInfo(status, publicMessage, rejectionReason, needsUpdateReason)
    : null;

  if (loading) {
    return (
      <AppScreen contentContainerStyle={styles.content} scroll>
        <Stack gap="lg" align="center" style={styles.centerStack}>
          <AppText color="secondary">جاري تحميل حالة الطلب...</AppText>
        </Stack>
      </AppScreen>
    );
  }

  return (
    <AppScreen contentContainerStyle={styles.content} scroll>
      <Animated.View
        style={{
          opacity: contentAnim.opacity,
          transform: [{ translateY: contentAnim.translateY }],
        }}
      >
        <Stack gap="lg" align="center" style={styles.centerStack}>
          {info?.illustration ? (
            <Illustration accessibilityLabel={info.title} size="md" source={info.illustration} />
          ) : null}

          {status && info ? (
            <AppCard padding="lg" variant="elevated" style={styles.statusCard}>
              <Stack gap="md" align="center">
                <AppText variant="h2" align="center">
                  {info.title}
                </AppText>
                <AppText color="secondary" align="center" variant="body">
                  {info.message}
                </AppText>
              </Stack>
            </AppCard>
          ) : null}

          {!status && !loading ? (
            <AppCard padding="lg" variant="muted">
              <AppText align="center" color="secondary">
                تعذر العثور على حالة الطلب. يرجى التحقق من الرقم والمحاولة مرة أخرى.
              </AppText>
            </AppCard>
          ) : null}

          <Stack gap="md" style={styles.actions}>
            <AppButton
              loading={refreshing}
              onPress={() => load(true)}
              title="تحديث الحالة"
              variant="outline"
            />

            {info?.ctaAction === 'otp' && status ? (
              <AppButton
                fullWidth
                onPress={goToOtpIfAllowed}
                title={info.ctaLabel || 'إدخال رمز التفعيل'}
              />
            ) : null}

            {info?.ctaAction === 'login' ? (
              <AppButton
                fullWidth
                onPress={() => navigation.navigate(PublicRoutes.Login)}
                title={info.ctaLabel || 'تسجيل الدخول'}
              />
            ) : null}
          </Stack>

          {lastChecked ? (
            <AppText color="muted" variant="caption">
              آخر تحديث: {formatLastChecked(lastChecked)}
            </AppText>
          ) : null}

          {error ? (
            <Animated.View style={{ opacity: refreshErrorAnim.opacity }}>
              <AppText color="error" variant="caption" align="center">
                {error}
              </AppText>
            </Animated.View>
          ) : null}

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
  centerStack: {
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  statusCard: {
    width: '100%',
  },
  actions: {
    width: '100%',
  },
});
