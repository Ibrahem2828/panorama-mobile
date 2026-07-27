import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { StyleSheet, View } from 'react-native';

import { AppText } from '../../../components';
import { colors, spacing } from '../../../theme';

export function NetworkStatusBanner() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(
    () =>
      NetInfo.addEventListener((state) => {
        setIsOffline(state.isConnected === false || state.isInternetReachable === false);
      }),
    [],
  );

  if (!isOffline) return null;

  return (
    <View accessibilityLiveRegion="polite" style={styles.banner}>
      <AppText align="center" color="inverse" variant="caption">
        لا يوجد اتصال بالإنترنت. ستبقى البيانات المحملة ظاهرة وستُعاد المحاولة عند عودة الاتصال.
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.semantic.error,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
});
