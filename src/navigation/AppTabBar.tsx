import type { ReactNode } from 'react';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '../components/common';
import { totalUnread, useChatUnreadStore } from '../features/chat/store/unreadStore';
import { tabBadgeCounts } from '../features/notifications/services/notificationPrefs';
import { useNotificationPrefsStore } from '../features/notifications/store/notificationPrefsStore';
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

/** Active-tab indicator: the soft pill grows from the centre and the icon lifts slightly. */
function TabPill({ focused, children }: { focused: boolean; children: ReactNode }) {
  const brand = useBrand();
  const progress = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(progress, {
      toValue: focused ? 1 : 0,
      friction: 7,
      tension: 120,
      useNativeDriver: true,
    }).start();
  }, [focused, progress]);

  return (
    <View style={styles.pill}>
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: brand.primarySoft,
            opacity: progress,
            transform: [
              { scaleX: progress.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) },
            ],
          },
        ]}
      />
      <Animated.View
        style={{
          transform: [
            { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [0, -1] }) },
            { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] }) },
          ],
        }}
      >
        {children}
      </Animated.View>
    </View>
  );
}

/** Unread numbers per tab: chat + groups on Groups, print updates on Printing, everything else on Profile (the inbox). */
function useTabBadges(): Record<string, number> {
  const summary = useNotificationPrefsStore((state) => state.summary);
  const chatUnread = useChatUnreadStore((state) => totalUnread(state.byGroup));
  const counts = tabBadgeCounts({ summary, chatUnread });

  return {
    [TabRoutes.Groups]: counts.groups,
    [TabRoutes.Printing]: counts.printing,
    [TabRoutes.Profile]: counts.profile,
  };
}

export function AppTabBar({ state, navigation }: BottomTabBarProps) {
  const { t } = useTranslation();
  const brand = useBrand();
  const insets = useSafeAreaInsets();
  const badges = useTabBadges();

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
            accessibilityLabel={
              badges[route.name]
                ? `${label}, ${t.notifications.badgeCount(badges[route.name] ?? 0)}`
                : label
            }
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
            <TabPill focused={focused}>
              <Icon
                color={color}
                name={tabIcons[route.name] ?? 'home'}
                size={22}
                strokeWidth={focused ? 2.2 : 1.8}
              />
            </TabPill>
            {badges[route.name] ? (
              <View style={[styles.badge, { backgroundColor: colors.semantic.error }]}>
                <AppText color="inverse" style={styles.badgeText} variant="caption" weight="700">
                  {t.notifications.badgeCount(badges[route.name] ?? 0)}
                </AppText>
              </View>
            ) : null}
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
  badge: {
    position: 'absolute',
    top: 2,
    start: '50%',
    marginStart: 6,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
  },
  badgeText: { fontSize: 10, lineHeight: 14 },
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
