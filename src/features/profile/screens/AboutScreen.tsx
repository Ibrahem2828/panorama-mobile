import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Constants from 'expo-constants';
import { StyleSheet } from 'react-native';

import { AppCard, AppHeader, AppScreen, AppText, Stack } from '../../../components';
import type { ProfileStackParamList } from '../../../navigation/types';
import { spacing } from '../../../theme';
import { LegalContentBlock } from '../components';

type AboutScreenProps = NativeStackScreenProps<ProfileStackParamList, 'About'>;

export function AboutScreen(_props: AboutScreenProps) {
  const appVersion = Constants.expoConfig?.version ?? 'غير متاح';

  return (
    <AppScreen contentContainerStyle={styles.content} scroll>
      <Stack gap="xl">
        <AppHeader subtitle="معلومات التطبيق" title="عن بانوراما" />

        <AppCard padding="lg" variant="elevated">
          <Stack gap="sm">
            <AppText variant="h2">Panorama</AppText>
            <AppText color="secondary" variant="bodySmall">
              الإصدار {appVersion}
            </AppText>
          </Stack>
        </AppCard>

        <LegalContentBlock
          paragraphs={[
            'Panorama تطبيق طلابي عربي وRTL يجمع المواد والمجموعات والملفات والطباعة والإشعارات والدعم في تجربة واحدة منظمة.',
            'يركز التطبيق على خدمات الطالب الأكاديمية اليومية، مع إبقاء الصلاحيات والبيانات التشغيلية خاضعة للخادم.',
            'هذه نسخة MVP مخصصة للوصول العملي والواضح إلى الخدمات الأساسية دون وعود تشغيلية مبالغ فيها.',
          ]}
          title="الغرض من التطبيق"
        />
      </Stack>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
  },
});
