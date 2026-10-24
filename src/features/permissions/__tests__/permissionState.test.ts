import {
  blockedPermissions,
  canRequest,
  hasOpenPermissions,
  INITIAL_SNAPSHOT,
  pendingRequests,
  shouldShowPermissionsIntro,
  toPermissionStatus,
  type PermissionSnapshot,
} from '../permissionState';

const snapshot = (patch: Partial<PermissionSnapshot>): PermissionSnapshot => ({
  ...INITIAL_SNAPSHOT,
  ...patch,
});

describe('toPermissionStatus', () => {
  it('maps the expo responses', () => {
    expect(toPermissionStatus({ granted: true, canAskAgain: true, status: 'granted' })).toBe(
      'granted',
    );
    expect(toPermissionStatus({ granted: false, canAskAgain: true, status: 'undetermined' })).toBe(
      'undetermined',
    );
    expect(toPermissionStatus({ granted: false, canAskAgain: true, status: 'denied' })).toBe(
      'denied',
    );
    expect(toPermissionStatus({ granted: false, canAskAgain: false, status: 'denied' })).toBe(
      'blocked',
    );
  });

  it('never calls a never-asked permission blocked', () => {
    expect(toPermissionStatus({ granted: false, canAskAgain: false, status: 'undetermined' })).toBe(
      'undetermined',
    );
  });

  it('keeps granted even if canAskAgain is false', () => {
    expect(toPermissionStatus({ granted: true, canAskAgain: false })).toBe('granted');
  });
});

describe('the guided flow', () => {
  it('asks only for runtime permissions that are still open, notifications first', () => {
    expect(pendingRequests(snapshot({}))).toEqual(['notifications', 'camera']);
    expect(pendingRequests(snapshot({ notifications: 'granted' }))).toEqual(['camera']);
    expect(pendingRequests(snapshot({ notifications: 'denied', camera: 'denied' }))).toEqual([
      'notifications',
      'camera',
    ]);
  });

  it('skips blocked permissions (the system will not show a dialog for them)', () => {
    expect(pendingRequests(snapshot({ notifications: 'blocked', camera: 'granted' }))).toEqual([]);
    expect(blockedPermissions(snapshot({ notifications: 'blocked' }))).toEqual(['notifications']);
  });

  it('never asks for the system-picker rows', () => {
    expect(pendingRequests(snapshot({ notifications: 'granted', camera: 'granted' }))).toEqual([]);
    expect(canRequest('not_needed')).toBe(false);
  });

  it('is complete only when every runtime permission is granted', () => {
    expect(hasOpenPermissions(snapshot({ notifications: 'granted', camera: 'granted' }))).toBe(
      false,
    );
    expect(hasOpenPermissions(snapshot({ notifications: 'granted' }))).toBe(true);
    expect(hasOpenPermissions(snapshot({ notifications: 'granted', camera: 'blocked' }))).toBe(
      true,
    );
  });
});

describe('the first-run intro', () => {
  it('shows once, and only while something is open', () => {
    expect(shouldShowPermissionsIntro({ alreadyShown: false, snapshot: snapshot({}) })).toBe(true);
    expect(shouldShowPermissionsIntro({ alreadyShown: true, snapshot: snapshot({}) })).toBe(false);
    expect(
      shouldShowPermissionsIntro({
        alreadyShown: false,
        snapshot: snapshot({ notifications: 'granted', camera: 'granted' }),
      }),
    ).toBe(false);
  });
});
