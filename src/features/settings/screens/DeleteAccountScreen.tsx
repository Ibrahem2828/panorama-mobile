import { useCallback, useEffect, useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Alert, StyleSheet } from 'react-native';

import type { AccountDeletionRecord } from '../../../api/services/account.service';
import {
  AppButton,
  AppCard,
  AppHeader,
  AppScreen,
  AppText,
  AppTextInput,
  EmptyState,
  LoadingState,
  Stack,
} from '../../../components';
import { useTranslation } from '../../../i18n';
import type { ProfileStackParamList } from '../../../navigation/types';
import { spacing } from '../../../theme';
import { formatDateTime } from '../../../utils/formatDateTime';
import { useAuthStore } from '../../auth/store';
import {
  MAX_DELETION_REASON_LENGTH,
  cancelDeletion,
  isDeletionRequested,
  isDeletionUnavailable,
  loadDeletionStatus,
  requestDeletion,
} from '../services';

type Props = NativeStackScreenProps<ProfileStackParamList, 'DeleteAccount'>;

export function DeleteAccountScreen({ navigation }: Props) {
  const { t, locale } = useTranslation();
  const copy = t.settings.deleteAccountFlow;
  const accessToken = useAuthStore((state) => state.accessToken);
  const [record, setRecord] = useState<AccountDeletionRecord | null>(null);
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const requested = isDeletionRequested(record);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setLoadFailed(false);
    try {
      setRecord(await loadDeletionStatus(accessToken));
    } catch (caught) {
      if (isDeletionUnavailable(caught)) setUnavailable(true);
      else setLoadFailed(true);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  async function run(action: () => Promise<AccountDeletionRecord | null>, success: string) {
    setIsBusy(true);
    setError(null);
    setNotice(null);
    try {
      setRecord(await action());
      setReason('');
      setNotice(success);
    } catch (caught) {
      if (isDeletionUnavailable(caught)) setUnavailable(true);
      else setError(copy.failed);
    } finally {
      setIsBusy(false);
    }
  }

  function confirmRequest() {
    if (!accessToken) return;
    Alert.alert(copy.confirmTitle, copy.confirmMessage, [
      { text: copy.cancelAction, style: 'cancel' },
      {
        text: copy.confirmAction,
        style: 'destructive',
        onPress: () => void run(() => requestDeletion(reason, accessToken), copy.requestedNotice),
      },
    ]);
  }

  function confirmCancel() {
    if (!accessToken) return;
    Alert.alert(copy.cancelConfirmTitle, copy.cancelConfirmMessage, [
      { text: copy.keepRequest, style: 'cancel' },
      {
        text: copy.cancelConfirmAction,
        onPress: () => void run(() => cancelDeletion(accessToken), copy.cancelledNotice),
      },
    ]);
  }

  const header = (
    <Stack gap="md">
      <AppHeader subtitle={copy.subtitle} title={copy.title} />
      <AppButton onPress={() => navigation.goBack()} title={t.common.back} variant="ghost" />
    </Stack>
  );

  if (isLoading) {
    return (
      <AppScreen contentContainerStyle={styles.content} scroll>
        {header}
        <LoadingState message={copy.statusLoading} />
      </AppScreen>
    );
  }

  if (unavailable) {
    return (
      <AppScreen contentContainerStyle={styles.content} scroll>
        {header}
        <EmptyState message={copy.unavailable} title={copy.title} />
      </AppScreen>
    );
  }

  if (loadFailed) {
    return (
      <AppScreen contentContainerStyle={styles.content} scroll>
        {header}
        <EmptyState
          action={
            <AppButton onPress={() => void load()} title={t.common.retry} variant="outline" />
          }
          message={copy.statusError}
          title={copy.title}
        />
      </AppScreen>
    );
  }

  return (
    <AppScreen contentContainerStyle={styles.content} scroll>
      <Stack gap="xl">
        {header}
        <AppCard>
          <Stack gap="md">
            <AppText color="secondary" variant="body">
              {copy.warning}
            </AppText>

            {requested ? (
              <>
                <AppText variant="h3">{copy.pendingTitle}</AppText>
                {record?.scheduled_for ? (
                  <AppText color="secondary" variant="body">
                    {copy.pendingScheduled(formatDateTime(record.scheduled_for, locale) ?? '')}
                  </AppText>
                ) : null}
                {record?.requested_at ? (
                  <AppText color="muted" variant="caption">
                    {copy.requestedAt(formatDateTime(record.requested_at, locale) ?? '')}
                  </AppText>
                ) : null}
                <AppButton
                  disabled={isBusy}
                  fullWidth
                  loading={isBusy}
                  onPress={confirmCancel}
                  title={copy.cancelRequest}
                  variant="outline"
                />
              </>
            ) : (
              <>
                {record?.status === 'cancelled' ? (
                  <AppText color="secondary" variant="bodySmall">
                    {copy.cancelledBefore}
                  </AppText>
                ) : null}
                {record?.status === 'completed' ? (
                  <AppText color="secondary" variant="bodySmall">
                    {copy.completedNote}
                  </AppText>
                ) : null}
                <AppTextInput
                  helperText={copy.reasonCounter(reason.length, MAX_DELETION_REASON_LENGTH)}
                  label={copy.reasonLabel}
                  maxLength={MAX_DELETION_REASON_LENGTH}
                  multiline
                  onChangeText={setReason}
                  placeholder={copy.reasonPlaceholder}
                  value={reason}
                />
                <AppButton
                  disabled={isBusy}
                  fullWidth
                  loading={isBusy}
                  onPress={confirmRequest}
                  title={copy.request}
                  variant="danger"
                />
              </>
            )}

            {notice ? (
              <AppText color="success" variant="bodySmall">
                {notice}
              </AppText>
            ) : null}
            {error ? (
              <AppText color="error" variant="bodySmall">
                {error}
              </AppText>
            ) : null}
          </Stack>
        </AppCard>
      </Stack>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.xl },
});
