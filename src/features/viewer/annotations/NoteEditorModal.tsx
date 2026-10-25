import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet } from 'react-native';

import { AppButton, AppText, AppTextInput, Stack } from '../../../components';
import { AppModal } from '../../../components/overlay';
import { useTranslation } from '../../../i18n';
import { colors, radius, spacing } from '../../../theme';

type Props = {
  visible: boolean;
  /** Existing note text when editing, empty for a new note. */
  initialText: string;
  onSave: (text: string) => void;
  onDelete?: () => void;
  onClose: () => void;
};

export const NOTE_MAX_CHARS = 2000;

/** Small dialog for a sticky note's text (drawn inside the secure window like every other overlay). */
export function NoteEditorModal({ visible, initialText, onSave, onDelete, onClose }: Props) {
  const { t } = useTranslation();
  const [text, setText] = useState(initialText);

  useEffect(() => {
    if (visible) {
      setText(initialText);
    }
  }, [visible, initialText]);

  const trimmed = text.trim();

  return (
    <AppModal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.fill}
      >
        <Pressable accessibilityLabel={t.docViewer.close} onPress={onClose} style={styles.backdrop}>
          <Pressable accessible={false} style={styles.card}>
            <Stack gap="md">
              <AppText variant="title">{t.docViewer.noteTitle}</AppText>
              <AppTextInput
                autoFocus
                maxLength={NOTE_MAX_CHARS}
                multiline
                onChangeText={setText}
                placeholder={t.docViewer.notePlaceholder}
                style={styles.input}
                value={text}
              />
              <AppButton
                disabled={trimmed.length === 0}
                onPress={() => onSave(trimmed)}
                title={t.docViewer.noteSave}
              />
              {onDelete ? (
                <AppButton
                  onPress={onDelete}
                  title={t.docViewer.noteDelete}
                  variant="dangerOutline"
                />
              ) : null}
            </Stack>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </AppModal>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: 'rgba(16, 24, 40, 0.45)',
  },
  card: {
    padding: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.background.surface,
  },
  input: { minHeight: 110, textAlignVertical: 'top' },
});
