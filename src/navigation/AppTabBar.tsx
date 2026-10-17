import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '../components/common';
import { Icon, type IconName } from '../components/icons';
import { useTranslation } from '../i18n';
import { colors, shadows, useBrand } from '../theme';
import { TabRoutes } from './routes';

const tabIcons: Record<string, IconName> = {
  [TabRoutes.Home]: 'home',
  [TabRoutes.Subjects]: 'book',
  [TabRoutes.Groups]: 'users',
  [TabRoutes.Printing]: 'printer',
  [TabRoutes.Profile]: 'user',
};

export function AppTabBar({ state, navigation }: BottomTabBarProps) {
  const { t } = useTranslation();
  const brand = useBrand();
  const insets = useSafeAreaInsets();

  const labels: Record<string, string> = {
    [TabRoutes.Home]: t.tabs.home,
    [TabRoutes.Subjects]: t.tabs.subjects,
    [TabRoutes.Groups]: t.tabs.groups,
    [TabRoutes.Printing]: t.tabs.printing,
    [TabRoutes.Profile]: t.tabs.profile,
  };

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const color = focused ? brand.primary : colors.text.muted;
        const label = labels[route.name] ?? route.name;

        return (
          <Pressable
            accessibilityLabel={label}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            android_ripple={{ color: brand.primarySoft, borderless: true, radius: 36 }}
            key={route.key}
            onPress={() => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!focused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            }}
            style={styles.item}
          >
            <View style={[styles.pill, focused ? { backgroundColor: brand.primarySoft } : null]}>
              <Icon
                color={color}
                name={tabIcons[route.name] ?? 'home'}
                size={22}
                strokeWidth={focused ? 2.2 : 1.8}
              />
            </View>
            <AppText
              align="center"
              numberOfLines={1}
              style={{ color, fontSize: 11, lineHeight: 16 }}
              variant="caption"
              weight={focused ? '700' : '600'}
            >
              {label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.background.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.default,
    paddingTop: 6,
    ...shadows.md,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    minHeight: 52,
  },
  pill: {
    width: 56,
    height: 30,
    borderRadius: 15,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
