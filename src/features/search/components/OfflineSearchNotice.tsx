import { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp, ParamListBase } from '@react-navigation/native';

import { AppButton, AppCard, AppText, EmptyState } from '../../../components';
import { useTranslation } from '../../../i18n';
import { ProfileRoutes, TabRoutes } from '../../../navigation/routes';

/** Opens the Downloads screen from any tab (it lives in the Profile stack). */
export function useOpenDownloads() {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();

  return useCallback(
    () => navigation.navigate(TabRoutes.Profile, { screen: ProfileRoutes.Downloads }),
    [navigation],
  );
}

/** «Results from what is saved on your phone»: shown above a search that was answered locally. */
export function OfflineSearchNote() {
  const { t } = useTranslation();

  return (
    <AppCard variant="muted">
      <AppText color="secondary" variant="bodySmall">
        {t.offlineSearch.localNote}
      </AppText>
    </AppCard>
  );
}

/** The friendly empty state of a local search with no match, with the way into the saved material. */
export function OfflineSearchEmpty() {
  const { t } = useTranslation();
  const openDownloads = useOpenDownloads();

  return (
    <EmptyState
      action={
        <AppButton
          onPress={openDownloads}
          title={t.offlineSearch.openDownloads}
          variant="outline"
        />
      }
      artwork="search"
      message={t.offlineSearch.emptyMessage}
      title={t.offlineSearch.emptyTitle}
    />
  );
}
