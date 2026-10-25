describe('isOnlineFromNetInfo', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { isOnlineFromNetInfo } = require('../networkStore') as typeof import('../networkStore');

  it('only a missing network interface counts as offline', () => {
    expect(isOnlineFromNetInfo({ isConnected: false, isInternetReachable: false })).toBe(false);
    expect(isOnlineFromNetInfo({ isConnected: true, isInternetReachable: false })).toBe(true);
    expect(isOnlineFromNetInfo({ isConnected: true, isInternetReachable: null })).toBe(true);
    expect(isOnlineFromNetInfo({ isConnected: null, isInternetReachable: null })).toBe(true);
  });
});
