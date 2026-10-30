import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, SectionList, StyleSheet, Switch, View } from 'react-native';

import {
  AppHeader,
  AppScreen,
  AppText,
  AppTextInput,
  EmptyState,
  ErrorState,
  Icon,
  LoadingState,
} from '../../../components';
import { useTranslation } from '../../../i18n';
import type { ProfileStackParamList } from '../../../navigation/types';
import { useNetworkStore } from '../../../offline/networkStore';
import { useRefreshOnReconnect } from '../../../offline/useRefreshOnReconnect';
import { colors, radius, spacing, useBrand } from '../../../theme';
import { ChatMuteSheet, type MuteSheetTarget } from '../components/ChatMuteSheet';
import { muteStatusText } from '../components/muteFormat';
import { useMuteNow } from '../components/useMuteExpiry';
import {
  isEffectivelyMuted,
  sectionMutedChats,
  shouldShowMutedSearch,
  type MutedChatItem,
} from '../logic/mute';
import { useChatMuteStore } from '../store/chatMuteStore';

type Props = NativeStackScreenProps<ProfileStackParamList, 'MutedChats'>;

type Section = { key: 'communities' | 'subjects'; title: string; data: MutedChatItem[] };

const MutedRow = memo(function MutedRow({
  item,
  editable,
  onOpen,
}: {
  item: MutedChatItem;
  editable: boolean;
  onOpen: (item: MutedChatItem) => void;
}) {
  const { t, locale } = useTranslation();
  const brand = useBrand();
  const copy = t.chat.mute;
  const now = useMuteNow(item.pref);
  const muted = isEffectivelyMuted(item.pref, now);
  const status = muteStatusText(item.pref, now, copy, locale);
  const handleOpen = useCallback(() => onOpen(item), [item, onOpen]);

  return (
    <Pressable
      accessibilityHint={editable ? copy.rowOptions(item.name) : copy.offlineHint}
      accessibilityLabel={copy.rowMutedLabel(item.name, status)}
      accessibilityRole="button"
      accessibilityState={{ disabled: !editable }}
      android_ripple={{ color: brand.primarySoft }}
      disabled={!editable}
      onPress={handleOpen}
      style={styles.row}
    >
      <Icon color={muted ? colors.text.muted : brand.primary} name={muted ? 'bellOff' : 'bell'} />
      <View style={styles.rowText}>
        <AppText numberOfLines={2} variant="body" weight="600">
          {item.name}
        </AppText>
        <AppText color={muted ? 'muted' : 'secondary'} variant="caption">
          {status}
        </AppText>
      </View>
      <Switch
        accessibilityLabel={copy.rowMutedLabel(item.name, status)}
        disabled={!editable}
        onValueChange={handleOpen}
        thumbColor={colors.background.surface}
        trackColor={{ false: colors.border.strong, true: brand.primary }}
        value={muted}
      />
    </Pressable>
  );
});

/**
 * Settings > Notifications > «المحادثات المكتومة»: every chat and community of the user in two sections, each with a switch
 * that opens the same mute sheet as the chat room. Offline it shows the saved list read-only.
 */
export function MutedChatsScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const copy = t.chat.mute;
  const items = useChatMuteStore((state) => state.items);
  const byGroup = useChatMuteStore((state) => state.byGroup);
  const isLoading = useChatMuteStore((state) => state.isLoading);
  const loadFailed = useChatMuteStore((state) => state.loadFailed);
  const loadAll = useChatMuteStore((state) => state.loadAll);
  const isOnline = useNetworkStore((state) => state.isOnline);
  const [query, setQuery] = useState('');
  const [target, setTarget] = useState<MuteSheetTarget | null>(null);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  useRefreshOnReconnect(() => void loadAll());

  const live = useMemo(
    () => (items ?? []).map((item) => ({ ...item, pref: byGroup[item.groupId] ?? item.pref })),
    [items, byGroup],
  );
  const sections = useMemo<Section[]>(() => {
    const split = sectionMutedChats(live, query);
    const all: Section[] = [
      { key: 'communities', title: copy.list.communitiesSection, data: split.communities },
      { key: 'subjects', title: copy.list.subjectsSection, data: split.subjects },
    ];

    return all.filter((section) => section.data.length > 0);
  }, [copy.list.communitiesSection, copy.list.subjectsSection, live, query]);

  const handleOpen = useCallback(
    (item: MutedChatItem) => setTarget({ groupId: item.groupId, name: item.name, kind: item.kind }),
    [],
  );
  const handleClose = useCallback(() => setTarget(null), []);
  const handleBack = useCallback(() => navigation.goBack(), [navigation]);

  let body;

  if (items === null && isLoading) {
    body = <LoadingState message={t.common.loading} />;
  } else if (items === null && loadFailed) {
    body = <ErrorState message={copy.list.loadFailed} onRetry={() => void loadAll()} />;
  } else if (items !== null && items.length === 0) {
    body = <EmptyState message={copy.list.emptyMessage} title={copy.list.emptyTitle} />;
  } else {
    body = (
      <SectionList
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        keyExtractor={(item) => item.groupId}
        ListEmptyComponent={
          <View style={styles.empty}>
            <AppText align="center" color="muted" variant="bodySmall">
              {copy.list.noResults}
            </AppText>
          </View>
        }
        renderItem={({ item }) => <MutedRow editable={isOnline} item={item} onOpen={handleOpen} />}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <AppText accessibilityRole="header" color="muted" variant="caption" weight="700">
              {section.title}
            </AppText>
          </View>
        )}
        sections={sections}
        stickySectionHeadersEnabled={false}
      />
    );
  }

  return (
    <AppScreen>
      <View style={styles.top}>
        <AppHeader
          onBack={handleBack}
          showBack
          subtitle={copy.list.subtitle}
          title={copy.list.title}
        />
        {!isOnline ? (
          <View accessibilityLiveRegion="polite" style={styles.offline}>
            <Icon color={colors.text.secondary} name="wifiOff" size={18} />
            <AppText color="secondary" style={styles.rowText} variant="caption">
              {copy.list.offlineReadOnly}
            </AppText>
          </View>
        ) : null}
        {items !== null && shouldShowMutedSearch(items.length) ? (
          <AppTextInput
            accessibilityLabel={copy.list.searchPlaceholder}
            autoCorrect={false}
            onChangeText={setQuery}
            placeholder={copy.list.searchPlaceholder}
            returnKeyType="search"
            value={query}
          />
        ) : null}
      </View>
      <View style={styles.flex}>{body}</View>
      <ChatMuteSheet onClose={handleClose} target={target} />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  top: { gap: spacing.md, paddingHorizontal: spacing.lg },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  sectionHeader: { paddingTop: spacing.lg, paddingBottom: spacing.xs },
  row: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.default,
  },
  rowText: { flex: 1, minWidth: 0, gap: spacing.xxs },
  offline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.background.muted,
  },
  empty: { padding: spacing.xl },
});
