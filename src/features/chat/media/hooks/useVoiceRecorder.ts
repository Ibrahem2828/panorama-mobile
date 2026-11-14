import { useCallback, useEffect, useReducer, useRef } from 'react';
import {
  getRecordingPermissionsAsync,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  type RecordingOptions,
} from 'expo-audio';
import { File } from 'expo-file-system';

import { VOICE_MAX_MS } from '../logic/limits';
import {
  initialRecorderState,
  recorderReducer,
  type RecordedClip,
  type RecorderState,
} from '../logic/recorder';
import { meteringToLevel } from '../logic/waveform';

/**
 * Voice notes: AAC in an m4a (MPEG-4) container, mono, 32 kbps. About 1.2 MB for the full 5 minutes, far under the server's 5 MB,
 * and a format the backend accepts (webm is not).
 */
const VOICE_RECORDING: RecordingOptions = {
  extension: '.m4a',
  sampleRate: 24000,
  numberOfChannels: 1,
  bitRate: 32000,
  isMeteringEnabled: true,
  android: { outputFormat: 'mpeg4', audioEncoder: 'aac' },
  ios: { outputFormat: 'mpeg4aac' as never, audioQuality: 64 },
  web: {},
};

const POLL_MS = 100;

function discard(uri: string | null | undefined): void {
  if (!uri) {
    return;
  }

  try {
    const file = new File(uri);

    if (file.exists) {
      file.delete();
    }
  } catch {
    // The recording lives in the app's private cache; a leftover is harmless and is replaced by the next one.
  }
}

export type VoiceRecorder = {
  state: RecorderState;
  /** Asks for the microphone if needed and starts recording. */
  start: () => Promise<void>;
  /** Stops and keeps the clip (it is sent by the caller) or throws it away. */
  stop: (intent: 'send' | 'cancel') => void;
  /** After a `review` (cap reached): drop the clip, or hand it over with `takeClip`. */
  discardClip: () => void;
  /** Reads the finished clip once and returns the recorder to idle. */
  takeClip: () => RecordedClip | null;
  dismissNotice: () => void;
};

export function useVoiceRecorder(): VoiceRecorder {
  const [state, dispatch] = useReducer(recorderReducer, initialRecorderState);
  const recorder = useAudioRecorder(VOICE_RECORDING);
  const levels = useRef<number[]>([]);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAt = useRef(0);
  const lastElapsed = useRef(0);
  const finalizing = useRef(false);
  const clipRef = useRef<RecordedClip | null>(null);
  const phaseRef = useRef(state.phase);

  phaseRef.current = state.phase;
  clipRef.current = state.clip;

  const stopPolling = useCallback(() => {
    if (timer.current) {
      clearInterval(timer.current);
      timer.current = null;
    }
  }, []);

  const start = useCallback(async () => {
    if (phaseRef.current !== 'idle' && phaseRef.current !== 'denied') {
      return;
    }

    dispatch({ type: 'start' });

    try {
      let permission = await getRecordingPermissionsAsync();

      if (!permission.granted) {
        permission = await requestRecordingPermissionsAsync();
      }

      dispatch({
        type: 'permission',
        granted: permission.granted,
        canAskAgain: permission.canAskAgain,
      });

      if (!permission.granted) {
        return;
      }

      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync(VOICE_RECORDING);
      recorder.record();

      levels.current = [];
      lastElapsed.current = 0;
      finalizing.current = false;
      startedAt.current = Date.now();
      dispatch({ type: 'started' });

      timer.current = setInterval(() => {
        const status = recorder.getStatus();
        const wall = Date.now() - startedAt.current;
        // The wall clock backs up the native duration so a stalled meter can never let a clip run past the cap.
        const elapsedMs = wall >= VOICE_MAX_MS ? VOICE_MAX_MS : Math.max(status.durationMillis, 0);
        const level = meteringToLevel(status.metering);

        lastElapsed.current = elapsedMs;
        levels.current.push(level);
        dispatch({ type: 'tick', elapsedMs, level });
      }, POLL_MS);
    } catch {
      stopPolling();
      dispatch({ type: 'failed' });
    }
  }, [recorder, stopPolling]);

  const stop = useCallback((intent: 'send' | 'cancel') => {
    if (phaseRef.current === 'recording') {
      dispatch({ type: 'stop', intent });
    }
  }, []);

  // `stopping` (user pressed stop/cancel, or the 5 minute cap was reached): finish the file exactly once.
  useEffect(() => {
    if (state.phase !== 'stopping' || finalizing.current) {
      return;
    }

    finalizing.current = true;
    stopPolling();

    void (async () => {
      try {
        const durationMs = Math.min(
          VOICE_MAX_MS,
          Math.max(lastElapsed.current, recorder.getStatus().durationMillis, 0),
        );

        await recorder.stop();
        await setAudioModeAsync({ allowsRecording: false }).catch(() => undefined);

        const uri = recorder.uri;

        if (!uri) {
          dispatch({ type: 'failed' });
          return;
        }

        if (state.intent === 'cancel') {
          discard(uri);
        }

        dispatch({ type: 'finished', clip: { uri, durationMs, levels: levels.current } });
      } catch {
        dispatch({ type: 'failed' });
      }
    })();
  }, [recorder, state.intent, state.phase, stopPolling]);

  const takeClip = useCallback((): RecordedClip | null => {
    const clip = clipRef.current;

    if (clip) {
      dispatch({ type: 'reset' });
    }

    return clip;
  }, []);

  const discardClip = useCallback(() => {
    discard(clipRef.current?.uri);
    dispatch({ type: 'reset' });
  }, []);

  const dismissNotice = useCallback(() => dispatch({ type: 'dismissNotice' }), []);

  // Leaving the chat while recording throws the recording away and releases the microphone.
  useEffect(
    () => () => {
      stopPolling();

      if (phaseRef.current === 'recording' || phaseRef.current === 'stopping') {
        void recorder
          .stop()
          .then(() => discard(recorder.uri))
          .catch(() => undefined);
        void setAudioModeAsync({ allowsRecording: false }).catch(() => undefined);
      }
    },
    [recorder, stopPolling],
  );

  return { state, start, stop, discardClip, takeClip, dismissNotice };
}
