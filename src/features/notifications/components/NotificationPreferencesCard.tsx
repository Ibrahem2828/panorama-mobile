import { useCallback, useState } from 'react';
import { Switch } from 'react-native';

import { AppButton, AppCard, AppText, LoadingState, Stack } from '../../../components';
import { useTranslation } from '../../../i18n';
import { colors, useBrand } from '../../../theme';
import { useAuthStore } from '../../auth/store';
import {
  getNotificationTypeLabel,
  loadNotificationPreferences,
  saveNotificationPreferences,
} from '../services';

type Preferences = { in_app_enabled: boolean; push_enabled: boolean; disabled_types: string[] };

/** Account-critical notices (verification, system) are never offered for muting. */
const TOGGLEABLE_TYPES = ['announcement', 'group', 'file', 'printing', 'support'] as const;

function ToggleRow({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
}) {
  const brand = useBrand();

  return (
    <Stack align="center" direction="horizontal" gap="md" justify="space-between">
      <AppText style={{ flex: 1 }} variant="bodySmall" weight="600">
        {label}
      </AppText>
      <Switch
        accessibilityLabel={label}
        disabled={disabled}
        onValueChange={onChange}
        thumbColor={colors.background.surface}
        trackColor={{ false: colors.border.strong, true: brand.primary }}
        value={value}
      />
    </Stack>
  );
}

/** Collapsible card to mute whole notification types; loads only when opened. */
export function NotificationPreferencesCard() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = useAuthStore.getState().accessToken;

    if (!token) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      setPrefs(await loadNotificationPreferences(token));
    } catch {
      setError(t.notifications.prefs.loadFailed);
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  function toggleOpen() {
    const next = !open;

    setOpen(next);

    if (next && !prefs) {
      void load();
    }
  }

  async function save(patch: Partial<Preferences>) {
    const token = useAuthStore.getState().accessToken;
    const previous = prefs;

    if (!token || !previous) {
      return;
    }

    setPrefs({ ...previous, ...patch });
    setIsSaving(true);
    setError(null);

    try {
      setPrefs(await saveNotificationPreferences(patch, token));
    } catch {
      setPrefs(previous);
      setError(t.notifications.prefs.saveFailed);
    } finally {
      setIsSaving(false);
    }
  }

  const disabled = new Set(prefs?.disabled_types ?? []);

  return (
    <AppCard variant="muted">
      <Stack gap="md">
        <Stack align="center" direction="horizontal" gap="md" justify="space-between">
          <Stack gap="xs" style={{ flex: 1 }}>
            <AppText variant="title">{t.notifications.prefs.title}</AppText>
            <AppText color="secondary" variant="caption">
              {t.notifications.prefs.description}
            </AppText>
          </Stack>
          <AppButton
            onPress={toggleOpen}
            size="sm"
            title={open ? t.notifications.prefs.hide : t.notifications.prefs.show}
            variant="outline"
          />
        </Stack>

        {open && isLoading && !prefs ? <LoadingState /> : null}
        {open && error ? (
          <Stack gap="sm">
            <AppText color="error" variant="bodySmall">
              {error}
            </AppText>
            {!prefs ? (
              <AppButton
                onPress={() => void load()}
                size="sm"
                title={t.common.retry}
                variant="outline"
              />
            ) : null}
          </Stack>
        ) : null}

        {open && prefs ? (
          <Stack gap="md">
            <ToggleRow
              disabled={isSaving}
              label={t.notifications.prefs.inApp}
              onChange={(value) => void save({ in_app_enabled: value })}
              value={prefs.in_app_enabled}
            />
            <AppText color="muted" variant="caption">
              {t.notifications.prefs.typesTitle}
            </AppText>
            {TOGGLEABLE_TYPES.map((type) => (
              <ToggleRow
                disabled={isSaving || !prefs.in_app_enabled}
                key={type}
                label={getNotificationTypeLabel(type, t.notifications)}
                onChange={(enabled) => {
                  const next = new Set(disabled);

                  if (enabled) next.delete(type);
                  else next.add(type);

                  void save({ disabled_types: [...next] });
                }}
                value={prefs.in_app_enabled && !disabled.has(type)}
              />
            ))}
          </Stack>
        ) : null}
      </Stack>
    </AppCard>
  );
}
