import type { StudentJourneyPhase } from './studentJourney';

/**
 * What to do when the connection comes back. A blocked student (the context could not load) gets the full reload with its
 * loading state; a student already in the app or in the setup flow is refreshed in the background (the screen must not
 * flash); nothing is done while the first load is still running.
 */
export function reconnectRevalidationMode(input: {
  blocked: boolean;
  journeyPhase: StudentJourneyPhase;
}): 'none' | 'full' | 'silent' {
  if (input.blocked) {
    return 'full';
  }

  if (input.journeyPhase === 'loading') {
    return 'none';
  }

  return input.journeyPhase === 'mainApp' ? 'silent' : 'none';
}

export type StudentContextView = 'loading' | 'offline' | 'error';

/** A load that takes this long stops being a spinner: the student gets the retry and offline-study options. */
export const STUDENT_CONTEXT_SLOW_MS = 15000;

/**
 * What the screen shown while the student context resolves should be. A spinner is only for a load that is still fresh; a
 * failed or stuck load shows the offline state (device offline) or the error state, both with retry and the offline library.
 */
export function resolveStudentContextView(input: {
  isLoading: boolean;
  failed: boolean;
  isOnline: boolean;
  slow: boolean;
}): StudentContextView {
  if (input.isLoading && !input.slow) {
    return 'loading';
  }

  if (!input.isLoading && !input.failed) {
    return 'loading';
  }

  return input.isOnline ? 'error' : 'offline';
}
