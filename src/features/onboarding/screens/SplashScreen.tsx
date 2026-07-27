import { StyleSheet } from 'react-native';

import { images } from '../../../assets/images';
import { AppScreen, AppText, Illustration, Stack } from '../../../components';
import { spacing } from '../../../theme';

export function SplashScreen() {
  return (
    <AppScreen contentContainerStyle={styles.content} safeArea>
      <Stack gap="xl" style={styles.center}>
        <Illustration
          accessibilityLabel="شعار بانوراما"
          size="xl"
          source={images.brand.logoFullAr}
        />
        <Stack gap="sm">
          <AppText align="center" variant="h1">
            بانوراما
          </AppText>
          <AppText align="center" color="secondary" variant="body">
            كل جامعتك في مكان واحد
          </AppText>
        </Stack>
      </Stack>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, padding: spacing.xl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
