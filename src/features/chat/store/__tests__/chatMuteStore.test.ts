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
import { useToastStore } from '../../../../components/feedback/toastStore';
import { isChatMutedNow, useChatMuteStore } from '../chatMuteStore';

const fetchMock = installFetchMock();
const state = () => useChatMuteStore.getState();
const lastCall = () =>
  fetchMock.mock.calls[fetchMock.mock.calls.length - 1] as [string, RequestInit];
const bodyOf = (call: [string, RequestInit]) => JSON.parse(String(call[1].body));

beforeEach(() => {
  fetchMock.mockReset();
  state().reset();
  useToastStore.setState({ message: null });
});

describe('setMute', () => {
  it('moves at once, then takes the server answer, with the duration in the PUT body', async () => {
    let release: (response: Response) => void = () => undefined;

    fetchMock.mockImplementation(() => new Promise<Response>((resolve) => (release = resolve)));

    const pending = state().setMute(7, '8h');

    expect(state().byGroup['7']?.isMuted).toBe(true);
    expect(state().byGroup['7']?.mutedUntil).not.toBeNull();

    const [url, init] = lastCall();

    expect(url).toContain('/groups/7/chat/preferences/');
    expect(init.method).toBe('PUT');
    expect(bodyOf(lastCall())).toEqual({ is_muted: true, mute_for: '8h' });

    release(successEnvelope({ is_muted: true, muted_until: '2026-11-01T08:00:00Z' }));

    await expect(pending).resolves.toBe(true);
    expect(state().byGroup['7']).toEqual({ isMuted: true, mutedUntil: '2026-11-01T08:00:00Z' });
    expect(useToastStore.getState().tone).toBe('success');
  });

  it('sends the plain old body for an unmute', async () => {
    fetchMock.mockResolvedValue(successEnvelope({ is_muted: false, muted_until: null }));

    await state().setMute(7, 'unmute');

    expect(bodyOf(lastCall())).toEqual({ is_muted: false });
    expect(state().byGroup['7']).toEqual({ isMuted: false, mutedUntil: null });
  });

  it('rolls back and shows an error toast when the server refuses', async () => {
    fetchMock.mockResolvedValueOnce(successEnvelope({ is_muted: true, muted_until: null }));
    await state().setMute(7, 'forever');

    fetchMock.mockResolvedValueOnce(errorEnvelope(500, 'SERVER_ERROR'));

    await expect(state().setMute(7, 'unmute')).resolves.toBe(false);

    expect(state().byGroup['7']).toEqual({ isMuted: true, mutedUntil: null });
    expect(useToastStore.getState().tone).toBe('error');
    expect(useToastStore.getState().message).toBeTruthy();
  });

  it('lets only the newest choice decide when two requests overlap', async () => {
    const releases: ((response: Response) => void)[] = [];

    fetchMock.mockImplementation(() => new Promise<Response>((resolve) => releases.push(resolve)));

    const first = state().setMute(7, '8h');
    const second = state().setMute(7, 'unmute');

    releases[1]?.(successEnvelope({ is_muted: false, muted_until: null }));
    await second;
    releases[0]?.(successEnvelope({ is_muted: true, muted_until: '2026-11-01T08:00:00Z' }));
    await first;

    expect(state().byGroup['7']).toEqual({ isMuted: false, mutedUntil: null });
  });
});

describe('loading', () => {
  it('loads every chat with its effective state and sections data', async () => {
    fetchMock.mockResolvedValue(
      successEnvelope([
        { group_id: 1, name: 'مجتمع', kind: 'community', is_muted: true, muted_until: null },
        { group_id: 2, name: 'مادة', kind: 'subject', is_muted: false, muted_until: null },
      ]),
    );

    await state().loadAll();

    expect(lastCall()[0]).toContain('/api/v1/chat/preferences/');
    expect(state().items).toHaveLength(2);
    expect(state().byGroup['1']?.isMuted).toBe(true);
    expect(state().loadFailed).toBe(false);
  });

  it('flags a failed load without inventing a list', async () => {
    fetchMock.mockResolvedValue(errorEnvelope(500, 'SERVER_ERROR'));

    await state().loadAll();

    expect(state().items).toBeNull();
    expect(state().loadFailed).toBe(true);
  });

  it('loadOne reads one chat and ignores failures', async () => {
    fetchMock.mockResolvedValueOnce(
      successEnvelope({ is_muted: true, muted_until: '2999-01-01T00:00:00Z' }),
    );
    await state().loadOne(9);

    expect(state().byGroup['9']?.isMuted).toBe(true);

    fetchMock.mockResolvedValueOnce(errorEnvelope(500, 'SERVER_ERROR'));
    await state().loadOne(10);

    expect(state().byGroup['10']).toBeUndefined();
  });
});

describe('isChatMutedNow (foreground banner guard)', () => {
  it('is true only for an active mute', async () => {
    fetchMock.mockResolvedValue(
      successEnvelope([
        { group_id: 1, name: 'a', kind: 'subject', is_muted: true, muted_until: null },
        {
          group_id: 2,
          name: 'b',
          kind: 'subject',
          is_muted: true,
          muted_until: '2020-01-01T00:00:00Z',
        },
        { group_id: 3, name: 'c', kind: 'subject', is_muted: false, muted_until: null },
      ]),
    );
    await state().loadAll();

    expect(isChatMutedNow(1)).toBe(true);
    expect(isChatMutedNow('2')).toBe(false);
    expect(isChatMutedNow(3)).toBe(false);
    expect(isChatMutedNow(99)).toBe(false);
  });
});
