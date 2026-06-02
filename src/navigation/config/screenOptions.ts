import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';

import { colors } from '../../theme';

export const hiddenStackScreenOptions: NativeStackNavigationOptions = {
  headerShown: false,
  contentStyle: {
    backgroundColor: colors.background.primary,
  },
};
