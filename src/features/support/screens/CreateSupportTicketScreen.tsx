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
  ErrorState,
  Stack,
} from '../../../components';
import { useTranslation } from '../../../i18n';
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
  const { t } = useTranslation();
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
          <AppHeader subtitle={t.support.create.subtitle} title={t.support.create.title} />
        </Stack>

        <AppCard variant="muted">
          <AppText color="secondary" variant="bodySmall">
            {t.support.create.notice}
          </AppText>
        </AppCard>

        <SupportCategorySelector
          error={validation.category}
          onChange={setCategory}
          value={createDraft.category}
        />

        <AppTextInput
          error={validation.subject}
          label={t.support.create.subjectLabel}
          onChangeText={setSubject}
          placeholder={t.support.create.subjectPlaceholder}
          value={createDraft.subject}
        />

        <AppTextInput
          error={validation.message}
          label={t.support.create.messageLabel}
          multiline
          onChangeText={setMessage}
          placeholder={t.support.create.messagePlaceholder}
          value={createDraft.message}
        />

        {errorMessage ? <ErrorState kind="server" message={errorMessage} /> : null}

        <Stack gap="sm">
          <AppButton
            fullWidth
            loading={isCreating}
            onPress={() => {
              void handleSubmit();
            }}
            title={t.support.create.submit}
          />
          <AppButton fullWidth onPress={handleCancel} title={t.common.cancel} variant="outline" />
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
