import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Icon } from '../../../components';
import { useTranslation } from '../../../i18n';
import { layout, opacity, spacing, useBrand } from '../../../theme';
import { hasHelp, resolveHelp } from '../services/printOptionHelp';
import { usePrintOptionHelpStore } from '../store';
import { PrintOptionHelpSheet } from './PrintOptionHelpSheet';

type PrintHelpButtonProps = {
  /** print_size, print_colour, print_sides, binding, cover, spiral_wire or extra:<section>. */
  topic: string;
  /** The option currently chosen, so its own explanation opens first. */
  selectedKey?: string | null;
  /** Option names by key, for the switcher inside the sheet. */
  labels?: Record<string, string>;
};

/**
 * The small «i» next to an option's label. It only exists when the server has help for the topic, so an option
 * without help shows nothing (and never opens an empty sheet). The hit area is 48dp around a 24dp glyph.
 */
export function PrintHelpButton({ topic, selectedKey, labels }: PrintHelpButtonProps) {
  const { t } = useTranslation();
  const brand = useBrand();
  const [open, setOpen] = useState(false);
  const index = usePrintOptionHelpStore((state) => state.index);
  const available = hasHelp(index, topic);
  const close = useCallback(() => setOpen(false), []);

  if (!available) {
    return null;
  }

  const title = resolveHelp(index, topic, selectedKey)?.title || t.printing.help.sheetTitle;

  return (
    <>
      <Pressable
        accessibilityHint={t.printing.help.hint}
        accessibilityLabel={t.printing.help.label(title)}
        accessibilityRole="button"
        hitSlop={4}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.hit, pressed ? styles.pressed : null]}
      >
        <View style={[styles.glyph, { backgroundColor: brand.primarySoft }]}>
          <Icon color={brand.primary} name="info" size={16} strokeWidth={2.4} />
        </View>
      </Pressable>
      <PrintOptionHelpSheet
        labels={labels}
        onClose={close}
        selectedKey={selectedKey}
        topic={topic}
        visible={open}
      />
    </>
  );
}

type PrintLabelWithHelpProps = PrintHelpButtonProps & { label: string };

/** An option label followed by its «i». */
export function PrintLabelWithHelp({ label, ...help }: PrintLabelWithHelpProps) {
  return (
    <View style={styles.row}>
      <AppText style={styles.label} variant="label">
        {label}
      </AppText>
      <PrintHelpButton {...help} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    // The 48dp hit area of the button is pulled into the row so the label does not get taller.
    minHeight: 24,
  },
  label: { flexShrink: 1 },
  hit: {
    width: layout.touchTargetMinSize,
    height: layout.touchTargetMinSize,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: -12,
    marginHorizontal: -spacing.xs,
  },
  glyph: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: opacity.pressed },
});
