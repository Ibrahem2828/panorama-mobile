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

describe('connectionQuality', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const store = require('../networkStore') as typeof import('../networkStore');
  const base = {
    isOnline: true,
    internetReachable: null,
    linkFailures: 0,
    okSinceUnreachable: true,
  };

  it('is good by default and offline whenever the device is offline', () => {
    expect(store.connectionQuality(base)).toBe('good');
    expect(store.connectionQuality({ ...base, isOnline: false, linkFailures: 5 })).toBe('offline');
  });

  it('turns weak after consecutive lost requests and clears when one gets through', () => {
    store.useNetworkStore.setState({ ...base });
    store.useNetworkStore.getState().noteRequestLostLink();
    expect(store.connectionQuality(store.useNetworkStore.getState())).toBe('good');
    store.useNetworkStore.getState().noteRequestLostLink();
    expect(store.connectionQuality(store.useNetworkStore.getState())).toBe('weak');
    store.useNetworkStore.getState().noteRequestReachedServer();
    expect(store.connectionQuality(store.useNetworkStore.getState())).toBe('good');
  });

  it('trusts NetInfo unreachable only until a request gets through', () => {
    store.useNetworkStore.setState({ ...base });
    store.useNetworkStore.getState().setReachable(false);
    expect(store.connectionQuality(store.useNetworkStore.getState())).toBe('weak');
    store.useNetworkStore.getState().noteRequestReachedServer();
    expect(store.connectionQuality(store.useNetworkStore.getState())).toBe('good');
    store.useNetworkStore.getState().setReachable(true);
    expect(store.connectionQuality(store.useNetworkStore.getState())).toBe('good');
  });
});
