import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import type { NavigationAction } from '@react-navigation/native';

import { useTranslation } from '../i18n';
import { createLeaveHandler } from './unsavedChanges';

type GuardedNavigation = {
  addListener: (
    type: 'beforeRemove',
    callback: (event: { preventDefault: () => void; data: { action: NavigationAction } }) => void,
  ) => () => void;
  dispatch: (action: NavigationAction) => void;
};

/**
 * Asks before a screen with unsaved edits is left (back button, header back, Android back gesture).
 * `isDirty` is a function evaluated when the user tries to leave, so a save followed by an immediate `goBack()` sees the
 * saved state instead of a stale render.
 */
export function useUnsavedChangesGuard(
  navigation: GuardedNavigation,
  isDirty: () => boolean,
): void {
  const { t } = useTranslation();
  const dirtyRef = useRef(isDirty);
  dirtyRef.current = isDirty;
  const copy = t.common.unsavedChanges;

  useEffect(() => {
    const handle = createLeaveHandler({
      isDirty: () => dirtyRef.current(),
      confirmDiscard: (discard) => {
        Alert.alert(copy.title, copy.message, [
          { text: copy.stay, style: 'cancel' },
          { text: copy.discard, style: 'destructive', onPress: discard },
        ]);
      },
    });

    return navigation.addListener('beforeRemove', (event) => {
      handle(event, () => navigation.dispatch(event.data.action));
    });
  }, [navigation, copy]);
}
