import {
  STUDENT_CONTEXT_SLOW_MS,
  reconnectRevalidationMode,
  resolveStudentContextView,
} from '../studentContextRecovery';

describe('resolveStudentContextView', () => {
  it('shows the spinner only for a load that is still fresh', () => {
    expect(
      resolveStudentContextView({ isLoading: true, failed: false, isOnline: true, slow: false }),
    ).toBe('loading');
    expect(
      resolveStudentContextView({ isLoading: true, failed: false, isOnline: false, slow: false }),
    ).toBe('loading');
  });

  it('never leaves a stuck load as a spinner', () => {
    expect(
      resolveStudentContextView({ isLoading: true, failed: false, isOnline: true, slow: true }),
    ).toBe('error');
    expect(
      resolveStudentContextView({ isLoading: true, failed: false, isOnline: false, slow: true }),
    ).toBe('offline');
    expect(STUDENT_CONTEXT_SLOW_MS).toBeGreaterThan(0);
  });

  it('shows the offline state when nothing could be loaded without a connection', () => {
    expect(
      resolveStudentContextView({ isLoading: false, failed: true, isOnline: false, slow: false }),
    ).toBe('offline');
  });

  it('shows the error state when the device is online but the load failed', () => {
    expect(
      resolveStudentContextView({ isLoading: false, failed: true, isOnline: true, slow: false }),
    ).toBe('error');
  });

  it('has nothing to show between a finished load and the route change', () => {
    expect(
      resolveStudentContextView({ isLoading: false, failed: false, isOnline: true, slow: false }),
    ).toBe('loading');
  });
});

describe('reconnectRevalidationMode', () => {
  it('reloads a blocked student in full', () => {
    expect(reconnectRevalidationMode({ blocked: true, journeyPhase: 'loading' })).toBe('full');
  });

  it('refreshes a student already in the app in the background', () => {
    expect(reconnectRevalidationMode({ blocked: false, journeyPhase: 'mainApp' })).toBe('silent');
  });

  it('leaves the setup flow and a running first load alone', () => {
    expect(reconnectRevalidationMode({ blocked: false, journeyPhase: 'loading' })).toBe('none');
    expect(reconnectRevalidationMode({ blocked: false, journeyPhase: 'academicProfile' })).toBe(
      'none',
    );
    expect(reconnectRevalidationMode({ blocked: false, journeyPhase: 'verificationStatus' })).toBe(
      'none',
    );
  });
});
