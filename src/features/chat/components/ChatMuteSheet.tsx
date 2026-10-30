import { memo, useCallback } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Icon } from '../../../components';
import type { IconName } from '../../../components/icons';
import { AppModal } from '../../../components/overlay';
import { useTranslation } from '../../../i18n';
import { useNetworkStore } from '../../../offline/networkStore';
import { colors, radius, shadows, spacing, useBrand } from '../../../theme';
import { useNotificationPrefsStore } from '../../notifications/store/notificationPrefsStore';
import { isEffectivelyMuted, type ChatKind, type ChatMuteChoice } from '../logic/mute';
import { useChatMuteStore } from '../store/chatMuteStore';
import { muteStatusText } from './muteFormat';
import { useMuteNow } from './useMuteExpiry';

export type MuteSheetTarget = {
  groupId: string | number;
  name: string;
  kind: ChatKind;
};

type ChatMuteSheetProps = {
  /** The chat to configure; null keeps the sheet closed. */
  target: MuteSheetTarget | null;
  onClose: () => void;
};

type OptionDef = { choice: ChatMuteChoice; icon: IconName };

const MUTE_OPTIONS: readonly OptionDef[] = [
  { choice: '8h', icon: 'bellOff' },
  { choice: '1w', icon: 'bellOff' },
  { choice: 'forever', icon: 'bellOff' },
];

function SheetBody({ target, onClose }: { target: MuteSheetTarget; onClose: () => void }) {
  const { t, locale } = useTranslation();
  const brand = useBrand();
  const copy = t.chat.mute;
  const key = String(target.groupId);
  const pref = useChatMuteStore((state) => state.byGroup[key]);
  const setMute = useChatMuteStore((state) => state.setMute);
  const isOnline = useNetworkStore((state) => state.isOnline);
  const communitiesMuted = useNotificationPrefsStore((state) => state.prefs?.muteCommunities);
  const now = useMuteNow(pref);
  const muted = isEffectivelyMuted(pref, now);
  const byCommunities = communitiesMuted === true && target.kind === 'community';
  const labels: Record<ChatMuteChoice, string> = {
    '8h': copy.option8h,
    '1w': copy.option1w,
    forever: copy.optionForever,
    unmute: copy.optionUnmute,
  };
  const status = byCommunities ? copy.mutedByCommunities : muteStatusText(pref, now, copy, locale);

  const choose = useCallback(
    (choice: ChatMuteChoice) => {
      void setMute(target.groupId, choice, { name: target.name, kind: target.kind });
      onClose();
    },
    [onClose, setMute, target.groupId, target.kind, target.name],
  );

  const options: OptionDef[] = muted
    ? [{ choice: 'unmute', icon: 'bell' }, ...MUTE_OPTIONS]
    : [...MUTE_OPTIONS];

  return (
    <View style={styles.overlay}>
      <Pressable
        accessibilityLabel={t.chat.actions.close}
        accessibilityRole="button"
        onPress={onClose}
        style={StyleSheet.absoluteFill}
      />
      <View accessibilityViewIsModal style={styles.sheet}>
        <View style={styles.grabber} />
        <View style={styles.header}>
          <AppText accessibilityRole="header" numberOfLines={1} variant="title">
            {copy.sheetTitle}
          </AppText>
          <AppText color="secondary" numberOfLines={1} variant="bodySmall">
            {target.name}
          </AppText>
          <View accessibilityLiveRegion="polite" style={styles.statusRow}>
            <Icon
              color={muted ? colors.text.muted : brand.primary}
              name={muted ? 'bellOff' : 'bell'}
              size={16}
            />
            <AppText color={muted ? 'muted' : 'brand'} variant="caption" weight="600">
              {status}
            </AppText>
          </View>
          {byCommunities ? (
            <AppText color="muted" variant="caption">
              {copy.mutedByCommunitiesHint}
            </AppText>
          ) : null}
          {!isOnline ? (
            <AppText color="error" variant="caption">
              {copy.offlineHint}
            </AppText>
          ) : null}
        </View>

        {options.map((option) => (
          <Pressable
            accessibilityLabel={labels[option.choice]}
            accessibilityRole="button"
            accessibilityState={{ disabled: !isOnline }}
            android_ripple={{ color: brand.primarySoft }}
            disabled={!isOnline}
            key={option.choice}
            onPress={() => choose(option.choice)}
            style={[styles.option, !isOnline ? styles.disabled : null]}
          >
            <Icon
              color={option.choice === 'unmute' ? brand.primary : colors.text.secondary}
              name={option.icon}
              size={20}
            />
            <AppText
              color={option.choice === 'unmute' ? 'brand' : 'primary'}
              variant="body"
              weight={option.choice === 'unmute' ? '700' : '500'}
            >
              {labels[option.choice]}
            </AppText>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

/** Bottom sheet that mutes a chat for 8 hours, a week or for good, or unmutes it. Opened by the bell and by long-press. */
export const ChatMuteSheet = memo(function ChatMuteSheet({ target, onClose }: ChatMuteSheetProps) {
  return (
    <AppModal animationType="slide" onRequestClose={onClose} transparent visible={target !== null}>
      {target ? <SheetBody onClose={onClose} target={target} /> : <View />}
    </AppModal>
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.overlay,
  },
  sheet: {
    ...shadows.card,
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
    gap: spacing.xs,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  option: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
  },
  disabled: {
    opacity: 0.45,
  },
});
