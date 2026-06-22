import type { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';

import { colors, layout, spacing, typography } from '../../theme';
import { TabRoutes } from '../routes';

export const tabLabels = {
  [TabRoutes.Home]: 'الرئيسية',
  [TabRoutes.Subjects]: 'موادي',
  [TabRoutes.Groups]: 'المجموعات',
  [TabRoutes.Printing]: 'الطباعة',
  [TabRoutes.Profile]: 'حسابي',
} as const;

export const bottomTabScreenOptions: BottomTabNavigationOptions = {
  headerShown: false,
  tabBarIcon: () => null,
  tabBarActiveTintColor: colors.brand.primary,
  tabBarInactiveTintColor: colors.text.muted,
  tabBarLabelPosition: 'below-icon',
  tabBarStyle: {
    minHeight: layout.bottomTabHeight,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    borderTopColor: colors.border.default,
    backgroundColor: colors.background.surface,
  },
  tabBarLabelStyle: {
    ...typography.variants.caption,
    fontWeight: typography.weight.semibold,
    writingDirection: 'rtl',
  },
  tabBarItemStyle: {
    justifyContent: 'center',
  },
};
