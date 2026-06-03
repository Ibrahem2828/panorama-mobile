import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet } from 'react-native';

import { AppButton, AppHeader, AppScreen, Stack } from '../../../components';
import type { ProfileStackParamList } from '../../../navigation/types';
import { spacing } from '../../../theme';
import { LegalContentBlock } from '../components';

type PrivacyPolicyScreenProps = NativeStackScreenProps<ProfileStackParamList, 'PrivacyPolicy'>;

const PRIVACY_BLOCKS = [
  {
    title: 'البيانات التي نستخدمها',
    paragraphs: [
      'يستخدم Panorama بيانات الحساب مثل الاسم واسم المستخدم ووسائل التواصل لتقديم تجربة حساب واضحة وآمنة.',
      'تستخدم البيانات الأكاديمية وحالة التوثيق وصورة بطاقة الطالب للتحقق من أهلية الوصول إلى الخدمات الأكاديمية.',
    ],
  },
  {
    title: 'الخدمات المرتبطة بالبيانات',
    paragraphs: [
      'قد يستخدم التطبيق بيانات الوصول إلى الملفات وطلبات الطباعة وتذاكر الدعم والإشعارات لتقديم خدمات Panorama ومتابعة حالاتها.',
      'لا يتم بيع بيانات المستخدمين. يستخدم التطبيق البيانات لتقديم الخدمات وتشغيلها وتحسين وضوح التجربة فقط.',
    ],
  },
  {
    title: 'الخصوصية داخل التطبيق',
    paragraphs: [
      'لا تعرض شاشة المعلومات الأكاديمية روابط صور التوثيق أو ملفات حساسة غير مطلوبة.',
      'الصلاحيات والبيانات المتاحة يحددها الخادم، والتطبيق يعرض ما يسمح به فقط للمستخدم الحالي.',
    ],
  },
];

export function PrivacyPolicyScreen({ navigation }: PrivacyPolicyScreenProps) {
  return (
    <AppScreen contentContainerStyle={styles.content} scroll>
      <Stack gap="xl">
        <Stack gap="md">
          <AppHeader subtitle="بيان خصوصية مختصر لنسخة MVP" title="سياسة الخصوصية" />
          <AppButton onPress={() => navigation.goBack()} title="رجوع" variant="ghost" />
        </Stack>

        {PRIVACY_BLOCKS.map((block) => (
          <LegalContentBlock key={block.title} paragraphs={block.paragraphs} title={block.title} />
        ))}
      </Stack>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
  },
});
