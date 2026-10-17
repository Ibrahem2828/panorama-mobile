import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';

import { AppText, Icon } from '../../../components';
import { useTranslation } from '../../../i18n';
import { colors, radius, shadows, useBrand } from '../../../theme';

type HomeHeroProps = {
  displayName?: string | null;
  facultyName?: string | null;
  levelLabel?: string | null;
  unreadCount: number;
  onOpenNotifications?: () => void;
  onOpenSearch?: () => void;
};

function firstName(name?: string | null) {
  return name?.trim().split(/\s+/u)[0] ?? null;
}

/**
 * Light hero: the faculty logo is a transparent cut-out, so it sits straight on the soft faculty tint
 * with no box behind it. Colour comes from the student's faculty through `useBrand()`.
 */
export function HomeHero({
  displayName,
  facultyName,
  levelLabel,
  unreadCount,
  onOpenNotifications,
  onOpenSearch,
}: HomeHeroProps) {
  const { t } = useTranslation();
  const brand = useBrand();
  const name = firstName(displayName);
  const intro = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(intro, { toValue: 1, friction: 6, tension: 70, useNativeDriver: true }).start();
  }, [intro]);

  return (
    <View style={[styles.hero, { backgroundColor: brand.primarySoft }]}>
      <View
        pointerEvents="none"
        style={[styles.circleLarge, { backgroundColor: brand.ribbon[0] }]}
      />
      <View
        pointerEvents="none"
        style={[styles.circleSmall, { backgroundColor: brand.ribbon[1] }]}
      />

      <View style={styles.topRow}>
        <Animated.Image
          accessibilityIgnoresInvertColors
          resizeMode="contain"
          source={brand.logo}
          style={[
            styles.logo,
            {
              opacity: intro,
              transform: [
                { scale: intro.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) },
              ],
            },
          ]}
        />
        <View style={styles.textBlock}>
          <AppText color="secondary" variant="caption" weight="600">
            {t.home.hero.welcome}
          </AppText>
          <AppText numberOfLines={1} variant="h3">
            {name ?? t.home.hero.guest}
          </AppText>
        </View>
        <Pressable
          accessibilityLabel={t.home.hero.notifications}
          accessibilityRole="button"
          onPress={onOpenNotifications}
          style={styles.bell}
        >
          <Icon color={brand.primary} name="bell" size={22} />
          {unreadCount > 0 ? (
            <View style={[styles.dot, { backgroundColor: brand.accent }]}>
              <AppText style={styles.dotText} variant="caption" weight="700">
                {unreadCount > 9 ? '9+' : String(unreadCount)}
              </AppText>
            </View>
          ) : null}
        </Pressable>
      </View>

      {facultyName || levelLabel ? (
        <View style={styles.chips}>
          {facultyName ? (
            <View style={styles.chip}>
              <Icon color={brand.primary} name="cap" size={14} />
              <AppText
                numberOfLines={1}
                style={{ color: brand.primary }}
                variant="caption"
                weight="700"
              >
                {facultyName}
              </AppText>
            </View>
          ) : null}
          {levelLabel ? (
            <View style={styles.chip}>
              <AppText color="secondary" numberOfLines={1} variant="caption" weight="600">
                {levelLabel}
              </AppText>
            </View>
          ) : null}
        </View>
      ) : null}

      <Pressable
        accessibilityLabel={t.home.hero.searchPlaceholder}
        accessibilityRole="search"
        onPress={onOpenSearch}
        style={styles.search}
      >
        <Icon color={brand.primary} name="search" size={20} />
        <AppText color="muted" variant="bodySmall">
          {t.home.hero.searchPlaceholder}
        </AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  circleLarge: {
    position: 'absolute',
    top: -90,
    end: -70,
    width: 240,
    height: 240,
    borderRadius: 120,
    opacity: 0.22,
  },
  circleSmall: {
    position: 'absolute',
    bottom: -70,
    start: -50,
    width: 170,
    height: 170,
    borderRadius: 85,
    opacity: 0.12,
  },
  hero: {
    overflow: 'hidden',
    gap: 14,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 22,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  logo: { width: 112, height: 88 },
  textBlock: { flex: 1, minWidth: 0 },
  bell: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.default,
    ...shadows.sm,
  },
  dot: {
    position: 'absolute',
    top: 0,
    end: 0,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotText: { color: colors.text.inverse, fontSize: 10, lineHeight: 14 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: '100%',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.glass,
  },
  search: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    borderRadius: radius.xl,
    backgroundColor: colors.background.surface,
    borderWidth: 1,
    borderColor: colors.border.default,
    ...shadows.xs,
  },
});
