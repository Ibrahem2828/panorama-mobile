import {
  DEVICE_ERROR,
  deviceErrorCode,
  isDeviceSwitchLimitError,
  isDeviceSwitchTokenInvalidError,
  normalizeApiError,
  type DeviceMismatchInfo,
} from '../../../api';

/**
 * Signed-in students are bound to one phone. This module holds the pure pieces of that flow: the error a refused login
 * raises, the classification of a failed switch, and the state machine behind the "this account is linked to another
 * phone" screen. Nothing here touches the network, storage or React.
 */

/** Raised by `loginWithCredentials` when the password was right but the account belongs to another phone. */
export class DeviceMismatchLoginError extends Error {
  readonly info: DeviceMismatchInfo;

  constructor(info: DeviceMismatchInfo) {
    super('DEVICE_MISMATCH');
    this.name = 'DeviceMismatchLoginError';
    this.info = info;
  }
}

export type DeviceSwitchFailure =
  | 'token_invalid'
  | 'limit_reached'
  | 'id_required'
  | 'network'
  | 'generic';

export function classifyDeviceSwitchError(error: unknown): DeviceSwitchFailure {
  if (isDeviceSwitchTokenInvalidError(error)) return 'token_invalid';
  if (isDeviceSwitchLimitError(error)) return 'limit_reached';
  if (deviceErrorCode(error) === DEVICE_ERROR.idRequired) return 'id_required';

  const { code } = normalizeApiError(error);

  return code === 'NETWORK_ERROR' || code === 'TIMEOUT' ? 'network' : 'generic';
}

/** Raised by `switchDeviceSession`; carries which of the user-visible outcomes happened. */
export class DeviceSwitchError extends Error {
  readonly failure: DeviceSwitchFailure;

  constructor(failure: DeviceSwitchFailure) {
    super(`DEVICE_SWITCH_${failure.toUpperCase()}`);
    this.name = 'DeviceSwitchError';
    this.failure = failure;
  }
}

export type DeviceLockPhase =
  /** No refusal pending: the login form is in charge. */
  | 'none'
  /** Another phone owns the account and this one may take it over. */
  | 'conflict'
  /** The switch request is in flight. */
  | 'switching'
  /** No switch left (or none allowed): only the administration can move the account. */
  | 'limit'
  /** The one-time switch link ran out: sign in again to get a new one. */
  | 'expired';

export type DeviceLockError = 'network' | 'generic' | 'id_required' | null;

export type DeviceLockState = {
  phase: DeviceLockPhase;
  info: DeviceMismatchInfo | null;
  /** Epoch ms after which the switch token is no longer accepted. */
  expiresAt: number | null;
  error: DeviceLockError;
};

export type DeviceLockEvent =
  | { type: 'mismatch'; info: DeviceMismatchInfo; now: number }
  | { type: 'switch_started' }
  | { type: 'switch_failed'; failure: DeviceSwitchFailure }
  | { type: 'tick'; now: number }
  | { type: 'reset' };

export const initialDeviceLockState: DeviceLockState = {
  phase: 'none',
  info: null,
  expiresAt: null,
  error: null,
};

export function deviceLockReducer(state: DeviceLockState, event: DeviceLockEvent): DeviceLockState {
  switch (event.type) {
    case 'mismatch': {
      const { info } = event;

      if (!info.canSwitch || !info.switchToken) {
        return { phase: 'limit', info, expiresAt: null, error: null };
      }

      return {
        phase: 'conflict',
        info,
        expiresAt:
          info.switchTokenExpiresInSeconds === null
            ? null
            : event.now + info.switchTokenExpiresInSeconds * 1000,
        error: null,
      };
    }
    case 'switch_started':
      // Only a pending conflict can be switched; a double tap while switching changes nothing.
      return state.phase === 'conflict' ? { ...state, phase: 'switching', error: null } : state;
    case 'switch_failed': {
      if (state.phase !== 'switching') return state;

      if (event.failure === 'token_invalid') {
        return { phase: 'expired', info: state.info, expiresAt: null, error: null };
      }

      if (event.failure === 'limit_reached') {
        return { phase: 'limit', info: state.info, expiresAt: null, error: null };
      }

      return { ...state, phase: 'conflict', error: event.failure };
    }
    case 'tick':
      return state.phase === 'conflict' && state.expiresAt !== null && event.now >= state.expiresAt
        ? { phase: 'expired', info: state.info, expiresAt: null, error: null }
        : state;
    case 'reset':
      return initialDeviceLockState;
    default:
      return state;
  }
}
