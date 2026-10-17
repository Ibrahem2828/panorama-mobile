import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import type { ListRenderItemInfo } from 'react-native';

import { useTranslation } from '../../i18n';
import { colors, radius, shadows, spacing, typography, useBrand } from '../../theme';
import { AppText } from '../common';
import { Icon } from '../icons';
import { normalizeSearchText } from './searchText';

export type SelectOption = {
  id: string | number;
  label: string;
  description?: string | null;
};

type OptionSheetProps = {
  visible: boolean;
  title: string;
  options: SelectOption[];
  selectedId: string | number | null;
  onSelect: (id: string | number) => void;
  onClose: () => void;
  /** Optional lists: shows a first row that clears the choice. */
  clearLabel?: string;
  onClear?: () => void;
  /** Search box appears above this many options. */
  searchThreshold?: number;
};

const ROW_HEIGHT = 60;

type RowProps = {
  option: SelectOption;
  selected: boolean;
  onPress: (id: string | number) => void;
};

const OptionRow = memo(function OptionRow({ option, selected, onPress }: RowProps) {
  const brand = useBrand();

  return (
    <Pressable
      accessibilityLabel={option.label}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      android_ripple={{ color: brand.primarySoft }}
      onPress={() => onPress(option.id)}
      style={[styles.row, selected ? { backgroundColor: brand.primarySoft } : null]}
    >
      <View style={styles.rowText}>
        <AppText
          color={selected ? 'brand' : 'primary'}
          numberOfLines={2}
          variant="body"
          weight={selected ? '600' : '400'}
        >
          {option.label}
        </AppText>
        {option.description ? (
          <AppText color="muted" numberOfLines={1} variant="caption">
            {option.description}
          </AppText>
        ) : null}
      </View>
      {selected ? <Icon color={brand.primary} name="check" size={20} /> : null}
    </Pressable>
  );
});

/** Bottom sheet with an optional search box; fast for long lists (virtualised, fixed row height). */
export function OptionSheet({
  visible,
  title,
  options,
  selectedId,
  onSelect,
  onClose,
  clearLabel,
  onClear,
  searchThreshold = 8,
}: OptionSheetProps) {
  const { t } = useTranslation();
  const brand = useBrand();
  const [query, setQuery] = useState('');
  const showSearch = options.length > searchThreshold;

  useEffect(() => {
    if (!visible) setQuery('');
  }, [visible]);

  const data = useMemo(() => {
    const needle = normalizeSearchText(query);
    if (!needle) return options;
    return options.filter((option) =>
      normalizeSearchText(`${option.label} ${option.description ?? ''}`).includes(needle),
    );
  }, [options, query]);

  const handlePress = useCallback(
    (id: string | number) => {
      onSelect(id);
      onClose();
    },
    [onClose, onSelect],
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<SelectOption>) => (
      <OptionRow
        onPress={handlePress}
        option={item}
        selected={selectedId !== null && String(item.id) === String(selectedId)}
      />
    ),
    [handlePress, selectedId],
  );

  return (
    <Modal
      animationType="slide"
      navigationBarTranslucent
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <Pressable
          accessibilityLabel={t.forms.close}
          accessibilityRole="button"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.sheet}>
          <View style={styles.grabber} />
          <View style={styles.header}>
            <AppText style={styles.headerTitle} variant="title">
              {title}
            </AppText>
            <Pressable
              accessibilityLabel={t.forms.close}
              accessibilityRole="button"
              hitSlop={8}
              onPress={onClose}
              style={styles.closeButton}
            >
              <Icon color={colors.text.secondary} name="close" size={22} />
            </Pressable>
          </View>

          {showSearch ? (
            <View style={styles.searchBox}>
              <Icon color={colors.text.muted} name="search" size={18} />
              <TextInput
                accessibilityLabel={t.forms.searchPlaceholder}
                autoCorrect={false}
                onChangeText={setQuery}
                placeholder={t.forms.searchPlaceholder}
                placeholderTextColor={colors.text.muted}
                style={styles.searchInput}
                value={query}
              />
            </View>
          ) : null}

          {onClear && clearLabel ? (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: selectedId === null }}
              onPress={() => {
                onClear();
                onClose();
              }}
              style={[
                styles.row,
                selectedId === null ? { backgroundColor: brand.primarySoft } : null,
              ]}
            >
              <View style={styles.rowText}>
                <AppText
                  color={selectedId === null ? 'brand' : 'secondary'}
                  variant="body"
                  weight="600"
                >
                  {clearLabel}
                </AppText>
              </View>
              {selectedId === null ? <Icon color={brand.primary} name="check" size={20} /> : null}
            </Pressable>
          ) : null}

          <FlatList
            data={data}
            ListEmptyComponent={
              <View style={styles.empty}>
                <AppText align="center" color="muted" variant="bodySmall">
                  {query ? t.forms.noResults : t.forms.noOptions}
                </AppText>
              </View>
            }
            initialNumToRender={12}
            keyExtractor={(item) => String(item.id)}
            keyboardShouldPersistTaps="handled"
            renderItem={renderItem}
            removeClippedSubviews
            style={styles.list}
            windowSize={7}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.overlay,
  },
  sheet: {
    ...shadows.card,
    maxHeight: '78%',
    paddingBottom: spacing.xl,
    borderTopStartRadius: radius.xxl,
    borderTopEndRadius: radius.xxl,
    backgroundColor: colors.background.surface,
  },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    marginTop: spacing.sm,
    borderRadius: 2,
    backgroundColor: colors.border.default,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerTitle: {
    flex: 1,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
    backgroundColor: colors.background.muted,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.input,
    backgroundColor: colors.background.muted,
  },
  searchInput: {
    ...typography.variants.input,
    flex: 1,
    minHeight: 44,
    padding: 0,
    color: colors.text.primary,
  },
  list: {
    flexGrow: 0,
  },
  row: {
    minHeight: ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
  },
  rowText: {
    flex: 1,
    minWidth: 0,
  },
  empty: {
    padding: spacing.xl,
  },
});
