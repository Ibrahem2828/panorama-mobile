import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { useTranslation } from '../../i18n';
import { colors, inputThemeProps, radius, spacing, typography, useBrand } from '../../theme';
import { getIsRTL } from '../../utils/rtl';
import { AppText } from '../common';
import { Icon } from '../icons';

export const TYPEAHEAD_MIN_CHARS = 2;
export const TYPEAHEAD_DEBOUNCE_MS = 250;
export const TYPEAHEAD_MAX_RESULTS = 8;

type TypeaheadSearchProps<T> = {
  /** Resolves the matches for a query that already passed the minimum length. */
  search: (query: string) => Promise<readonly T[]>;
  keyExtractor: (item: T) => string;
  renderItem: (item: T) => ReactNode;
  onSelect: (item: T) => void;
  placeholder: string;
  accessibilityLabel: string;
  /** Rows that must not be offered again (already chosen). */
  excludeKeys?: ReadonlySet<string>;
  disabled?: boolean;
};

/**
 * The one search box used for picking from large lists. It never shows the whole list: nothing happens until the user has typed
 * {@link TYPEAHEAD_MIN_CHARS} characters, requests wait {@link TYPEAHEAD_DEBOUNCE_MS} ms after the last keystroke, only the
 * latest request may answer, and at most {@link TYPEAHEAD_MAX_RESULTS} rows are drawn.
 */
export function TypeaheadSearch<T>({
  search,
  keyExtractor,
  renderItem,
  onSelect,
  placeholder,
  accessibilityLabel,
  excludeKeys,
  disabled = false,
}: TypeaheadSearchProps<T>) {
  const { t } = useTranslation();
  const brand = useBrand();
  const [text, setText] = useState('');
  const [results, setResults] = useState<readonly T[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const latest = useRef(0);
  const searchRef = useRef(search);

  searchRef.current = search;

  const query = text.replace(/\s+/gu, ' ').trim();
  const ready = query.length >= TYPEAHEAD_MIN_CHARS;

  useEffect(() => {
    latest.current += 1;

    if (!ready) {
      setResults([]);
      setLoading(false);
      setFailed(false);
      return undefined;
    }

    const ticket = latest.current;
    const timer = setTimeout(() => {
      setLoading(true);
      setFailed(false);
      searchRef
        .current(query)
        .then((found) => {
          if (ticket === latest.current) {
            setResults(found);
          }
        })
        .catch(() => {
          if (ticket === latest.current) {
            setResults([]);
            setFailed(true);
          }
        })
        .finally(() => {
          if (ticket === latest.current) {
            setLoading(false);
          }
        });
    }, TYPEAHEAD_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query, ready]);

  const visible = results
    .filter((item) => !excludeKeys?.has(keyExtractor(item)))
    .slice(0, TYPEAHEAD_MAX_RESULTS);

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <Icon color={colors.text.muted} name="search" size={20} />
        <TextInput
          {...inputThemeProps}
          accessibilityLabel={accessibilityLabel}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!disabled}
          onChangeText={setText}
          placeholder={placeholder}
          placeholderTextColor={colors.text.muted}
          style={styles.input}
          textAlign={getIsRTL() ? 'right' : 'left'}
          value={text}
        />
        {loading ? <ActivityIndicator color={brand.primary} size="small" /> : null}
        {text ? (
          <Pressable
            accessibilityLabel={t.common.cancel}
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => setText('')}
          >
            <Icon color={colors.text.muted} name="close" size={18} />
          </Pressable>
        ) : null}
      </View>

      {!ready ? (
        <AppText color="muted" variant="caption">
          {t.search.typeToSearch}
        </AppText>
      ) : failed ? (
        <AppText color="error" variant="caption">
          {t.search.failed}
        </AppText>
      ) : !loading && visible.length === 0 ? (
        <AppText color="muted" variant="caption">
          {t.search.noMatches}
        </AppText>
      ) : null}

      {visible.map((item) => (
        <Pressable
          accessibilityRole="button"
          key={keyExtractor(item)}
          onPress={() => {
            onSelect(item);
            setText('');
          }}
          style={({ pressed }) => [styles.row, pressed ? styles.pressed : null]}
        >
          {renderItem(item)}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  inputRow: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.background.surface,
  },
  input: {
    ...typography.variants.input,
    flex: 1,
    paddingVertical: spacing.sm,
    color: colors.text.primary,
  },
  row: {
    minHeight: 52,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.background.surface,
  },
  pressed: { opacity: 0.7 },
});
