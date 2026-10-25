import { useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Image, StyleSheet, View } from 'react-native';

import { AppButton, AppScreen, AppText, Stack } from '../../../components';
import { useTranslation } from '../../../i18n';
import { PublicRoutes } from '../../../navigation/routes';
import type { PublicStackParamList } from '../../../navigation/types';
import { spacing, useBrand } from '../../../theme';
import { PermissionsPanel } from '../components/PermissionsPanel';
import { markPermissionsIntroSeen } from '../permissionsService';
import { hasOpenPermissions } from '../permissionState';
import { usePermissions } from '../usePermissions';

type Props = NativeStackScreenProps<PublicStackParamList, 'Permissions'>;

/**
 * First-run screen shown once, right after the intro slides and before sign-in: it explains each permission in plain words,
 * asks for them one dialog at a time, and can be skipped (every feature asks again in context when it needs one).
 * It sits before sign-in because none of these permissions depend on an account, and a student who denies notifications
 * here still finds the switch in Settings > Permissions.
 */
export function PermissionsOnboardingScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const brand = useBrand();
  const copy = t.permissions;
  const { snapshot, busyKey, request, allowAll } = usePermissions();
  const [leaving, setLeaving] = useState(false);
  const open = hasOpenPermissions(snapshot);

  async function finish() {
    setLeaving(true);

    try {
      await markPermissionsIntroSeen();
    } finally {
      navigation.replace(PublicRoutes.Login);
    }
  }

  return (
    <AppScreen contentContainerStyle={styles.content} scroll>
      <Stack gap="lg">
        <View style={styles.hero}>
          <Image
            accessibilityIgnoresInvertColors
            resizeMode="contain"
            source={brand.logo}
            style={styles.logo}
          />
          <AppText align="center" variant="title">
            {copy.introTitle}
          </AppText>
          <AppText align="center" color="secondary" variant="body">
            {copy.introBody}
          </AppText>
        </View>

        <PermissionsPanel
          busyKey={busyKey}
          onAllowAll={() => void allowAll()}
          onRequest={(key) => void request(key)}
          snapshot={snapshot}
        />

        <Stack gap="sm">
          <AppButton
            disabled={busyKey !== null}
            loading={leaving}
            onPress={() => void finish()}
            title={open ? copy.skipForNow : copy.continue}
            variant={open ? 'outline' : 'primary'}
          />
          {open ? (
            <AppText align="center" color="muted" variant="caption">
              {copy.skipHint}
            </AppText>
          ) : null}
        </Stack>
      </Stack>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: { paddingVertical: spacing.xl, paddingBottom: spacing.xxl },
  hero: { alignItems: 'center', gap: spacing.md },
  logo: { width: 190, height: 150 },
});
