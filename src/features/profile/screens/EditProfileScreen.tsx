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
import type { ProfileStackParamList } from '../../../navigation/types';
import { spacing } from '../../../theme';
import { getProfileRoleLabel } from '../services';
import { useProfileStore } from '../store';

type EditProfileScreenProps = NativeStackScreenProps<ProfileStackParamList, 'EditProfile'>;

export function EditProfileScreen({ navigation }: EditProfileScreenProps) {
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
          <AppHeader subtitle="تعديل البيانات المسموحة من الخادم" title="تعديل الملف الشخصي" />
          <AppButton onPress={handleCancel} title="رجوع" variant="ghost" />
        </Stack>

        {isLoading && !user ? <LoadingState message="جاري تحميل بيانات الحساب..." /> : null}

        <AppCard variant="muted">
          <AppText color="secondary" variant="bodySmall">
            يمكن تعديل الاسم الكامل واسم المستخدم فقط. البريد والهاتف والدور حقول للعرض ولا يتم
            إرسالها في طلب التحديث.
          </AppText>
        </AppCard>

        <AppTextInput
          label="الاسم الكامل"
          onChangeText={setFullName}
          placeholder="اكتب الاسم الكامل"
          value={editDraft.full_name}
        />

        <AppTextInput
          label="اسم المستخدم"
          onChangeText={setUsername}
          placeholder="اكتب اسم المستخدم"
          value={editDraft.username}
        />

        <AppCard variant="outlined">
          <Stack gap="sm">
            <AppText variant="title">حقول غير قابلة للتعديل</AppText>
            <AppText color="secondary" variant="bodySmall">
              البريد: {user?.email ?? 'غير متوفر'}
            </AppText>
            <AppText color="secondary" variant="bodySmall">
              الهاتف: {user?.phone_number ?? 'غير متوفر'}
            </AppText>
            <AppText color="secondary" variant="bodySmall">
              الدور: {getProfileRoleLabel(user?.role)}
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
            title="حفظ التغييرات"
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
