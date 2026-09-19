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
import type { ProfileStackParamList } from '../../../navigation/types';
import { spacing } from '../../../theme';
import { useSettingsStore } from '../store';
import { useTranslation } from '../../../i18n';

type ChangePasswordScreenProps = NativeStackScreenProps<ProfileStackParamList, 'ChangePassword'>;

export function ChangePasswordScreen({ navigation }: ChangePasswordScreenProps) {
  const { t } = useTranslation();
  const passwordDraft = useSettingsStore((state) => state.passwordDraft);
  const passwordValidation = useSettingsStore((state) => state.passwordValidation);
  const isChangingPassword = useSettingsStore((state) => state.isChangingPassword);
  const errorMessage = useSettingsStore((state) => state.errorMessage);
  const successMessage = useSettingsStore((state) => state.successMessage);
  const setOldPassword = useSettingsStore((state) => state.setOldPassword);
  const setNewPassword = useSettingsStore((state) => state.setNewPassword);
  const setNewPasswordConfirm = useSettingsStore((state) => state.setNewPasswordConfirm);
  const changePassword = useSettingsStore((state) => state.changePassword);
  const resetPasswordDraft = useSettingsStore((state) => state.resetPasswordDraft);
  const clearMessages = useSettingsStore((state) => state.clearMessages);

  useEffect(() => {
    clearMessages();
  }, [clearMessages]);

  function handleBack() {
    resetPasswordDraft();
    navigation.goBack();
  }

  return (
    <AppScreen contentContainerStyle={styles.content} scroll>
      <Stack gap="xl">
        <Stack gap="md">
          <AppHeader
            subtitle={t.settings.changePassword.subtitle}
            title={t.settings.changePassword.title}
          />
          <AppButton onPress={handleBack} title={t.common.back} variant="ghost" />
        </Stack>

        <AppCard variant="muted">
          <AppText color="secondary" variant="bodySmall">
            {t.settings.changePassword.note}
          </AppText>
        </AppCard>

        <AppTextInput
          error={passwordValidation.old_password}
          label={t.settings.changePassword.current}
          onChangeText={setOldPassword}
          secureTextEntry
          value={passwordDraft.old_password}
        />

        <AppTextInput
          error={passwordValidation.new_password}
          label={t.settings.changePassword.new}
          onChangeText={setNewPassword}
          secureTextEntry
          value={passwordDraft.new_password}
        />

        <AppTextInput
          error={passwordValidation.new_password_confirm}
          label={t.settings.changePassword.confirm}
          onChangeText={setNewPasswordConfirm}
          secureTextEntry
          value={passwordDraft.new_password_confirm}
        />

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

        <AppButton
          fullWidth
          loading={isChangingPassword}
          onPress={() => {
            void changePassword();
          }}
          title={t.settings.changePassword.title}
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
