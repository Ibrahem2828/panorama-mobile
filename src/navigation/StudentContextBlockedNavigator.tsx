import { useMemo } from 'react';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StyleSheet, View } from 'react-native';

import { AppButton, AppScreen, ErrorState } from '../components';
import { PdfViewerScreen } from '../features/files/screens/PdfViewerScreen';
import { DownloadsScreen } from '../features/lectures/offline/DownloadsScreen';
import { LectureViewerScreen } from '../features/lectures/screens/LectureViewerScreen';
import { useTranslation } from '../i18n';
import { spacing, useBrand } from '../theme';
import { createNavigationTheme } from './config/navigationTheme';
import { hiddenStackScreenOptions } from './config/screenOptions';
import { HomeRoutes, LecturesRoutes, ProfileRoutes, SharedRoutes } from './routes';
import type { HomeStackParamList } from './types';
import type { StudentContextView } from './guards/studentContextRecovery';

const Stack = createNativeStackNavigator<HomeStackParamList>();

type Props = {
  /** Which message to show: the device is offline, or the account data could not be loaded (or is taking too long). */
  view: Exclude<StudentContextView, 'loading'>;
  /** The load is stuck rather than failed: gentler wording. */
  stuck?: boolean;
  onRetry: () => void;
};

function BlockedScreen({ view, stuck, onRetry }: Props) {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const copy = t.auth.bootstrap;
  const offline = view === 'offline';

  return (
    <AppScreen contentContainerStyle={styles.content} scroll>
      <ErrorState
        kind={offline ? 'offline' : stuck ? 'timeout' : 'generic'}
        message={
          offline ? copy.offlineMessage : stuck ? copy.stuckMessage : copy.studentContextError
        }
        onRetry={onRetry}
        title={offline ? copy.offlineTitle : stuck ? copy.stuckTitle : t.appName}
      />
      <View style={styles.action}>
        <AppButton
          onPress={() => navigation.navigate(ProfileRoutes.Downloads)}
          title={copy.openOffline}
          variant="primary"
        />
      </View>
    </AppScreen>
  );
}

/**
 * Shown instead of an endless spinner when the student's account data cannot be loaded (no connection and nothing saved
 * for it, a server that does not answer). The student can retry, and can always reach what is saved on the phone: the
 * downloads list and the viewers read only local data, so they work with no profile and no network.
 */
export function StudentContextBlockedNavigator(props: Props) {
  const brand = useBrand();
  const navigationTheme = useMemo(() => createNavigationTheme(brand.primary), [brand.primary]);

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator initialRouteName={HomeRoutes.Home} screenOptions={hiddenStackScreenOptions}>
        <Stack.Screen name={HomeRoutes.Home}>{() => <BlockedScreen {...props} />}</Stack.Screen>
        <Stack.Screen component={DownloadsScreen} name={ProfileRoutes.Downloads} />
        <Stack.Screen component={PdfViewerScreen} name={SharedRoutes.PdfViewer} />
        <Stack.Screen component={LectureViewerScreen} name={LecturesRoutes.LectureViewer} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: 'center' },
  action: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
});
