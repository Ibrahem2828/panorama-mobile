import { setCacheScope } from './cacheScope';
import { clearAllCaches } from './responseCache';
import { clearSessionSnapshot } from './sessionSnapshot';

type StoreLike = {
  getState: () => { user: { id: string | number } | null };
  subscribe: (listener: (state: { user: { id: string | number } | null }) => void) => () => void;
};

/**
 * Ties the offline layer to the signed-in user: the cache is scoped to the user id, and when that user signs out (or the session
 * ends) or a different user signs in, every saved response and the saved profile are wiped, so nothing leaks between accounts.
 */
export function bindOfflineToAuth(store: StoreLike): () => void {
  let activeId: string | null = null;

  const apply = (user: { id: string | number } | null) => {
    const nextId = user ? String(user.id) : null;

    if (nextId === activeId) {
      return;
    }

    if (activeId !== null) {
      void clearAllCaches();

      if (nextId === null) {
        void clearSessionSnapshot();
      }
    }

    activeId = nextId;
    setCacheScope(nextId);
  };

  apply(store.getState().user);

  return store.subscribe((state) => apply(state.user));
}
