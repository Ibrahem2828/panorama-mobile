import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Icon, type IconName } from '../../../components';
import { colors, layout, radius, spacing, useBrand } from '../../../theme';
import { getIsRTL } from '../../../utils/rtl';

type PrintOptionSectionProps = {
  title: string;
  /** What is currently chosen in this section, shown while it is collapsed. */
  summary?: string;
  icon: IconName;
  defaultOpen?: boolean;
  /** Forces the section open (e.g. it holds a field with an error). */
  forceOpen?: boolean;
  children: ReactNode;
};

/** A collapsible group of related print options: header with the current choices, content below. */
export function PrintOptionSection({
  title,
  summary,
  icon,
  defaultOpen = true,
  forceOpen = false,
  children,
}: PrintOptionSectionProps) {
  const brand = useBrand();
  const [open, setOpen] = useState(defaultOpen);
  const expanded = open || forceOpen;

  return (
    <View style={styles.box}>
      <Pressable
        accessibilityLabel={summary ? `${title}: ${summary}` : title}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={() => setOpen((current) => !current)}
        style={({ pressed }) => [styles.header, pressed ? styles.pressed : null]}
      >
        <View style={[styles.iconTile, { backgroundColor: brand.primarySoft }]}>
          <Icon color={brand.primary} name={icon} size={18} />
        </View>
        <View style={styles.titles}>
          <AppText variant="label" weight="700">
            {title}
          </AppText>
          {!expanded && summary ? (
            <AppText color="muted" numberOfLines={2} variant="caption">
              {summary}
            </AppText>
          ) : null}
        </View>
        <Icon
          color={colors.text.muted}
          name={expanded ? 'chevronDown' : getIsRTL() ? 'chevronLeft' : 'chevronRight'}
          size={20}
        />
      </Pressable>
      {expanded ? <View style={styles.body}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.background.surface,
    overflow: 'hidden',
  },
  header: {
    minHeight: layout.touchTargetMinSize + 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  pressed: { opacity: 0.75 },
  iconTile: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titles: { flex: 1, minWidth: 0, gap: 2 },
  body: {
    gap: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
    paddingTop: spacing.xs,
  },
});
