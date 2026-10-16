import { useCallback, useState } from 'react';
import { Linking, StyleSheet } from 'react-native';

import { AppButton, AppCard, AppText, Icon, Stack } from '../../../components';
import { useTranslation } from '../../../i18n';
import { useAuthStore } from '../../auth/store';
import { useFeedbackStore } from '../../feedback/store';
import { launchGroupWhatsApp, requestWhatsAppLaunchLink } from '../services';
import type { Id, WhatsAppLaunchResult } from '../types';

// WhatsApp's own brand green (a third-party identity, not the faculty theme).
const WHATSAPP_GREEN = '#128C4A';

type GroupWhatsAppCardProps = {
  groupId: Id;
  /** Only approved members may launch WhatsApp. */
  canLaunch: boolean;
};

/**
 * One tap opens the WhatsApp app straight into the group. The invite link is never shown, logged
 * or opened in a browser: the server hands over a one-off app deep link that is used in memory.
 */
export function GroupWhatsAppCard({ groupId, canLaunch }: GroupWhatsAppCardProps) {
  const { t } = useTranslation();
  const copy = t.groups.whatsapp;
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<WhatsAppLaunchResult | null>(null);

  const handleOpen = useCallback(async () => {
    const accessToken = useAuthStore.getState().accessToken;

    if (!accessToken || busy) {
      return;
    }

    setBusy(true);
    setResult(null);

    const outcome = await launchGroupWhatsApp({
      requestAppUrl: () => requestWhatsAppLaunchLink(groupId, accessToken),
      openUrl: (url) => Linking.openURL(url),
    });

    setResult(outcome);
    setBusy(false);

    if (outcome === 'opened') {
      void useFeedbackStore.getState().requestPrompt({
        context: 'group',
        actionKey: 'group.whatsapp.opened',
        objectType: 'group',
        objectId: groupId,
      });
    }
  }, [busy, groupId]);

  return (
    <AppCard variant="default">
      <Stack gap="md">
        <Stack align="center" direction="horizontal" gap="md">
          <Icon color={WHATSAPP_GREEN} name="chat" size={26} />
          <Stack gap="xs" style={styles.titleBlock}>
            <AppText variant="title">{copy.title}</AppText>
            <AppText color="secondary" variant="bodySmall">
              {copy.subtitle}
            </AppText>
          </Stack>
        </Stack>

        <AppButton
          accessibilityLabel={copy.open}
          disabled={!canLaunch}
          fullWidth
          loading={busy}
          onPress={handleOpen}
          style={canLaunch ? styles.button : undefined}
          title={busy ? copy.opening : copy.open}
        />

        {!canLaunch ? (
          <AppText color="muted" variant="caption">
            {t.groups.notices.membersOnly}
          </AppText>
        ) : (
          <AppText color="muted" variant="caption">
            {copy.note}
          </AppText>
        )}

        {result === 'not-installed' ? (
          <AppText color="error" variant="bodySmall">
            {copy.notInstalled}
          </AppText>
        ) : null}
        {result === 'failed' ? (
          <AppText color="error" variant="bodySmall">
            {copy.error}
          </AppText>
        ) : null}
        {result === 'opened' ? (
          <AppText color="success" variant="bodySmall">
            {copy.opened}
          </AppText>
        ) : null}
      </Stack>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  titleBlock: {
    flex: 1,
    minWidth: 0,
  },
  button: {
    backgroundColor: WHATSAPP_GREEN,
  },
});
