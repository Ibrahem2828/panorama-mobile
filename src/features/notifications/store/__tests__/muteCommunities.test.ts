jest.mock('react-native', () => ({
  Platform: { OS: 'android' },
  I18nManager: { isRTL: true, forceRTL: jest.fn(), allowRTL: jest.fn() },
  AppState: { currentState: 'active', addEventListener: jest.fn(() => ({ remove: jest.fn() })) },
}));
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {
      extra: { apiBaseUrl: 'https://api.example.com', wsBaseUrl: 'wss://api.example.com' },
    },
  },
}));
jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: { addEventListener: jest.fn(() => jest.fn()) },
}));
jest.mock('../../../auth/store', () => ({
  useAuthStore: { getState: () => ({ accessToken: 'jwt-access', user: { id: 1 } }) },
}));

import {
  errorEnvelope,
  installFetchMock,
  successEnvelope,
} from '../../../../api/__tests__/testUtils';
import { useChatMuteStore } from '../../../chat/store/chatMuteStore';
import { useNotificationPrefsStore } from '../notificationPrefsStore';

const fetchMock = installFetchMock();
const prefs = () => useNotificationPrefsStore.getState();
const flush = () => new Promise((resolve) => setImmediate(resolve));

beforeEach(() => {
  fetchMock.mockReset();
  prefs().reset();
  useChatMuteStore.getState().reset();
});

async function loadWith(muteCommunities?: boolean) {
  fetchMock.mockResolvedValueOnce(
    successEnvelope({
      in_app_enabled: true,
      push_enabled: true,
      disabled_types: [],
      ...(muteCommunities === undefined ? {} : { mute_communities: muteCommunities }),
    }),
  );
  await prefs().loadPrefs();
}

describe('setMuteCommunities', () => {
  it('PATCHes mute_communities, keeps the switch, and refreshes the chat list', async () => {
    await loadWith(false);

    fetchMock.mockImplementation(async (url: string, init?: RequestInit) =>
      init?.method === 'PATCH'
        ? // The answer leaves the field out: the switch must not vanish.
          successEnvelope({ in_app_enabled: true, push_enabled: true, disabled_types: [] })
        : successEnvelope([
            { group_id: 1, name: 'مجتمع', kind: 'community', is_muted: true, muted_until: null },
          ]),
    );

    await prefs().setMuteCommunities(true);
    await flush();

    const patch = fetchMock.mock.calls.find(([, init]) => init?.method === 'PATCH');

    expect(patch?.[0]).toContain('/notifications/preferences/');
    expect(JSON.parse(String(patch?.[1]?.body))).toEqual({ mute_communities: true });
    expect(prefs().prefs?.muteCommunities).toBe(true);
    expect(useChatMuteStore.getState().byGroup['1']?.isMuted).toBe(true);
  });

  it('goes back when the save fails', async () => {
    await loadWith(false);
    fetchMock.mockResolvedValueOnce(errorEnvelope(500, 'SERVER_ERROR'));

    await prefs().setMuteCommunities(true);

    expect(prefs().prefs?.muteCommunities).toBe(false);
    expect(prefs().failed).toBe(true);
  });

  it('does nothing on a backend without the setting', async () => {
    await loadWith();
    fetchMock.mockClear();

    await prefs().setMuteCommunities(true);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(prefs().prefs?.muteCommunities).toBeNull();
  });
});
