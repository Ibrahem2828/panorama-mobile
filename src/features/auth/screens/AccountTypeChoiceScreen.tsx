import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useRef } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';

import { images } from '../../../assets/images';
import { AppCard, AppScreen, AppText, Stack } from '../../../components';
import { Illustration } from '../../../components/media/Illustration';
import { PublicRoutes } from '../../../navigation/routes';
import type { PublicStackParamList } from '../../../navigation/types';
import { spacing } from '../../../theme';
import { createEntranceAnim, createPressScaleAnim, MOTION } from '../../../utils/motion';

type Navigation = NativeStackNavigationProp<PublicStackParamList>;

export function AccountTypeChoiceScreen() {
  const navigation = useNavigation<Navigation>();

  const studentAnim = useRef(createPressScaleAnim()).current;
  const normalAnim = useRef(createPressScaleAnim()).current;
  const headerAnim = useRef(createEntranceAnim(16)).current;
  headerAnim.animate(MOTION.duration.normal).start();

  return (
    <AppScreen contentContainerStyle={styles.content} scroll>
      <Stack gap="xl">
        <Animated.View
          style={{
            opacity: headerAnim.opacity,
            transform: [{ translateY: headerAnim.translateY }],
          }}
        >
          <Stack gap="lg" style={styles.header}>
            <Illustration
              accessibilityLabel="إنشاء حساب"
              size="lg"
              source={images.illustrations.universityBuilding}
            />
            <Stack gap="sm">
              <AppText variant="h1" align="center">
                إنشاء حساب جديد
              </AppText>
              <AppText color="secondary" align="center" variant="body">
                اختر نوع الحساب المناسب للمتابعة.
              </AppText>
            </Stack>
          </Stack>
        </Animated.View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="طالب في الجامعة"
          onPress={() => navigation.navigate(PublicRoutes.StudentAccountRequest)}
          onPressIn={studentAnim.onPressIn}
          onPressOut={studentAnim.onPressOut}
        >
          <Animated.View style={{ transform: [{ scale: studentAnim.scale }] }}>
            <AppCard variant="elevated" padding="lg">
              <Stack gap="sm">
                <Illustration
                  accessibilityLabel="طالب"
                  size="sm"
                  source={images.illustrations.studentMale}
                />
                <AppText variant="title">طالب في الجامعة</AppText>
                <AppText color="secondary" variant="bodySmall">
                  قدّم طلب إنشاء حساب طالب للوصول إلى المواد، المجموعات، الملفات، الطباعة والخدمات
                  الجامعية بعد مراجعة بياناتك.
                </AppText>
                <AppText color="brand" variant="button">
                  متابعة كطالب
                </AppText>
              </Stack>
            </AppCard>
          </Animated.View>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="مستخدم عادي"
          onPress={() => navigation.navigate(PublicRoutes.NormalUserRegister)}
          onPressIn={normalAnim.onPressIn}
          onPressOut={normalAnim.onPressOut}
        >
          <Animated.View style={{ transform: [{ scale: normalAnim.scale }] }}>
            <AppCard variant="elevated" padding="lg">
              <Stack gap="sm">
                <AppText variant="title">مستخدم عادي</AppText>
                <AppText color="secondary" variant="bodySmall">
                  أنشئ حساباً عاماً لاستخدام الخدمات المتاحة بعد التحقق من رقم الجوال.
                </AppText>
                <AppText color="brand" variant="button">
                  متابعة كمستخدم عادي
                </AppText>
              </Stack>
            </AppCard>
          </Animated.View>
        </Pressable>

        <Pressable onPress={() => navigation.goBack()} style={styles.backLink}>
          <AppText color="brand" variant="button">
            العودة لتسجيل الدخول
          </AppText>
        </Pressable>
      </Stack>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingVertical: spacing.xl,
    gap: spacing.xl,
  },
  header: {
    alignItems: 'center',
  },
  backLink: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
});
