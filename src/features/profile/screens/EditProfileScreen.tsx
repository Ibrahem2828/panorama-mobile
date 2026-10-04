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
  LoadingState,
  Stack,
} from '../../../components';
import { useTranslation } from '../../../i18n';
import type { ProfileStackParamList } from '../../../navigation/types';
import { spacing } from '../../../theme';
import { getProfileRoleLabel } from '../services';
import { useProfileStore } from '../store';

type EditProfileScreenProps = NativeStackScreenProps<ProfileStackParamList, 'EditProfile'>;

export function EditProfileScreen({ navigation }: EditProfileScreenProps) {
  const { t } = useTranslation();
  const user = useProfileStore((state) => state.user);
  const editDraft = useProfileStore((state) => state.editDraft);
  const isLoading = useProfileStore((state) => state.isLoading);
  const isSubmitting = useProfileStore((state) => state.isSubmitting);
  const errorMessage = useProfileStore((state) => state.errorMessage);
  const successMessage = useProfileStore((state) => state.successMessage);
  const loadProfile = useProfileStore((state) => state.loadProfile);
  const updateProfile = useProfileStore((state) => state.updateProfile);
  const setFullName = useProfileStore((state) => state.setFullName);
  const setUsername = useProfileStore((state) => state.setUsername);
  const syncDraftFromUser = useProfileStore((state) => state.syncDraftFromUser);
  const resetDraft = useProfileStore((state) => state.resetDraft);
  const clearMessages = useProfileStore((state) => state.clearMessages);

  useEffect(() => {
    clearMessages();

    if (!user) {
      void loadProfile();
      return;
    }

    syncDraftFromUser();
  }, [clearMessages, loadProfile, syncDraftFromUser, user]);

  async function handleSubmit() {
    const updatedUser = await updateProfile();

    if (updatedUser) {
      navigation.goBack();
    }
  }

  function handleCancel() {
    resetDraft();
    navigation.goBack();
  }

  return (
    <AppScreen contentContainerStyle={styles.content} scroll>
      <Stack gap="xl">
        <Stack gap="md">
          <AppHeader subtitle={t.profile.edit.subtitle} title={t.profile.edit.title} />
          <AppButton onPress={handleCancel} title={t.common.back} variant="ghost" />
        </Stack>

        {isLoading && !user ? <LoadingState message={t.profile.loadingAccount} /> : null}

        <AppCard variant="muted">
          <AppText color="secondary" variant="bodySmall">
            {t.profile.edit.notice}
          </AppText>
        </AppCard>

        <AppTextInput
          label={t.profile.edit.fullName}
          onChangeText={setFullName}
          placeholder={t.profile.edit.fullNamePlaceholder}
          value={editDraft.full_name}
        />

        <AppTextInput
          label={t.profile.edit.username}
          onChangeText={setUsername}
          placeholder={t.profile.edit.usernamePlaceholder}
          value={editDraft.username}
        />

        <AppCard variant="outlined">
          <Stack gap="sm">
            <AppText variant="title">{t.profile.edit.readOnlyTitle}</AppText>
            <AppText color="secondary" variant="bodySmall">
              {t.profile.edit.email(user?.email ?? t.common.notAvailable)}
            </AppText>
            <AppText color="secondary" variant="bodySmall">
              {t.profile.edit.phone(user?.phone_number ?? t.common.notAvailable)}
            </AppText>
            <AppText color="secondary" variant="bodySmall">
              {t.profile.edit.role(getProfileRoleLabel(user?.role, t.profile))}
            </AppText>
          </Stack>
        </AppCard>

        {successMessage ? (
          <AppCard variant="muted">
            <AppText color="success" variant="bodySmall">
              {successMessage}
            </AppText>
          </AppCard>
        ) : null}

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
            loading={isSubmitting}
            onPress={() => {
              void handleSubmit();
            }}
            title={t.profile.edit.save}
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
