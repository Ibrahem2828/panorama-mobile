import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StyleSheet } from 'react-native';

import { AppButton, AppCard, AppHeader, AppScreen, AppText, Stack } from '../../../components';
import { ProfileRoutes } from '../../../navigation/routes';
import type { ProfileStackParamList } from '../../../navigation/types';
import { spacing } from '../../../theme';
import { useAuthStore } from '../../auth/store';

type ProfileHomeNavigation = NativeStackNavigationProp<ProfileStackParamList, 'ProfileHome'>;

export function ProfileHomeScreen() {
  const navigation = useNavigation<ProfileHomeNavigation>();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const isSubmitting = useAuthStore((state) => state.isSubmitting);
  const displayName = user?.full_name ?? user?.username ?? 'مستخدم Panorama';
  const displayEmail = user?.email ?? user?.phone_number ?? 'لا توجد بيانات تواصل مؤكدة حاليا';

  return (
    <AppScreen contentContainerStyle={styles.content} scroll>
      <AppHeader subtitle="الحساب" title="حسابي" />
      <AppCard padding="lg" variant="default">
        <Stack gap="lg">
          <Stack gap="xs">
            <AppText variant="title">{displayName}</AppText>
            <AppText color="secondary" variant="bodySmall">
              {displayEmail}
            </AppText>
            {user?.role ? (
              <AppText color="muted" variant="caption">
                الدور: {user.role}
              </AppText>
            ) : null}
          </Stack>

          <AppText color="secondary" variant="body">
            هذه شاشة حساب مبسطة لاختبار جلسة الدخول والخروج فقط. تعديل الملف الشخصي والتوثيق سيتم
            تنفيذهما في مراحل لاحقة.
          </AppText>

          <AppButton
            fullWidth
            onPress={() => navigation.navigate(ProfileRoutes.Notifications)}
            title="الإشعارات"
            variant="outline"
          />

          <AppButton
            fullWidth
            loading={isSubmitting}
            onPress={() => {
              void logout();
            }}
            title="تسجيل الخروج"
            variant="danger"
          />
        </Stack>
      </AppCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
  },
});
