import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet } from 'react-native';

import { AppButton, AppHeader, AppScreen, Stack } from '../../../components';
import type { ProfileStackParamList } from '../../../navigation/types';
import { spacing } from '../../../theme';
import { LegalContentBlock } from '../components';

type TermsScreenProps = NativeStackScreenProps<ProfileStackParamList, 'Terms'>;

const TERMS_BLOCKS = [
  {
    title: 'الاستخدام المقبول',
    paragraphs: [
      'يستخدم Panorama للوصول إلى الخدمات الأكاديمية والملفات والغروبات والطباعة والدعم بطريقة مسؤولة.',
      'يمنع إساءة استخدام الملفات أو الغروبات أو تذاكر الدعم أو محاولة الوصول إلى بيانات لا تخص الحساب الحالي.',
    ],
  },
  {
    title: 'الصلاحيات والخادم',
    paragraphs: [
      'الخادم هو مصدر الحقيقة للصلاحيات وحالة التوثيق وإتاحة الملفات والخدمات.',
      'قد تختلف الخدمات المتاحة حسب حالة الحساب والتوثيق والبيانات الأكاديمية.',
    ],
  },
  {
    title: 'المسؤولية',
    paragraphs: [
      'المستخدم مسؤول عن الحفاظ على سرية كلمة المرور ومراجعة طلبات الطباعة قبل إرسالها.',
      'يجب استخدام الدعم الفني لتقديم معلومات صحيحة تساعد الفريق على معالجة المشكلة.',
    ],
  },
];

export function TermsScreen({ navigation }: TermsScreenProps) {
  return (
    <AppScreen contentContainerStyle={styles.content} scroll>
      <Stack gap="xl">
        <Stack gap="md">
          <AppHeader subtitle="شروط استخدام مختصرة لنسخة MVP" title="الشروط والأحكام" />
          <AppButton onPress={() => navigation.goBack()} title="رجوع" variant="ghost" />
        </Stack>

        {TERMS_BLOCKS.map((block) => (
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
