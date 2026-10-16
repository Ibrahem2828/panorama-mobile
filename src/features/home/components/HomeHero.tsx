import { LinearGradient } from 'expo-linear-gradient';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { AppText, Icon } from '../../../components';
import { useTranslation } from '../../../i18n';
import { colors, radius, useBrand } from '../../../theme';

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

  return (
    <LinearGradient
      colors={[brand.deep, brand.primary]}
      end={{ x: 1, y: 1 }}
      start={{ x: 0, y: 0 }}
      style={styles.hero}
    >
      <View style={styles.topRow}>
        <View style={styles.logoBadge}>
          <Image
            accessibilityIgnoresInvertColors
            resizeMode="contain"
            source={brand.logo}
            style={styles.logo}
          />
        </View>
        <View style={styles.textBlock}>
          <AppText style={styles.greeting} variant="caption" weight="600">
            {t.home.hero.welcome}
          </AppText>
          <AppText numberOfLines={1} style={styles.name} variant="h3">
            {name ?? t.home.hero.guest}
          </AppText>
        </View>
        <Pressable
          accessibilityLabel={t.home.hero.notifications}
          accessibilityRole="button"
          onPress={onOpenNotifications}
          style={styles.bell}
        >
          <Icon color="#FFFFFF" name="bell" size={22} />
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
              <Icon color="#FFFFFF" name="cap" size={14} />
              <AppText numberOfLines={1} style={styles.chipText} variant="caption" weight="600">
                {facultyName}
              </AppText>
            </View>
          ) : null}
          {levelLabel ? (
            <View style={styles.chip}>
              <AppText numberOfLines={1} style={styles.chipText} variant="caption" weight="600">
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
        <Icon color={colors.text.muted} name="search" size={20} />
        <AppText color="muted" variant="bodySmall">
          {t.home.hero.searchPlaceholder}
        </AppText>
      </Pressable>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: 16,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 22,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoBadge: {
    width: 56,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: { width: 48, height: 38 },
  textBlock: { flex: 1, minWidth: 0 },
  greeting: { color: 'rgba(255,255,255,0.78)' },
  name: { color: '#FFFFFF' },
  bell: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  dot: {
    position: 'absolute',
    top: 2,
    end: 2,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotText: { color: '#FFFFFF', fontSize: 10, lineHeight: 14 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: '100%',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  chipText: { color: '#FFFFFF' },
  search: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    borderRadius: radius.xl,
    backgroundColor: '#FFFFFF',
  },
});
