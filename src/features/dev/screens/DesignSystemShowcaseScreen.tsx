import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  AppAvatar,
  AppBadge,
  AppButton,
  AppCard,
  AppHeader,
  AppIconButton,
  AppScreen,
  AppText,
  AppTextInput,
  Divider,
  Stack,
  SuccessState,
} from '../../../components';
import { ar } from '../../../i18n';
import { spacing } from '../../../theme';

export function DesignSystemShowcaseScreen() {
  const [studentName, setStudentName] = useState('');

  return (
    <AppScreen contentContainerStyle={styles.content} scroll>
      <AppHeader
        rightAction={
          <AppIconButton
            accessibilityLabel="معلومات نظام التصميم"
            icon={
              <AppText align="center" color="brand" variant="title">
                i
              </AppText>
            }
            shape="circle"
            variant="surface"
          />
        }
        subtitle={ar.phase.designSystemSubtitle}
        title={ar.appName}
      />

      <Stack gap="lg">
        <AppCard padding="lg" variant="elevated">
          <Stack gap="lg">
            <View style={styles.identityRow}>
              <AppAvatar name={ar.appName} size="lg" />
              <View style={styles.identityText}>
                <AppText variant="display">{ar.appName}</AppText>
                <AppText color="secondary" variant="subtitle">
                  {ar.appNameEn} - {ar.phase.designSystem}
                </AppText>
              </View>
            </View>

            <Divider space="sm" />

            <Stack direction="horizontal" gap="sm" wrap>
              <AppBadge label="RTL-first" variant="brand" />
              <AppBadge label="Accessible" variant="success" />
              <AppBadge label="Tokens" variant="info" />
            </Stack>

            <AppText color="secondary" variant="body">
              هذه شاشة عرض تأسيسية فقط لمعاينة التوكنز والمكونات المشتركة قبل بناء الشاشات الفعلية.
            </AppText>
          </Stack>
        </AppCard>

        <AppCard padding="lg" variant="default">
          <Stack gap="md">
            <AppText variant="title">أزرار وحقل إدخال</AppText>
            <AppTextInput
              helperText="مثال بصري فقط بدون ربط API أو نموذج حقيقي."
              label="اسم الطالب"
              onChangeText={setStudentName}
              placeholder="اكتب الاسم"
              value={studentName}
            />
            <Stack direction="horizontal" gap="sm" wrap>
              <AppButton title="زر أساسي" />
              <AppButton title="زر ثانوي" variant="secondary" />
              <AppButton title="زر حدود" variant="outline" />
            </Stack>
          </Stack>
        </AppCard>

        <AppCard padding="lg" variant="muted">
          <SuccessState
            message="تم تجهيز foundation فقط، بدون auth أو navigation أو API."
            title="Phase 2 جاهزة"
          />
        </AppCard>
      </Stack>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
    gap: spacing.xl,
  },
  identityRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.lg,
  },
  identityText: {
    flex: 1,
    gap: spacing.xs,
    alignItems: 'flex-end',
  },
});
