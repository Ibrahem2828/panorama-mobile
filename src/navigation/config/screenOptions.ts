import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';

import { colors } from '../../theme';

export const hiddenStackScreenOptions: NativeStackNavigationOptions = {
  headerShown: false,
  animation: 'slide_from_right',
  animationDuration: 260,
  contentStyle: {
    backgroundColor: colors.background.primary,
  },
};
