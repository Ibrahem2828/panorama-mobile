import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { StyleSheet, View } from 'react-native';

import { AppText } from '../../../components';
import { colors, spacing } from '../../../theme';
import { useTranslation } from '../../../i18n';

export function NetworkStatusBanner() {
  const { t } = useTranslation();
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
        {t.connectivity.offline}
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
