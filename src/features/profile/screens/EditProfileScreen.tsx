import { useEffect, useMemo, useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet } from 'react-native';

import {
  AppButton,
  AppCard,
  AppHeader,
  AppScreen,
  AppText,
  AppTextInput,
  FormAlert,
  LoadingState,
  Stack,
} from '../../../components';
import { useUnsavedChangesGuard } from '../../../hooks/useUnsavedChangesGuard';
import { useTranslation } from '../../../i18n';
import type { ProfileStackParamList } from '../../../navigation/types';
import { spacing } from '../../../theme';
import { useAuthStore } from '../../auth/store';
import { isolateLtr } from '../../../utils/rtl';
import {
  getProfileRoleLabel,
  hasProfileDraftErrors,
  isProfileDraftDirty,
  isStaffRole,
  validateProfileDraft,
} from '../services';
import { useProfileStore } from '../store';

type EditProfileScreenProps = NativeStackScreenProps<ProfileStackParamList, 'EditProfile'>;
type Field = 'full_name' | 'username' | 'job_title';

export function EditProfileScreen({ navigation }: EditProfileScreenProps) {
  const { t } = useTranslation();
  const user = useProfileStore((state) => state.user);
  const authRole = useAuthStore((state) => state.user?.role);
  const editDraft = useProfileStore((state) => state.editDraft);
  const isLoading = useProfileStore((state) => state.isLoading);
  const isSubmitting = useProfileStore((state) => state.isSubmitting);
  const errorMessage = useProfileStore((state) => state.errorMessage);
  const loadProfile = useProfileStore((state) => state.loadProfile);
  const updateProfile = useProfileStore((state) => state.updateProfile);
  const setFullName = useProfileStore((state) => state.setFullName);
  const setUsername = useProfileStore((state) => state.setUsername);
  const setJobTitle = useProfileStore((state) => state.setJobTitle);
  const syncDraftFromUser = useProfileStore((state) => state.syncDraftFromUser);
  const resetDraft = useProfileStore((state) => state.resetDraft);
  const clearMessages = useProfileStore((state) => state.clearMessages);
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const copy = t.profile.edit;
  const isStaff = isStaffRole(user?.role ?? authRole);

  useEffect(() => {
    clearMessages();

    if (!user) {
      void loadProfile();
      return;
    }

    syncDraftFromUser();
  }, [clearMessages, loadProfile, syncDraftFromUser, user]);

  const errors = useMemo(
    () => validateProfileDraft(editDraft, { isStaff }, copy),
    [editDraft, isStaff, copy],
  );
  const dirty = isProfileDraftDirty(user, editDraft, { isStaff });

  // Read from the store at the moment of leaving, so a successful save followed by goBack() is not questioned.
  useUnsavedChangesGuard(navigation, () => {
    const state = useProfileStore.getState();

    return isProfileDraftDirty(state.user, state.editDraft, {
      isStaff: isStaffRole(state.user?.role ?? useAuthStore.getState().user?.role),
    });
  });

  function visibleError(field: Field): string | undefined {
    return touched[field] || submitted ? errors[field] : undefined;
  }

  function touch(field: Field) {
    setTouched((current) => ({ ...current, [field]: true }));
  }

  async function handleSubmit() {
    setSubmitted(true);

    if (hasProfileDraftErrors(errors)) {
      return;
    }

    const updatedUser = await updateProfile();

    if (updatedUser) {
      navigation.goBack();
    }
  }

  function handleCancel() {
    // The guard asks first when there are unsaved edits.
    navigation.goBack();
  }

  // Unsaved edits are dropped when the screen is actually gone (not while the guard is still asking).
  useEffect(() => () => resetDraft(), [resetDraft]);

  return (
    <AppScreen contentContainerStyle={styles.content} scroll>
      <Stack gap="xl">
        <AppHeader onBack={handleCancel} showBack subtitle={copy.subtitle} title={copy.title} />

        {isLoading && !user ? <LoadingState message={t.profile.loadingAccount} /> : null}

        <AppText color="secondary" variant="bodySmall">
          {isStaff ? copy.noticeStaff : copy.notice}
        </AppText>

        <AppTextInput
          autoComplete="name"
          disabled={isSubmitting}
          error={visibleError('full_name')}
          label={copy.fullName}
          maxLength={150}
          onBlur={() => touch('full_name')}
          onChangeText={setFullName}
          placeholder={copy.fullNamePlaceholder}
          returnKeyType="next"
          value={editDraft.full_name}
        />

        <AppTextInput
          autoCapitalize="none"
          autoCorrect={false}
          disabled={isSubmitting}
          error={visibleError('username')}
          helperText={copy.usernameHelper}
          label={copy.username}
          maxLength={30}
          onBlur={() => touch('username')}
          onChangeText={setUsername}
          placeholder={copy.usernamePlaceholder}
          returnKeyType={isStaff ? 'next' : 'done'}
          value={editDraft.username}
        />

        {isStaff ? (
          <AppTextInput
            disabled={isSubmitting}
            error={visibleError('job_title')}
            helperText={copy.jobTitleHelper}
            label={copy.jobTitle}
            maxLength={120}
            onBlur={() => touch('job_title')}
            onChangeText={setJobTitle}
            placeholder={copy.jobTitlePlaceholder}
            returnKeyType="done"
            value={editDraft.job_title}
          />
        ) : null}

        <AppCard variant="outlined">
          <Stack gap="sm">
            <AppText variant="title">{copy.readOnlyTitle}</AppText>
            <AppText color="secondary" variant="bodySmall">
              {copy.email(user?.email ? isolateLtr(user.email) : t.common.notAvailable)}
            </AppText>
            <AppText color="secondary" variant="bodySmall">
              {copy.phone(
                user?.phone_number ? isolateLtr(user.phone_number) : t.common.notAvailable,
              )}
            </AppText>
            <AppText color="secondary" variant="bodySmall">
              {copy.role(getProfileRoleLabel(user?.role, t.profile))}
            </AppText>
          </Stack>
        </AppCard>

        {errorMessage ? <FormAlert message={errorMessage} /> : null}

        <Stack gap="sm">
          <AppButton
            disabled={!dirty}
            fullWidth
            loading={isSubmitting}
            onPress={() => {
              void handleSubmit();
            }}
            title={isSubmitting ? copy.saving : copy.save}
          />
          <AppButton
            disabled={isSubmitting}
            fullWidth
            onPress={handleCancel}
            title={t.common.cancel}
            variant="outline"
          />
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
