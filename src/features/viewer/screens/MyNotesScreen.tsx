import { useEffect, useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';

import {
  AppHeader,
  AppScreen,
  AppText,
  EmptyState,
  ErrorState,
  Icon,
  LoadingState,
} from '../../../components';
import { useTranslation } from '../../../i18n';
import type { ProfileStackParamList } from '../../../navigation/types';
import { colors, inputThemeProps, radius, spacing } from '../../../theme';
import { getIsRTL } from '../../../utils/rtl';
import { useDebouncedValue } from '../../groups/hooks/useDebouncedValue';
import { searchMyNotes, type MyNote } from '../annotations/annotationsService';

type Props = NativeStackScreenProps<ProfileStackParamList, 'MyNotes'>;

/** The student's own notes and bookmarks across lectures and files, searchable (private: only their own are returned). */
export function MyNotesScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const copy = t.docViewer.myNotes;
  const [text, setText] = useState('');
  const query = useDebouncedValue(text.trim(), 300);
  const [notes, setNotes] = useState<MyNote[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    setFailed(false);
    searchMyNotes(query).then(
      (rows) => {
        if (!cancelled) setNotes(rows);
      },
      () => {
        if (!cancelled) setFailed(true);
      },
    );

    return () => {
      cancelled = true;
    };
  }, [query]);

  const open = (note: MyNote) => {
    if (note.target_type === 'lecture') {
      navigation.navigate('LectureViewer', {
        lectureId: note.target_id,
        title: note.title,
        page: note.page_number ?? undefined,
      });
    } else {
      navigation.navigate('PdfViewer', { fileId: note.target_id, title: note.title });
    }
  };

  return (
    <AppScreen>
      <AppHeader
        onBack={() => navigation.goBack()}
        showBack
        subtitle={copy.subtitle}
        title={copy.title}
      />
      <View style={styles.search}>
        <Icon color={colors.text.muted} name="search" size={20} />
        <TextInput
          {...inputThemeProps}
          accessibilityLabel={copy.placeholder}
          onChangeText={setText}
          placeholder={copy.placeholder}
          placeholderTextColor={colors.text.muted}
          style={styles.input}
          textAlign={getIsRTL() ? 'right' : 'left'}
          value={text}
        />
      </View>
      {failed ? (
        <ErrorState
          message={copy.failed}
          onRetry={() => setText((value) => `${value} `.trimEnd())}
        />
      ) : notes === null ? (
        <LoadingState message={t.common.loading} />
      ) : notes.length === 0 ? (
        <EmptyState message={copy.empty} title={copy.title} />
      ) : (
        <FlatList
          contentContainerStyle={styles.list}
          data={notes}
          keyExtractor={(note, index) =>
            `${note.source}-${note.target_type}-${note.target_id}-${index}`
          }
          renderItem={({ item }) => (
            <Pressable
              accessibilityHint={copy.open}
              accessibilityRole="button"
              onPress={() => open(item)}
              style={styles.row}
            >
              <AppText color="brand" numberOfLines={1} variant="label" weight="700">
                {item.title}
              </AppText>
              <AppText color="muted" variant="caption">
                {[
                  item.page_number ? copy.page(item.page_number) : null,
                  item.is_bookmark ? copy.bookmark : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </AppText>
              <AppText numberOfLines={3}>{item.text}</AppText>
            </Pressable>
          )}
        />
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  search: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.background.surface,
  },
  input: { flex: 1, paddingVertical: spacing.sm, color: colors.text.primary },
  list: { gap: spacing.sm, paddingBottom: spacing.xxl },
  row: {
    gap: spacing.xxs,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.background.surface,
  },
});
