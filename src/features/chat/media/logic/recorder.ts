import { VOICE_MAX_MS, VOICE_MIN_MS, VOICE_WARN_AT_MS } from './limits';

/**
 * Voice recorder state machine (pure; the hook owns the microphone):
 *
 *   idle --start--> requesting --granted--> recording --(stop|cancel|limit)--> stopping --> idle | review
 *                       |
 *                       +--denied--> denied (rationale + settings)
 *
 * `review` is reached only when the 5 minute cap auto-stopped the recording: the clip is kept and the student picks
 * send or discard. Every other stop sends (>= minimum length) or discards immediately.
 */
export type RecorderPhase = 'idle' | 'requesting' | 'recording' | 'stopping' | 'review' | 'denied';

export type RecorderNotice = 'tooShort' | 'limitReached' | 'failed';

export type RecordedClip = { uri: string; durationMs: number; levels: number[] };

export type RecorderState = {
  phase: RecorderPhase;
  elapsedMs: number;
  /** Latest microphone level in [0, 1] for the live meter. */
  level: number;
  /** Why the recording is being stopped, while `stopping`. */
  intent: 'send' | 'cancel' | 'limit' | null;
  /** False when the system will not show the permission dialog again (the student must use the settings). */
  canAskAgain: boolean;
  /** Short notice to show once (too short, hit the limit, error). */
  notice: RecorderNotice | null;
  clip: RecordedClip | null;
};

export type RecorderEvent =
  | { type: 'start' }
  | { type: 'permission'; granted: boolean; canAskAgain: boolean }
  | { type: 'started' }
  | { type: 'tick'; elapsedMs: number; level: number }
  | { type: 'stop'; intent: 'send' | 'cancel' }
  | { type: 'finished'; clip: RecordedClip }
  | { type: 'failed' }
  | { type: 'dismissNotice' }
  | { type: 'reset' };

export const initialRecorderState: RecorderState = {
  phase: 'idle',
  elapsedMs: 0,
  level: 0,
  intent: null,
  canAskAgain: true,
  notice: null,
  clip: null,
};

export function recorderReducer(state: RecorderState, event: RecorderEvent): RecorderState {
  switch (event.type) {
    case 'start':
      return state.phase === 'idle' || state.phase === 'denied'
        ? { ...initialRecorderState, phase: 'requesting' }
        : state;
    case 'permission':
      if (state.phase !== 'requesting') {
        return state;
      }

      return event.granted
        ? state
        : { ...initialRecorderState, phase: 'denied', canAskAgain: event.canAskAgain };
    case 'started':
      return state.phase === 'requesting' ? { ...state, phase: 'recording', elapsedMs: 0 } : state;
    case 'tick': {
      if (state.phase !== 'recording') {
        return state;
      }

      const elapsedMs = Math.min(event.elapsedMs, VOICE_MAX_MS);

      // The cap is enforced here, not by the UI: reaching it always leads to `stopping` with intent `limit`.
      if (elapsedMs >= VOICE_MAX_MS) {
        return { ...state, elapsedMs, level: 0, phase: 'stopping', intent: 'limit' };
      }

      return { ...state, elapsedMs, level: event.level };
    }
    case 'stop':
      return state.phase === 'recording'
        ? { ...state, phase: 'stopping', intent: event.intent, level: 0 }
        : state;
    case 'finished': {
      if (state.phase !== 'stopping') {
        return state;
      }

      if (state.intent === 'cancel') {
        return { ...initialRecorderState };
      }

      if (state.intent === 'limit') {
        return {
          ...initialRecorderState,
          phase: 'review',
          elapsedMs: event.clip.durationMs,
          clip: event.clip,
          notice: 'limitReached',
        };
      }

      if (event.clip.durationMs < VOICE_MIN_MS) {
        return { ...initialRecorderState, notice: 'tooShort' };
      }

      return { ...initialRecorderState, clip: event.clip };
    }
    case 'failed':
      return { ...initialRecorderState, notice: 'failed' };
    case 'dismissNotice':
      return state.notice ? { ...state, notice: null } : state;
    case 'reset':
      return { ...initialRecorderState };
    default:
      return state;
  }
}

export function remainingMs(elapsedMs: number): number {
  return Math.max(0, VOICE_MAX_MS - elapsedMs);
}

export function isNearLimit(elapsedMs: number): boolean {
  return elapsedMs >= VOICE_WARN_AT_MS;
}

/** 0:07, 12:03 style clock. */
export function formatClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;

  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
