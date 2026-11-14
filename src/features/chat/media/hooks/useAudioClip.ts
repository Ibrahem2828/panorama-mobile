import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createAudioPlayer,
  setAudioModeAsync,
  type AudioPlayer,
  type AudioStatus,
} from 'expo-audio';

import type { Id } from '../../types';
import { nextSpeed, playbackRegistry, type PlaybackSpeed } from '../logic/playback';
import { getAudioSource } from '../services/mediaDelivery';

export type ClipPhase = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

export type AudioClipState = {
  phase: ClipPhase;
  positionSec: number;
  /** From the player once loaded, else the duration the server reported. */
  durationSec: number;
  speed: PlaybackSpeed;
};

const LOAD_TIMEOUT_MS = 20_000;

/**
 * Plays one chat audio message by streaming the protected URL (HTTP Range works, so seeking does not download everything first).
 * The auth header travels with the request; a fresh ticket is requested every time playback (re)starts. Only one clip plays at
 * a time and a clip stops when its bubble unmounts (leaving the chat).
 */
export function useAudioClip(input: {
  id: string;
  groupId: Id;
  messageId: number;
  knownDurationSec: number;
}) {
  const { id, groupId, messageId, knownDurationSec } = input;
  const [state, setState] = useState<AudioClipState>({
    phase: 'idle',
    positionSec: 0,
    durationSec: knownDurationSec,
    speed: 1,
  });
  const player = useRef<AudioPlayer | null>(null);
  const subscription = useRef<{ remove: () => void } | null>(null);
  const loadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speed = useRef<PlaybackSpeed>(1);

  const teardown = useCallback(() => {
    if (loadTimer.current) {
      clearTimeout(loadTimer.current);
      loadTimer.current = null;
    }

    subscription.current?.remove();
    subscription.current = null;

    try {
      player.current?.pause();
      player.current?.remove();
    } catch {
      // Already released.
    }

    player.current = null;
    playbackRegistry.release(id);
  }, [id]);

  const stop = useCallback(() => {
    teardown();
    setState((current) => ({ ...current, phase: 'idle', positionSec: 0 }));
  }, [teardown]);

  const onStatus = useCallback(
    (status: AudioStatus) => {
      if (status.isLoaded && loadTimer.current) {
        clearTimeout(loadTimer.current);
        loadTimer.current = null;
      }

      if (status.didJustFinish) {
        teardown();
        setState((current) => ({ ...current, phase: 'idle', positionSec: 0 }));
        return;
      }

      setState((current) => ({
        ...current,
        phase: status.playing
          ? 'playing'
          : status.isLoaded && !status.isBuffering
            ? 'paused'
            : 'loading',
        positionSec: status.currentTime,
        durationSec: status.duration > 0 ? status.duration : current.durationSec,
      }));
    },
    [teardown],
  );

  const start = useCallback(
    async (fromSec = 0) => {
      setState((current) => ({ ...current, phase: 'loading' }));
      teardown();
      playbackRegistry.claim(id, stop);

      try {
        const source = await getAudioSource(groupId, messageId);

        await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });

        const created = createAudioPlayer(source, { updateInterval: 150 });

        player.current = created;
        subscription.current = created.addListener('playbackStatusUpdate', onStatus);
        loadTimer.current = setTimeout(() => {
          teardown();
          setState((current) => ({ ...current, phase: 'error' }));
        }, LOAD_TIMEOUT_MS);

        if (fromSec > 0) {
          await created.seekTo(fromSec);
        }

        created.setPlaybackRate(speed.current, 'high');
        created.play();
      } catch {
        teardown();
        setState((current) => ({ ...current, phase: 'error' }));
      }
    },
    [groupId, id, messageId, onStatus, stop, teardown],
  );

  const toggle = useCallback(() => {
    const current = player.current;

    if (!current) {
      void start();
      return;
    }

    if (current.playing) {
      current.pause();
    } else {
      playbackRegistry.claim(id, stop);
      current.play();
    }
  }, [id, start, stop]);

  const seek = useCallback(
    (seconds: number) => {
      const current = player.current;

      setState((value) => ({ ...value, positionSec: seconds }));

      if (current) {
        void current.seekTo(seconds);
      } else {
        void start(seconds);
      }
    },
    [start],
  );

  const cycleSpeed = useCallback(() => {
    const next = nextSpeed(speed.current);

    speed.current = next;
    player.current?.setPlaybackRate(next, 'high');
    setState((current) => ({ ...current, speed: next }));
  }, []);

  useEffect(() => teardown, [teardown]);

  return { state, toggle, seek, cycleSpeed, retry: () => void start() };
}
