import { memo } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { AppText, Icon, type IconName } from '../../../components';
import { AppModal } from '../../../components/overlay';
import { useTranslation } from '../../../i18n';
import { colors, radius, spacing, useBrand } from '../../../theme';
import type { AttachmentSource } from '../services/attachmentPolicy';

type AttachmentSourceSheetProps = {
  visible: boolean;
  sources: readonly AttachmentSource[];
  onSelect: (source: AttachmentSource) => void;
  onClose: () => void;
};

const ICONS: Record<AttachmentSource, IconName> = {
  album: 'image',
  camera: 'camera',
  document: 'file',
};

/** Bottom sheet that lists where an upload can come from: the photo album, the camera, or the device's files. */
export const AttachmentSourceSheet = memo(function AttachmentSourceSheet({
  visible,
  sources,
  onSelect,
  onClose,
}: AttachmentSourceSheetProps) {
  const { t } = useTranslation();
  const brand = useBrand();
  const labels: Record<AttachmentSource, string> = {
    album: t.attachments.sources.album,
    camera: t.attachments.sources.camera,
    document: t.attachments.sources.document,
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
          {sources.map((source) => (
            <Pressable
              accessibilityRole="button"
              key={source}
              onPress={() => {
                onClose();
                onSelect(source);
              }}
              style={({ pressed }) => [styles.row, pressed ? styles.pressed : null]}
            >
              <Icon color={brand.primary} name={ICONS[source]} size={22} />
              <AppText variant="label" weight="600">
                {labels[source]}
              </AppText>
            </Pressable>
          ))}
        </Pressable>
      </Pressable>
    </AppModal>
  );
});

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(16, 24, 40, 0.45)',
  },
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
