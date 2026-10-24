import { memo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppIconButton, AppText, Icon } from '../../../components';
import type { IconName } from '../../../components/icons/Icon';
import { useTranslation } from '../../../i18n';
import { colors, radius, spacing, useBrand } from '../../../theme';
import { HIGHLIGHT_COLORS, PEN_COLORS } from './geometry';
import type { Tool } from './AnnotationLayer';

type Props = {
  tool: Tool;
  color: string;
  width: number;
  canUndo: boolean;
  canRedo: boolean;
  onTool: (tool: Tool) => void;
  onColor: (color: string) => void;
  onWidth: (width: number) => void;
  onUndo: () => void;
  onRedo: () => void;
};

const TOOLS: { tool: Tool; icon: IconName }[] = [
  { tool: 'highlight', icon: 'star' },
  { tool: 'underline', icon: 'minus' },
  { tool: 'pen', icon: 'pencil' },
  { tool: 'note', icon: 'chat' },
  { tool: 'eraser', icon: 'trash' },
];

/** Default colour when switching tools: highlights/underlines use the soft palette, the pen the ink palette. */
export function defaultColorFor(tool: Tool): string {
  return tool === 'pen' ? 'black' : 'yellow';
}

export const AnnotationToolbar = memo(function AnnotationToolbar({
  tool,
  color,
  width,
  canUndo,
  canRedo,
  onTool,
  onColor,
  onWidth,
  onUndo,
  onRedo,
}: Props) {
  const { t } = useTranslation();
  const brand = useBrand();
  const palette =
    tool === 'pen'
      ? Object.keys(PEN_COLORS)
      : tool === 'highlight' || tool === 'underline'
        ? Object.keys(HIGHLIGHT_COLORS)
        : [];
  const swatch = (name: string) =>
    (HIGHLIGHT_COLORS as Record<string, string>)[name] ??
    (PEN_COLORS as Record<string, string>)[name] ??
    '#000';

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.row}
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        {TOOLS.map((entry) => (
          <AppIconButton
            accessibilityLabel={t.docViewer.tools[entry.tool]}
            icon={
              <Icon
                color={tool === entry.tool ? brand.onPrimary : colors.text.secondary}
                name={entry.icon}
                size={20}
              />
            }
            key={entry.tool}
            onPress={() => onTool(entry.tool)}
            variant={tool === entry.tool ? 'primary' : 'ghost'}
          />
        ))}
        <View style={styles.divider} />
        <AppIconButton
          accessibilityLabel={t.docViewer.undo}
          disabled={!canUndo}
          icon={<Icon color={colors.text.secondary} name="refresh" size={20} />}
          onPress={onUndo}
          variant="ghost"
        />
        <AppIconButton
          accessibilityLabel={t.docViewer.redo}
          disabled={!canRedo}
          icon={
            <View style={styles.mirrored}>
              <Icon color={colors.text.secondary} name="refresh" size={20} />
            </View>
          }
          onPress={onRedo}
          variant="ghost"
        />
      </ScrollView>

      {palette.length > 0 || tool === 'pen' ? (
        <View style={styles.row}>
          {palette.map((name) => (
            <Pressable
              accessibilityLabel={
                t.docViewer.colors[name as keyof typeof t.docViewer.colors] ?? name
              }
              accessibilityRole="button"
              accessibilityState={{ selected: color === name }}
              key={name}
              onPress={() => onColor(name)}
              style={[
                styles.swatch,
                { backgroundColor: swatch(name) },
                color === name ? { borderColor: brand.primary, borderWidth: 3 } : null,
              ]}
            />
          ))}
          {tool === 'pen' ? (
            <>
              <View style={styles.divider} />
              {[1, 2].map((value) => (
                <Pressable
                  accessibilityLabel={value === 1 ? t.docViewer.thin : t.docViewer.thick}
                  accessibilityRole="button"
                  accessibilityState={{ selected: width === value }}
                  key={value}
                  onPress={() => onWidth(value)}
                  style={[
                    styles.widthButton,
                    width === value ? { borderColor: brand.primary } : null,
                  ]}
                >
                  <View style={[styles.widthLine, { height: value === 1 ? 2 : 6 }]} />
                </Pressable>
              ))}
            </>
          ) : null}
          <AppText color="muted" variant="caption">
            {t.docViewer.writeHint}
          </AppText>
        </View>
      ) : (
        <AppText color="muted" variant="caption">
          {tool === 'note' ? t.docViewer.noteHint : t.docViewer.eraserHint}
        </AppText>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.background.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.default,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexWrap: 'wrap' },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border.default,
    marginHorizontal: spacing.xs,
  },
  mirrored: { transform: [{ scaleX: -1 }] },
  swatch: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  widthButton: {
    width: 40,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  widthLine: { width: 24, borderRadius: radius.full, backgroundColor: colors.text.primary },
});
