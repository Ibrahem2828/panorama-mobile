import { useCallback, useEffect, useState } from 'react';

import type { OpenFailure } from '../logic/errors';
import { loadThumbnailUri, MediaOpenError } from '../services/mediaDelivery';

export type ThumbnailState =
  | { status: 'loading' }
  | { status: 'ready'; uri: string }
  | { status: 'error'; failure: OpenFailure };

/**
 * Thumbnail of one chat image: memory, then the encrypted cache, then one batched ticket request + a <= 480 px WebP. Messages
 * of one screenful ask within the same moment, so the server sees a single ticket request for all of them.
 */
export function useThumbnail(groupId: number | string | null, messageId: number) {
  const [state, setState] = useState<ThumbnailState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (groupId === null) {
      setState({ status: 'error', failure: 'server' });
      return undefined;
    }

    let active = true;

    setState({ status: 'loading' });
    loadThumbnailUri(groupId, messageId).then(
      (uri) => {
        if (active) setState({ status: 'ready', uri });
      },
      (error: unknown) => {
        if (active) {
          setState({
            status: 'error',
            failure: error instanceof MediaOpenError ? error.failure : 'server',
          });
        }
      },
    );

    return () => {
      active = false;
    };
  }, [groupId, messageId, attempt]);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);

  return { state, retry };
}
