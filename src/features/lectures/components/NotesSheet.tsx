import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  View,
} from 'react-native';

import {
  AppButton,
  AppIconButton,
  AppText,
  AppTextInput,
  ErrorState,
  Icon,
  Stack,
} from '../../../components';
import { useTranslation } from '../../../i18n';
import { colors, radius, spacing, useBrand } from '../../../theme';
import type { NoteResult, useLectureNotes } from '../hooks/useLectureNotes';
import { lectureErrorKind } from '../logic';
import {
  NOTE_MAX_LENGTH,
  notesForFilter,
  validateNoteContent,
  type NotesFilter,
} from '../notesLogic';
import type { LectureNote } from '../types';
import { FilterChip } from './FilterChip';
import { NoteRow } from './NoteRow';
import { AppModal } from '../../../components/overlay';

type Props = {
  visible: boolean;
  page: number;
  notesApi: ReturnType<typeof useLectureNotes>;
  onClose: () => void;
  onJump: (page: number) => void;
};

const keyExtractor = (note: LectureNote) => String(note.id);

/** Bottom sheet (RN `Modal`) with the student's private notes: create, edit, favourite, delete, bookmarks. */
export function NotesSheet({ visible, page, notesApi, onClose, onJump }: Props) {
  const { t } = useTranslation();
  const brand = useBrand();
  const { notes, isLoading, errorKind, reload, create, update, remove, toggleFavorite } = notesApi;
  const [filter, setFilter] = useState<NotesFilter>('all');
  const [draft, setDraft] = useState('');
  const [attach, setAttach] = useState(true);
  const [problem, setProblem] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const list = useMemo(() => notesForFilter(notes, filter, page), [notes, filter, page]);

  const failureText = useCallback(
    (result: NoteResult, fallback: string): string | null => {
      if (result.ok) return null;
      if (result.conflict) return t.lectures.notes.errorConflict;
      const kind = lectureErrorKind(result.error);
      return kind === 'network' ||
        kind === 'rateLimited' ||
        kind === 'unavailable' ||
        kind === 'featureDisabled'
        ? t.lectures.errors[kind]
        : fallback;
    },
    [t],
  );

  const submit = async () => {
    const validation = validateNoteContent(draft);
    if (validation) {
      setProblem(
        validation === 'empty'
          ? t.lectures.notes.errorEmpty
          : t.lectures.notes.errorTooLong(NOTE_MAX_LENGTH),
      );
      return;
    }
    const content = draft;
    setProblem(null);
    setMessage(null);
    setDraft('');
    const result = await create({ content, page_number: attach ? page : null });
    if (!result.ok) {
      setDraft(content);
      setMessage(failureText(result, t.lectures.notes.errorSave));
    }
  };

  const handleSave = useCallback(
    async (note: LectureNote, content: string) => {
      setMessage(null);
      const result = await update(note, content);
      setMessage(failureText(result, t.lectures.notes.errorSave));
      return result.ok;
    },
    [failureText, t, update],
  );

  const handleFavorite = useCallback(
    async (note: LectureNote) => {
      setMessage(null);
      setMessage(failureText(await toggleFavorite(note), t.lectures.notes.errorSave));
    },
    [failureText, t, toggleFavorite],
  );

  const handleDelete = useCallback(
    (note: LectureNote) => {
      Alert.alert(t.lectures.notes.deleteTitle, t.lectures.notes.deleteMessage, [
        { text: t.lectures.notes.cancel, style: 'cancel' },
        {
          text: t.lectures.notes.deleteConfirm,
          style: 'destructive',
          onPress: () => {
            setMessage(null);
            void remove(note).then((result) =>
              setMessage(failureText(result, t.lectures.notes.errorDelete)),
            );
          },
        },
      ]);
    },
    [failureText, remove, t],
  );

  const handleJump = useCallback(
    (target: number) => {
      onJump(target);
      onClose();
    },
    [onClose, onJump],
  );

  const renderItem = useCallback(
    ({ item }: { item: LectureNote }) => (
      <NoteRow
        note={item}
        onDelete={handleDelete}
        onFavorite={(note) => void handleFavorite(note)}
        onJump={handleJump}
        onSave={handleSave}
      />
    ),
    [handleDelete, handleFavorite, handleJump, handleSave],
  );

  const emptyText =
    filter === 'page'
      ? t.lectures.notes.emptyPage
      : filter === 'bookmarks'
        ? t.lectures.notes.emptyBookmarks
        : t.lectures.notes.empty;

  return (
    <AppModal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.root}
      >
        <Pressable
          accessibilityLabel={t.lectures.notes.close}
          accessibilityRole="button"
          onPress={onClose}
          style={styles.backdrop}
        />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Stack direction="horizontal" gap="md" align="center">
            <View style={styles.titleBlock}>
              <AppText variant="title">{t.lectures.notes.title}</AppText>
              <AppText color="secondary" variant="caption">
                {t.lectures.notes.subtitle}
              </AppText>
            </View>
            <AppIconButton
              accessibilityLabel={t.lectures.notes.close}
              icon={<Icon name="close" size={22} />}
              onPress={onClose}
              variant="ghost"
            />
          </Stack>

          <FlatList
            ListEmptyComponent={
              isLoading ? (
                <View style={styles.center}>
                  <ActivityIndicator color={brand.primary} />
                  <AppText color="secondary" variant="bodySmall">
                    {t.lectures.notes.loading}
                  </AppText>
                </View>
              ) : errorKind ? (
                <ErrorState
                  message={t.lectures.errors[errorKind]}
                  onRetry={reload}
                  title={t.lectures.notes.loadError}
                />
              ) : (
                <AppText align="center" color="secondary" style={styles.empty} variant="bodySmall">
                  {emptyText}
                </AppText>
              )
            }
            ListHeaderComponent={
              <Stack gap="md" style={styles.composer}>
                <AppTextInput
                  accessibilityLabel={t.lectures.notes.title}
                  error={problem ?? undefined}
                  helperText={t.lectures.notes.charCount(draft.trim().length, NOTE_MAX_LENGTH)}
                  multiline
                  onChangeText={(value) => {
                    setDraft(value);
                    setProblem(null);
                  }}
                  placeholder={t.lectures.notes.contentPlaceholder}
                  value={draft}
                />
                <Stack direction="horizontal" gap="sm" align="center" justify="space-between">
                  <Stack direction="horizontal" gap="sm" align="center" style={styles.titleBlock}>
                    <Switch
                      accessibilityLabel={t.lectures.notes.attachToPage(page)}
                      onValueChange={setAttach}
                      thumbColor={attach ? brand.primary : colors.gray[300]}
                      trackColor={{ true: brand.primarySoft, false: colors.gray[200] }}
                      value={attach}
                    />
                    <AppText color="secondary" style={styles.titleBlock} variant="bodySmall">
                      {t.lectures.notes.attachToPage(page)}
                    </AppText>
                  </Stack>
                  <AppButton onPress={() => void submit()} size="sm" title={t.lectures.notes.add} />
                </Stack>
                {message ? (
                  <AppText color="error" variant="bodySmall">
                    {message}
                  </AppText>
                ) : null}
                <Stack direction="horizontal" gap="sm" wrap>
                  <FilterChip
                    label={t.lectures.notes.filterAll}
                    onPress={() => setFilter('all')}
                    selected={filter === 'all'}
                  />
                  <FilterChip
                    label={t.lectures.notes.filterPage(page)}
                    onPress={() => setFilter('page')}
                    selected={filter === 'page'}
                  />
                  <FilterChip
                    label={t.lectures.notes.filterBookmarks}
                    onPress={() => setFilter('bookmarks')}
                    selected={filter === 'bookmarks'}
                  />
                </Stack>
              </Stack>
            }
            contentContainerStyle={styles.listContent}
            data={isLoading || errorKind ? [] : list}
            ItemSeparatorComponent={Separator}
            keyboardShouldPersistTaps="handled"
            keyExtractor={keyExtractor}
            renderItem={renderItem}
          />
        </View>
      </KeyboardAvoidingView>
    </AppModal>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: colors.overlay },
  sheet: {
    maxHeight: '85%',
    minHeight: '50%',
    gap: spacing.md,
    padding: spacing.lg,
    borderTopStartRadius: radius.xxl,
    borderTopEndRadius: radius.xxl,
    backgroundColor: colors.background.surface,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.border.strong,
  },
  titleBlock: { flex: 1, minWidth: 0 },
  composer: { paddingBottom: spacing.md },
  listContent: { paddingBottom: spacing.xl },
  separator: { height: spacing.sm },
  center: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xl },
  empty: { paddingVertical: spacing.xl },
});
