import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Pressable, StyleSheet } from 'react-native';

import { images } from '../../../assets/images';
import { AppCard, AppScreen, AppText, Stack } from '../../../components';
import { Illustration } from '../../../components/media/Illustration';
import { PublicRoutes } from '../../../navigation/routes';
import type { PublicStackParamList } from '../../../navigation/types';
import { spacing } from '../../../theme';

type Navigation = NativeStackNavigationProp<PublicStackParamList>;

export function AccountTypeChoiceScreen() {
  const navigation = useNavigation<Navigation>();
  return (
    <AppScreen contentContainerStyle={styles.content} scroll>
      <Stack gap="xl">
        <Stack align="center" gap="md">
          <Illustration
            accessibilityLabel="إنشاء حساب"
            size="lg"
            source={images.illustrations.universityBuilding}
          />
          <AppText align="center" variant="h1">
            اختر نوع الحساب
          </AppText>
          <AppText align="center" color="secondary" variant="body">
            يمكن ترقية حساب الطالب بعد استكمال الملف الأكاديمي والتوثيق.
          </AppText>
        </Stack>

        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate(PublicRoutes.RegisterStudent)}
        >
          <AppCard padding="lg" variant="elevated">
            <Stack gap="sm">
              <Illustration
                accessibilityLabel="طالب"
                size="sm"
                source={images.illustrations.studentMale}
              />
              <AppText variant="title">حساب طالب</AppText>
              <AppText color="secondary" variant="bodySmall">
                للوصول إلى المواد والمجموعات والملفات الأكاديمية بعد التوثيق.
              </AppText>
              <AppText color="brand" variant="button">
                متابعة كطالب
              </AppText>
            </Stack>
          </AppCard>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate(PublicRoutes.NormalUserRegister)}
        >
          <AppCard padding="lg" variant="elevated">
            <Stack gap="sm">
              <Illustration
                accessibilityLabel="مستخدم عادي"
                size="sm"
                source={images.illustrations.studyDesk}
              />
              <AppText variant="title">حساب مستخدم عادي</AppText>
              <AppText color="secondary" variant="bodySmall">
                للخدمات العامة والطباعة والدعم بحسب الصلاحيات المتاحة.
              </AppText>
              <AppText color="brand" variant="button">
                متابعة كمستخدم عادي
              </AppText>
            </Stack>
          </AppCard>
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
  content: { paddingVertical: spacing.xl, gap: spacing.xl },
  backLink: { alignItems: 'center', paddingVertical: spacing.md },
});
