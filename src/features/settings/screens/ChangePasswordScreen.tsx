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

type ChangePasswordScreenProps = NativeStackScreenProps<ProfileStackParamList, 'ChangePassword'>;

export function ChangePasswordScreen({ navigation }: ChangePasswordScreenProps) {
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
          <AppHeader subtitle="تغيير كلمة المرور للحساب الحالي" title="تغيير كلمة المرور" />
          <AppButton onPress={handleBack} title="رجوع" variant="ghost" />
        </Stack>

        <AppCard variant="muted">
          <AppText color="secondary" variant="bodySmall">
            لا يتم حفظ كلمات المرور خارج مسودة الإدخال الحالية، ولا يتم تسجيلها في السجلات.
          </AppText>
        </AppCard>

        <AppTextInput
          error={passwordValidation.old_password}
          label="كلمة المرور الحالية"
          onChangeText={setOldPassword}
          secureTextEntry
          value={passwordDraft.old_password}
        />

        <AppTextInput
          error={passwordValidation.new_password}
          label="كلمة المرور الجديدة"
          onChangeText={setNewPassword}
          secureTextEntry
          value={passwordDraft.new_password}
        />

        <AppTextInput
          error={passwordValidation.new_password_confirm}
          label="تأكيد كلمة المرور الجديدة"
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
          title="تغيير كلمة المرور"
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
