import { memo } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { AppText, Icon, type IconName } from '../../../../components';
import { AppModal } from '../../../../components/overlay';
import { useTranslation } from '../../../../i18n';
import { colors, radius, spacing, useBrand } from '../../../../theme';

export type ChatAttachSource = 'album' | 'camera' | 'document' | 'audio';

const SOURCES: readonly { key: ChatAttachSource; icon: IconName }[] = [
  { key: 'album', icon: 'image' },
  { key: 'camera', icon: 'camera' },
  { key: 'document', icon: 'file' },
  { key: 'audio', icon: 'music' },
];

/** Bottom sheet of the chat attach button: photo, camera, PDF/image file and (new) audio file. */
export const ChatAttachSheet = memo(function ChatAttachSheet({
  visible,
  onSelect,
  onClose,
}: {
  visible: boolean;
  onSelect: (source: ChatAttachSource) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const brand = useBrand();
  const labels: Record<ChatAttachSource, string> = {
    album: t.attachments.sources.album,
    camera: t.attachments.sources.camera,
    document: t.attachments.sources.document,
    audio: t.chat.media.attachAudio,
  };

  return (
    <AppModal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <Pressable
        accessibilityLabel={t.attachments.sources.close}
        onPress={onClose}
        style={styles.backdrop}
      >
        <Pressable accessible={false} style={styles.sheet}>
          <AppText align="center" color="muted" variant="caption">
            {t.attachments.sources.title}
          </AppText>
          {SOURCES.map(({ key, icon }) => (
            <Pressable
              accessibilityRole="button"
              key={key}
              onPress={() => {
                onClose();
                onSelect(key);
              }}
              style={({ pressed }) => [styles.row, pressed ? styles.pressed : null]}
            >
              <Icon color={brand.primary} name={icon} size={22} />
              <AppText variant="label" weight="600">
                {labels[key]}
              </AppText>
            </Pressable>
          ))}
        </Pressable>
      </Pressable>
    </AppModal>
  );
});

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(16, 24, 40, 0.45)' },
  sheet: {
    gap: spacing.xs,
    padding: spacing.lg,
    borderTopStartRadius: radius.xl,
    borderTopEndRadius: radius.xl,
    backgroundColor: colors.background.surface,
  },
  row: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.lg,
  },
  pressed: { opacity: 0.7 },
});
