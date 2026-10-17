import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';

import { colors } from '../../theme';
import { getIsRTL } from '../../utils/rtl';

export const hiddenStackScreenOptions: NativeStackNavigationOptions = {
  headerShown: false,
  // Physical direction: pushes enter from the leading edge, which is the left under RTL.
  animation: getIsRTL() ? 'slide_from_left' : 'slide_from_right',
  animationDuration: 260,
  contentStyle: {
    backgroundColor: colors.background.primary,
  },
};
