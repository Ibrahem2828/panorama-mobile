import { memo, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import {
  AppBadge,
  AppButton,
  AppCard,
  AppIconButton,
  AppText,
  AppTextInput,
  Icon,
  Stack,
} from '../../../components';
import { useTranslation } from '../../../i18n';
import { colors, useBrand } from '../../../theme';
import { isTempNote, NOTE_MAX_LENGTH, validateNoteContent } from '../notesLogic';
import type { LectureNote } from '../types';

type Props = {
  note: LectureNote;
  onJump: (page: number) => void;
  onDelete: (note: LectureNote) => void;
  onFavorite: (note: LectureNote) => void;
  /** Resolves true when the edit was saved. */
  onSave: (note: LectureNote, content: string) => Promise<boolean>;
};

function NoteRowBase({ note, onJump, onDelete, onFavorite, onSave }: Props) {
  const { t } = useTranslation();
  const brand = useBrand();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(note.content);
  const [problem, setProblem] = useState<string | null>(null);
  const locked = Boolean(note.pending) || isTempNote(note);

  const startEdit = () => {
    setDraft(note.content);
    setProblem(null);
    setEditing(true);
  };

  const save = async () => {
    const result = validateNoteContent(draft);
    if (result) {
      setProblem(
        result === 'empty'
          ? t.lectures.notes.errorEmpty
          : t.lectures.notes.errorTooLong(NOTE_MAX_LENGTH),
      );
      return;
    }
    setProblem(null);
    const ok = await onSave(note, draft);
    if (ok) setEditing(false);
  };

  return (
    <AppCard padding="sm" variant="outlined">
      <Stack gap="sm">
        <Stack direction="horizontal" gap="sm" align="center" wrap>
          {note.page_number !== null ? (
            <Pressable
              accessibilityLabel={t.lectures.notes.jumpToPage(note.page_number)}
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => onJump(note.page_number as number)}
            >
              <AppBadge label={t.lectures.notes.pageChip(note.page_number)} variant="brand" />
            </Pressable>
          ) : (
            <AppBadge label={t.lectures.notes.generalNote} />
          )}
          {note.is_bookmark ? (
            <AppBadge label={t.lectures.notes.bookmarkBadge} variant="info" />
          ) : null}
          {note.pending ? (
            <AppText color="muted" variant="caption">
              {t.lectures.notes.pending}
            </AppText>
          ) : null}
        </Stack>

        {editing ? (
          <Stack gap="sm">
            <AppTextInput
              autoFocus
              error={problem ?? undefined}
              multiline
              onChangeText={(value) => {
                setDraft(value);
                setProblem(null);
              }}
              value={draft}
            />
            <Stack direction="horizontal" gap="sm">
              <AppButton
                onPress={() => void save()}
                size="sm"
                style={styles.grow}
                title={t.lectures.notes.save}
              />
              <AppButton
                onPress={() => setEditing(false)}
                size="sm"
                style={styles.grow}
                title={t.lectures.notes.cancel}
                variant="outline"
              />
            </Stack>
          </Stack>
        ) : (
          <>
            <AppText selectable variant="body">
              {note.content}
            </AppText>
            <Stack direction="horizontal" gap="xs">
              <AppIconButton
                accessibilityLabel={
                  note.is_favorite ? t.lectures.notes.unfavorite : t.lectures.notes.favorite
                }
                disabled={locked}
                icon={
                  <Icon
                    color={note.is_favorite ? brand.accent : colors.text.muted}
                    filled={note.is_favorite}
                    name="star"
                    size={20}
                  />
                }
                onPress={() => onFavorite(note)}
                variant="ghost"
              />
              {!note.is_bookmark ? (
                <AppIconButton
                  accessibilityLabel={t.lectures.notes.edit}
                  disabled={locked}
                  icon={<Icon color={colors.text.secondary} name="pencil" size={20} />}
                  onPress={startEdit}
                  variant="ghost"
                />
              ) : null}
              <AppIconButton
                accessibilityLabel={t.lectures.notes.delete}
                disabled={locked}
                icon={<Icon color={colors.semantic.error} name="trash" size={20} />}
                onPress={() => onDelete(note)}
                variant="ghost"
              />
            </Stack>
          </>
        )}
      </Stack>
    </AppCard>
  );
}

export const NoteRow = memo(NoteRowBase);

const styles = StyleSheet.create({
  grow: { flex: 1 },
});
