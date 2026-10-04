import { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet } from 'react-native';

import { accountService, normalizeApiError } from '../../../api';
import type { AccountDeletionRecord } from '../../../api/services/account.service';
import {
  AppButton,
  AppCard,
  AppHeader,
  AppScreen,
  AppText,
  AppTextInput,
  Stack,
} from '../../../components';
import { useTranslation } from '../../../i18n';
import { spacing } from '../../../theme';
import { useAuthStore } from '../../auth/store';
import { formatDateTime } from '../../../utils/formatDateTime';

export function DeleteAccountScreen() {
  const { t, locale } = useTranslation();
  const copy = t.settings.deleteAccountFlow;
  const accessToken = useAuthStore((state) => state.accessToken);
  const [record, setRecord] = useState<AccountDeletionRecord | null>(null);
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const isPending = record?.status === 'pending';

  const load = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setError(null);
    try {
      setRecord((await accountService.getAccountDeletionStatus(accessToken)) ?? null);
    } catch {
      setError(copy.loadError);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, copy.loadError]);

  useEffect(() => {
    void load();
  }, [load]);

  async function submitRequest() {
    if (!accessToken) return;
    setIsBusy(true);
    setError(null);
    try {
      setRecord(await accountService.requestAccountDeletion(reason.trim(), accessToken));
      setNotice(copy.requestedNotice);
    } catch (caught) {
      setError(normalizeApiError(caught).message);
    } finally {
      setIsBusy(false);
    }
  }

  function confirmRequest() {
    Alert.alert(copy.confirmTitle, copy.confirmMessage, [
      { text: copy.cancelAction, style: 'cancel' },
      { text: copy.confirmAction, style: 'destructive', onPress: () => void submitRequest() },
    ]);
  }

  async function cancelRequest() {
    if (!accessToken) return;
    setIsBusy(true);
    setError(null);
    try {
      setRecord(await accountService.cancelAccountDeletion(accessToken));
      setNotice(copy.cancelledNotice);
    } catch (caught) {
      setError(normalizeApiError(caught).message);
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <AppScreen contentContainerStyle={styles.content} scroll>
      <Stack gap="xl">
        <AppHeader subtitle={copy.subtitle} title={copy.title} />
        <AppCard>
          <Stack gap="md">
            <AppText color="secondary" variant="body">
              {copy.warning}
            </AppText>
            {isPending ? (
              <>
                <AppText variant="h3">{copy.pendingTitle}</AppText>
                {record?.scheduled_for ? (
                  <AppText color="secondary" variant="body">
                    {copy.pendingScheduled(formatDateTime(record.scheduled_for, locale) ?? '')}
                  </AppText>
                ) : null}
                <AppButton
                  disabled={isBusy}
                  fullWidth
                  loading={isBusy}
                  onPress={() => void cancelRequest()}
                  title={copy.cancelRequest}
                  variant="outline"
                />
              </>
            ) : (
              <>
                <AppTextInput
                  label={copy.reasonLabel}
                  maxLength={500}
                  multiline
                  onChangeText={setReason}
                  placeholder={copy.reasonPlaceholder}
                  value={reason}
                />
                <AppButton
                  disabled={isBusy || isLoading}
                  fullWidth
                  loading={isBusy}
                  onPress={confirmRequest}
                  title={copy.request}
                  variant="danger"
                />
              </>
            )}
            {notice ? <AppText color="success">{notice}</AppText> : null}
            {error ? <AppText color="error">{error}</AppText> : null}
          </Stack>
        </AppCard>
      </Stack>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.xl },
});
