import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet } from 'react-native';

import { AppButton, AppHeader, AppScreen, Stack } from '../../../components';
import { ProfileRoutes } from '../../../navigation/routes';
import type { ProfileStackParamList } from '../../../navigation/types';
import { spacing } from '../../../theme';
import { SettingsOptionRow, SettingsSection } from '../components';

type SettingsScreenProps = NativeStackScreenProps<ProfileStackParamList, 'Settings'>;

export function SettingsScreen({ navigation }: SettingsScreenProps) {
  return (
    <AppScreen contentContainerStyle={styles.content} scroll>
      <Stack gap="xl">
        <Stack gap="md">
          <AppHeader subtitle="إعدادات الحساب والتطبيق" title="الإعدادات" />
          <AppButton onPress={() => navigation.goBack()} title="رجوع" variant="ghost" />
        </Stack>

        <SettingsSection subtitle="إجراءات الأمان الخاصة بالحساب الحالي" title="الحساب والأمان">
          <SettingsOptionRow
            description="تحديث كلمة المرور من خلال الخادم"
            onPress={() => navigation.navigate(ProfileRoutes.ChangePassword)}
            title="تغيير كلمة المرور"
          />
        </SettingsSection>

        <SettingsSection subtitle="إعدادات التطبيق المتاحة في MVP" title="التطبيق">
          <SettingsOptionRow
            description="فتح مركز الإشعارات داخل التطبيق"
            onPress={() => navigation.navigate(ProfileRoutes.Notifications)}
            title="الإشعارات"
          />
          <SettingsOptionRow
            description="سيتم دعم الوضع الليلي لاحقا عند توفر نطاقه"
            disabled
            title="الوضع الليلي"
            value="لاحقا"
          />
          <SettingsOptionRow
            description="التطبيق عربي وRTL في هذه النسخة"
            disabled
            title="اللغة"
            value="العربية"
          />
        </SettingsSection>

        <SettingsSection subtitle="معلومات قانونية ثابتة لهذه النسخة" title="قانوني">
          <SettingsOptionRow
            onPress={() => navigation.navigate(ProfileRoutes.PrivacyPolicy)}
            title="سياسة الخصوصية"
          />
          <SettingsOptionRow
            onPress={() => navigation.navigate(ProfileRoutes.Terms)}
            title="الشروط والأحكام"
          />
          <SettingsOptionRow
            onPress={() => navigation.navigate(ProfileRoutes.About)}
            title="عن بانوراما"
          />
        </SettingsSection>
      </Stack>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
  },
});
