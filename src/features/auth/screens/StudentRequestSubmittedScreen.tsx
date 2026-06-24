import { useRef } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Animated, StyleSheet } from 'react-native';

import { images } from '../../../assets/images';
import { AppButton, AppScreen, AppText, Stack } from '../../../components';
import { Illustration } from '../../../components/media/Illustration';
import { PublicRoutes } from '../../../navigation/routes';
import type { PublicStackParamList } from '../../../navigation/types';
import { spacing } from '../../../theme';
import { createFadeInAnim, MOTION } from '../../../utils/motion';

type Props = NativeStackScreenProps<PublicStackParamList, 'StudentRequestSubmitted'>;

export function StudentRequestSubmittedScreen({ route, navigation }: Props) {
  const { requestId } = route.params || {};
  const fadeAnim = useRef(createFadeInAnim()).current;

  const contentAnim = fadeAnim;
  contentAnim.animate(MOTION.duration.slow).start();

  const showRequestId = requestId && requestId !== 'pending' && requestId !== 'unknown';

  return (
    <AppScreen contentContainerStyle={styles.content} scroll>
      <Animated.View style={{ opacity: contentAnim.opacity, flex: 1 }}>
        <Stack gap="xl" align="center" style={styles.centerStack}>
          <Illustration
            accessibilityLabel="تم الإرسال"
            size="md"
            source={images.illustrations.success}
          />

          <Stack gap="sm" align="center">
            <AppText variant="h2" align="center">
              تم إرسال طلبك بنجاح
            </AppText>
            <AppText color="secondary" align="center" variant="body">
              سنراجع بياناتك والبطاقة الجامعية. عند الموافقة، سيتم إرسال رمز التفعيل إليك عبر واتساب
              من الإدارة.
            </AppText>
          </Stack>

          {showRequestId ? (
            <AppText color="muted" variant="caption">
              رقم الطلب: {requestId}
            </AppText>
          ) : null}

          <Stack gap="md" style={styles.actions}>
            <AppButton
              fullWidth
              onPress={() =>
                navigation.replace(PublicRoutes.StudentRequestStatus, {
                  requestId: requestId && requestId !== 'pending' ? requestId : 'unknown',
                })
              }
              title="متابعة حالة الطلب"
            />
            <AppButton
              fullWidth
              variant="outline"
              onPress={() => navigation.navigate(PublicRoutes.Login)}
              title="العودة لتسجيل الدخول"
            />
          </Stack>
        </Stack>
      </Animated.View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: { paddingVertical: spacing.xl },
  centerStack: {
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.md,
  },
  actions: {
    width: '100%',
  },
});
