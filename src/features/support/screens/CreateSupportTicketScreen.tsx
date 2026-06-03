import { useEffect } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet } from 'react-native';

import {
  AppButton,
  AppCard,
  AppHeader,
  AppScreen,
  AppText,
  AppTextInput,
  Stack,
} from '../../../components';
import { ProfileRoutes } from '../../../navigation/routes';
import type { ProfileStackParamList } from '../../../navigation/types';
import { spacing } from '../../../theme';
import { SupportCategorySelector } from '../components';
import { useSupportStore } from '../store';

type CreateSupportTicketScreenProps = NativeStackScreenProps<
  ProfileStackParamList,
  'CreateSupportTicket'
>;

export function CreateSupportTicketScreen({ navigation }: CreateSupportTicketScreenProps) {
  const createDraft = useSupportStore((state) => state.createDraft);
  const validation = useSupportStore((state) => state.validation);
  const isCreating = useSupportStore((state) => state.isCreating);
  const errorMessage = useSupportStore((state) => state.errorMessage);
  const setCategory = useSupportStore((state) => state.setCategory);
  const setSubject = useSupportStore((state) => state.setSubject);
  const setMessage = useSupportStore((state) => state.setMessage);
  const createTicket = useSupportStore((state) => state.createTicket);
  const resetCreateDraft = useSupportStore((state) => state.resetCreateDraft);
  const clearMessages = useSupportStore((state) => state.clearMessages);

  useEffect(() => {
    clearMessages();
  }, [clearMessages]);

  async function handleSubmit() {
    const ticket = await createTicket();

    if (ticket) {
      navigation.replace(ProfileRoutes.TicketDetails, { ticketId: ticket.id });
    }
  }

  function handleCancel() {
    resetCreateDraft();
    navigation.goBack();
  }

  return (
    <AppScreen contentContainerStyle={styles.content} scroll>
      <Stack gap="xl">
        <Stack gap="md">
          <AppHeader subtitle="إرسال مشكلة إلى فريق الدعم" title="إنشاء تذكرة دعم" />
          <AppButton onPress={handleCancel} title="رجوع" variant="ghost" />
        </Stack>

        <AppCard variant="muted">
          <AppText color="secondary" variant="bodySmall">
            يتم إرسال التصنيف والعنوان والرسالة فقط حسب واجهة الدعم الرسمية. لا يتم رفع مرفقات أو
            طلب تصنيفات من الخادم في هذه المرحلة.
          </AppText>
        </AppCard>

        <SupportCategorySelector
          error={validation.category}
          onChange={setCategory}
          value={createDraft.category}
        />

        <AppTextInput
          error={validation.subject}
          label="عنوان المشكلة"
          onChangeText={setSubject}
          placeholder="مثال: مشكلة في فتح ملف"
          value={createDraft.subject}
        />

        <AppTextInput
          error={validation.message}
          label="تفاصيل المشكلة"
          multiline
          onChangeText={setMessage}
          placeholder="اكتب التفاصيل التي تساعد فريق الدعم على فهم المشكلة"
          value={createDraft.message}
        />

        {errorMessage ? (
          <AppCard variant="muted">
            <AppText color="error" variant="bodySmall">
              {errorMessage}
            </AppText>
          </AppCard>
        ) : null}

        <Stack gap="sm">
          <AppButton
            fullWidth
            loading={isCreating}
            onPress={() => {
              void handleSubmit();
            }}
            title="إرسال التذكرة"
          />
          <AppButton fullWidth onPress={handleCancel} title="إلغاء" variant="outline" />
        </Stack>
      </Stack>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
  },
});
