import { useEffect, useMemo, useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, View } from 'react-native';

import {
  AppButton,
  AppCard,
  AppHeader,
  AppScreen,
  AppText,
  FormAlert,
  Stack,
} from '../../../components';
import { useUnsavedChangesGuard } from '../../../hooks/useUnsavedChangesGuard';
import type { ProfileStackParamList } from '../../../navigation/types';
import { spacing } from '../../../theme';
import { PasswordInput } from '../../auth/components/PasswordInput';
import { isPasswordDraftDirty, validateChangePasswordInput } from '../services';
import { useSettingsStore } from '../store';
import { useTranslation } from '../../../i18n';

type ChangePasswordScreenProps = NativeStackScreenProps<ProfileStackParamList, 'ChangePassword'>;
type Field = 'old_password' | 'new_password' | 'new_password_confirm';

export function ChangePasswordScreen({ navigation }: ChangePasswordScreenProps) {
  const { t } = useTranslation();
  const copy = t.settings.changePassword;
  const passwordDraft = useSettingsStore((state) => state.passwordDraft);
  const passwordValidation = useSettingsStore((state) => state.passwordValidation);
  const isChangingPassword = useSettingsStore((state) => state.isChangingPassword);
  const errorMessage = useSettingsStore((state) => state.errorMessage);
  const setOldPassword = useSettingsStore((state) => state.setOldPassword);
  const setNewPassword = useSettingsStore((state) => state.setNewPassword);
  const setNewPasswordConfirm = useSettingsStore((state) => state.setNewPasswordConfirm);
  const changePassword = useSettingsStore((state) => state.changePassword);
  const resetPasswordDraft = useSettingsStore((state) => state.resetPasswordDraft);
  const clearMessages = useSettingsStore((state) => state.clearMessages);
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});

  useEffect(() => {
    clearMessages();
  }, [clearMessages]);

  // The typed passwords never outlive the screen.
  useEffect(() => () => resetPasswordDraft(), [resetPasswordDraft]);

  useUnsavedChangesGuard(navigation, () =>
    isPasswordDraftDirty(useSettingsStore.getState().passwordDraft),
  );

  const liveErrors = useMemo(
    () => validateChangePasswordInput(passwordDraft, t.settings),
    [passwordDraft, t.settings],
  );

  function errorFor(field: Field): string | undefined {
    // Live feedback once the field was visited; a failed submit (store validation) shows everything at once.
    if (touched[field]) {
      return liveErrors[field];
    }

    return passwordValidation[field];
  }

  function touch(field: Field) {
    setTouched((current) => ({ ...current, [field]: true }));
  }

  return (
    <AppScreen contentContainerStyle={styles.content} scroll>
      <Stack gap="xl">
        <AppHeader
          onBack={() => navigation.goBack()}
          showBack
          subtitle={copy.subtitle}
          title={copy.title}
        />

        <AppCard variant="muted">
          <Stack gap="sm">
            <AppText variant="title">{copy.rulesTitle}</AppText>
            {copy.rules.map((rule) => (
              <View key={rule} style={styles.ruleRow}>
                <AppText color="muted" variant="bodySmall">
                  •
                </AppText>
                <AppText color="secondary" style={styles.ruleText} variant="bodySmall">
                  {rule}
                </AppText>
              </View>
            ))}
          </Stack>
        </AppCard>

        <PasswordInput
          autoComplete="current-password"
          disabled={isChangingPassword}
          error={errorFor('old_password')}
          label={copy.current}
          onBlur={() => touch('old_password')}
          onChangeText={setOldPassword}
          placeholder=""
          value={passwordDraft.old_password}
        />

        <PasswordInput
          autoComplete="new-password"
          disabled={isChangingPassword}
          error={errorFor('new_password')}
          label={copy.new}
          onBlur={() => touch('new_password')}
          onChangeText={setNewPassword}
          placeholder=""
          value={passwordDraft.new_password}
        />

        <PasswordInput
          autoComplete="new-password"
          disabled={isChangingPassword}
          error={errorFor('new_password_confirm')}
          label={copy.confirm}
          onBlur={() => touch('new_password_confirm')}
          onChangeText={setNewPasswordConfirm}
          placeholder=""
          value={passwordDraft.new_password_confirm}
        />

        <AppText color="muted" variant="caption">
          {copy.signOutNote}
        </AppText>

        {errorMessage ? <FormAlert message={errorMessage} /> : null}

        <AppButton
          disabled={!isPasswordDraftDirty(passwordDraft)}
          fullWidth
          loading={isChangingPassword}
          onPress={() => {
            void changePassword();
          }}
          title={isChangingPassword ? copy.saving : copy.title}
        />
      </Stack>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
  },
  ruleRow: { flexDirection: 'row', gap: spacing.sm },
  ruleText: { flex: 1 },
});
