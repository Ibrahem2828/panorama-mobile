import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';

import { AppButton, AppText, AppTextInput, Stack } from '../../../components';
import { useTranslation } from '../../../i18n';
import { colors, radius, spacing } from '../../../theme';
import { parsePageInput } from '../logic';

type Props = {
  visible: boolean;
  pageCount: number;
  onClose: () => void;
  onJump: (page: number) => void;
};

export function JumpToPageModal({ visible, pageCount, onClose, onJump }: Props) {
  const { t } = useTranslation();
  const [value, setValue] = useState('');
  const [invalid, setInvalid] = useState(false);

  const close = () => {
    setValue('');
    setInvalid(false);
    onClose();
  };

  const submit = () => {
    const target = parsePageInput(value, pageCount);
    if (target === null) {
      setInvalid(true);
      return;
    }
    setValue('');
    setInvalid(false);
    onJump(target);
  };

  return (
    <Modal animationType="fade" onRequestClose={close} transparent visible={visible}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.root}
      >
        <Pressable
          accessibilityLabel={t.common.cancel}
          accessibilityRole="button"
          onPress={close}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.card}>
          <Stack gap="md">
            <AppText variant="title">{t.lectures.viewer.jumpTitle}</AppText>
            <AppTextInput
              autoFocus
              error={invalid ? t.lectures.viewer.jumpInvalid(pageCount) : undefined}
              keyboardType="number-pad"
              maxLength={6}
              onChangeText={(next) => {
                setValue(next);
                setInvalid(false);
              }}
              onSubmitEditing={submit}
              placeholder={t.lectures.viewer.jumpLabel}
              returnKeyType="go"
              value={value}
            />
            <Stack direction="horizontal" gap="sm">
              <AppButton onPress={submit} style={styles.action} title={t.lectures.viewer.jumpGo} />
              <AppButton
                onPress={close}
                style={styles.action}
                title={t.common.cancel}
                variant="outline"
              />
            </Stack>
          </Stack>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: colors.overlay,
  },
  card: {
    padding: spacing.xl,
    borderRadius: radius.xl,
    backgroundColor: colors.background.surface,
  },
  action: { flex: 1 },
});
