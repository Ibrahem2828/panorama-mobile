import { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';

import type { PrintOptionHelpItem } from '../../../api/types';
import { AppButton, AppText, Icon } from '../../../components';
import { Skeleton } from '../../../components/feedback';
import { AppModal } from '../../../components/overlay';
import { buildApiUrl } from '../../../config/env';
import { useTranslation } from '../../../i18n';
import { colors, radius, shadows, spacing, useBrand } from '../../../theme';
import { isSafeImageUrl, resolveHelp } from '../services/printOptionHelp';
import { usePrintOptionHelpStore } from '../store';

const IMAGE_HEIGHT = 180;

type PrintOptionHelpSheetProps = {
  visible: boolean;
  topic: string;
  /** The option the student has chosen: its entry is opened first. */
  selectedKey?: string | null;
  /** Names of the options (key -> label), used by the switcher when the topic has several entries. */
  labels?: Record<string, string>;
  onClose: () => void;
};

function HelpIllustration({ item }: { item: PrintOptionHelpItem }) {
  const { t } = useTranslation();
  const [state, setState] = useState<'loading' | 'ready' | 'failed'>('loading');
  const url = isSafeImageUrl(item.image_url) ? buildApiUrl(item.image_url) : null;

  useEffect(() => setState('loading'), [url]);

  if (!url) {
    return null;
  }

  return (
    <View style={styles.figure}>
      <View style={styles.imageBox}>
        {state !== 'failed' ? (
          <Image
            accessibilityIgnoresInvertColors
            accessibilityLabel={item.image_caption || item.title}
            onError={() => setState('failed')}
            onLoad={() => setState('ready')}
            resizeMode="contain"
            source={{ uri: url }}
            style={styles.image}
          />
        ) : (
          <View style={styles.imageFallback}>
            <Icon color={colors.text.muted} name="image" size={28} />
            <AppText align="center" color="muted" variant="caption">
              {t.printing.help.imageFailed}
            </AppText>
          </View>
        )}
        {state === 'loading' ? (
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            <Skeleton borderRadius={radius.lg} height={IMAGE_HEIGHT} />
          </View>
        ) : null}
      </View>
      {item.image_caption ? (
        <AppText color="muted" variant="caption">
          {item.image_caption}
        </AppText>
      ) : null}
    </View>
  );
}

function SheetBody({
  topic,
  selectedKey,
  labels,
  onClose,
}: Omit<PrintOptionHelpSheetProps, 'visible'>) {
  const { t } = useTranslation();
  const brand = useBrand();
  const { height } = useWindowDimensions();
  const index = usePrintOptionHelpStore((state) => state.index);
  const entries = useMemo(() => index.byTopic[topic] ?? [], [index, topic]);
  const initial = resolveHelp(index, topic, selectedKey);
  const [chosenId, setChosenId] = useState<number | null>(null);
  const item = entries.find((entry) => entry.id === chosenId) ?? initial;

  // Never an empty sheet: without any entry for the topic there is nothing to draw.
  if (!item) {
    return <View />;
  }

  const entryName = (entry: PrintOptionHelpItem) =>
    (entry.key ? labels?.[entry.key] : undefined) || entry.title || entry.key;

  return (
    <View style={styles.overlay}>
      <Pressable
        accessibilityLabel={t.printing.help.close}
        accessibilityRole="button"
        onPress={onClose}
        style={StyleSheet.absoluteFill}
      />
      <View accessibilityViewIsModal style={[styles.sheet, { maxHeight: height * 0.88 }]}>
        <View style={styles.grabber} />
        <View style={styles.headerRow}>
          <View style={[styles.badge, { backgroundColor: brand.primarySoft }]}>
            <Icon color={brand.primary} name="info" size={18} />
          </View>
          <AppText accessibilityRole="header" color="brand" variant="label" weight="700">
            {t.printing.help.sheetTitle}
          </AppText>
        </View>

        {entries.length > 1 ? (
          <ScrollView
            contentContainerStyle={styles.switcher}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.switcherScroll}
          >
            {entries.map((entry) => {
              const selected = entry.id === item.id;

              return (
                <Pressable
                  accessibilityRole="tab"
                  accessibilityState={{ selected }}
                  key={entry.id}
                  onPress={() => setChosenId(entry.id)}
                  style={[
                    styles.switchChip,
                    selected
                      ? { backgroundColor: brand.primary, borderColor: brand.primary }
                      : null,
                  ]}
                >
                  <AppText
                    color={selected ? 'inverse' : 'secondary'}
                    numberOfLines={1}
                    variant="caption"
                    weight="700"
                  >
                    {entryName(entry)}
                  </AppText>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : null}

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator
          style={styles.scroll}
        >
          <HelpIllustration item={item} key={item.id} />
          {item.title ? <AppText variant="h3">{item.title}</AppText> : null}
          {item.body ? (
            <AppText color="secondary" style={styles.body} variant="body">
              {item.body}
            </AppText>
          ) : null}
        </ScrollView>

        <View style={styles.footer}>
          <AppButton
            accessibilityLabel={t.printing.help.close}
            fullWidth
            onPress={onClose}
            title={t.printing.help.close}
            variant="primary"
          />
        </View>
      </View>
    </View>
  );
}

/** Bottom sheet «توضيح»: one option's explanation, with an optional illustration. Draws nothing without help. */
export function PrintOptionHelpSheet({
  visible,
  topic,
  selectedKey,
  labels,
  onClose,
}: PrintOptionHelpSheetProps) {
  return (
    <AppModal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      {visible ? (
        <SheetBody labels={labels} onClose={onClose} selectedKey={selectedKey} topic={topic} />
      ) : (
        <View />
      )}
    </AppModal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.overlay },
  sheet: {
    ...shadows.card,
    paddingBottom: spacing.lg,
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  badge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switcherScroll: { flexGrow: 0 },
  switcher: {
    gap: spacing.xs,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xs,
  },
  switchChip: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.background.surface,
  },
  scroll: { flexShrink: 1 },
  content: {
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  figure: { gap: spacing.xs },
  imageBox: {
    height: IMAGE_HEIGHT,
    overflow: 'hidden',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.background.muted,
  },
  image: { width: '100%', height: '100%' },
  imageFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    padding: spacing.md,
  },
  body: { lineHeight: 28 },
  footer: { paddingHorizontal: spacing.xl, paddingTop: spacing.xs },
});
