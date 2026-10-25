import { StyleSheet, View } from 'react-native';

import {
  AppBadge,
  AppButton,
  AppCard,
  AppText,
  Icon,
  Stack,
  type IconName,
} from '../../../components';
import { useTranslation } from '../../../i18n';
import { colors, radius, spacing, useBrand } from '../../../theme';
import { openAppSettings } from '../permissionsService';
import {
  canRequest,
  hasOpenPermissions,
  PERMISSION_DEFINITIONS,
  type PermissionKey,
  type PermissionSnapshot,
  type PermissionStatus,
} from '../permissionState';

const ICONS: Record<PermissionKey, IconName> = {
  notifications: 'bell',
  camera: 'camera',
  photos: 'image',
  files: 'file',
};

type PermissionsPanelProps = {
  snapshot: PermissionSnapshot;
  busyKey: PermissionKey | 'all' | null;
  onRequest: (key: PermissionKey) => void;
  onAllowAll: () => void;
};

function badgeVariant(status: PermissionStatus): 'success' | 'warning' | 'error' | 'neutral' {
  switch (status) {
    case 'granted':
    case 'not_needed':
      return 'success';
    case 'blocked':
      return 'error';
    case 'denied':
      return 'warning';
    default:
      return 'neutral';
  }
}

/** One row per capability: why the app needs it, its status, and the right action (allow / open settings / nothing). */
export function PermissionsPanel({
  snapshot,
  busyKey,
  onRequest,
  onAllowAll,
}: PermissionsPanelProps) {
  const { t } = useTranslation();
  const brand = useBrand();
  const copy = t.permissions;

  return (
    <Stack gap="md">
      {PERMISSION_DEFINITIONS.map((definition) => {
        const status = snapshot[definition.key];
        const row = copy.rows[definition.key];

        return (
          <AppCard key={definition.key} variant="outlined">
            <Stack gap="sm">
              <View style={styles.head}>
                <View style={[styles.iconWrap, { backgroundColor: brand.primarySoft }]}>
                  <Icon color={brand.primary} name={ICONS[definition.key]} size={22} />
                </View>
                <View style={styles.flex}>
                  <AppText variant="title">{row.title}</AppText>
                  <AppText color="secondary" variant="bodySmall">
                    {row.why}
                  </AppText>
                </View>
              </View>
              <View style={styles.foot}>
                <AppBadge label={copy.status[status]} variant={badgeVariant(status)} />
                {canRequest(status) ? (
                  <AppButton
                    loading={busyKey === definition.key}
                    onPress={() => onRequest(definition.key)}
                    size="sm"
                    title={copy.allow}
                  />
                ) : status === 'blocked' ? (
                  <AppButton
                    onPress={() => void openAppSettings()}
                    size="sm"
                    title={copy.openSettings}
                    variant="outline"
                  />
                ) : null}
              </View>
              {status === 'blocked' ? (
                <AppText color="error" variant="caption">
                  {copy.blockedHint}
                </AppText>
              ) : null}
            </Stack>
          </AppCard>
        );
      })}
      {hasOpenPermissions(snapshot) ? (
        <AppButton loading={busyKey === 'all'} onPress={onAllowAll} title={copy.allowAll} />
      ) : (
        <AppText align="center" color="success" variant="label">
          {copy.allGranted}
        </AppText>
      )}
    </Stack>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  iconWrap: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
  },
  foot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.default,
    paddingTop: spacing.sm,
  },
});
