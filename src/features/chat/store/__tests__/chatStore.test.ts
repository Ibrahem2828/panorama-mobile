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
jest.mock('../../../groups/store', () => ({
  useGroupsStore: { getState: () => ({ selectedGroup: null, myGroups: [], availableGroups: [] }) },
}));

import {
  errorEnvelope,
  headersOf,
  installFetchMock,
  successEnvelope,
} from '../../../../api/__tests__/testUtils';
import { resetIdempotencyKeys } from '../../../../api/idempotency';
import * as webSocketService from '../../services/chatWebSocketService';
import { useChatStore } from '../chatStore';

const fetchMock = installFetchMock();
const messages = (...ids: number[]) =>
  successEnvelope({
    count: ids.length,
    results: ids.map((id) => ({
      id,
      content: `m${id}`,
      created_at: `2026-01-01T00:00:0${id}Z`,
    })),
  });

type ClientOptions = Parameters<typeof webSocketService.createChatWebSocketClient>[0];
let capturedOptions: ClientOptions | null = null;

beforeEach(() => {
  fetchMock.mockReset();
  resetIdempotencyKeys();
  useChatStore.getState().reset();
  capturedOptions = null;
  jest.spyOn(webSocketService, 'createChatWebSocketClient').mockImplementation((options) => {
    capturedOptions = options;

    return { connect: jest.fn(), disconnect: jest.fn(), send: jest.fn(() => false) };
  });
});

afterEach(() => jest.restoreAllMocks());

describe('chat connection wiring', () => {
  it('fetches the ticket with the JWT in the Authorization header only', async () => {
    fetchMock.mockResolvedValue(
      successEnvelope({ ticket: 'abc', expires_at: '2026-01-01T00:00:30Z' }, 201),
    );

    useChatStore.getState().connectGroupChat(7);
    const ticket = await capturedOptions?.getTicket();

    expect(ticket).toBe('abc');
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.example.com/api/v1/groups/7/chat-ticket/');
    expect(fetchMock.mock.calls[0][1]?.method).toBe('POST');
    expect(fetchMock.mock.calls[0][0]).not.toContain('jwt-access');
    expect(headersOf(fetchMock, 0).Authorization).toBe('Bearer jwt-access');
  });

  it('asks for a new ticket on every call', async () => {
    fetchMock
      .mockResolvedValueOnce(successEnvelope({ ticket: 't1', expires_at: 'x' }, 201))
      .mockResolvedValueOnce(successEnvelope({ ticket: 't2', expires_at: 'x' }, 201));

    useChatStore.getState().connectGroupChat(7);

    await expect(capturedOptions?.getTicket()).resolves.toBe('t1');
    await expect(capturedOptions?.getTicket()).resolves.toBe('t2');
  });

  it('catches up over REST after a reconnect and merges by server id', async () => {
    useChatStore
      .getState()
      .addIncomingMessage(7, { id: 1, content: 'm1', created_at: '2026-01-01T00:00:01Z' });
    useChatStore
      .getState()
      .addIncomingMessage(7, { id: 2, content: 'm2', created_at: '2026-01-01T00:00:02Z' });
    fetchMock.mockResolvedValue(messages(2, 3, 4));

    useChatStore.getState().connectGroupChat(7);
    capturedOptions?.handlers?.onReconnected?.();
    await new Promise((resolve) => setImmediate(resolve));

    expect(fetchMock.mock.calls[0][0]).toContain('/api/v1/groups/7/messages/');
    expect(useChatStore.getState().messagesByGroupId['7'].map((message) => message.id)).toEqual([
      1, 2, 3, 4,
    ]);
  });

  it('a socket echo of a message already fetched over REST does not duplicate it', () => {
    const store = useChatStore.getState();

    store.addIncomingMessage(7, { id: 9, content: 'x', created_at: '2026-01-01T00:00:09Z' });
    store.addIncomingMessage(7, { id: 9, content: 'x', created_at: '2026-01-01T00:00:09Z' });

    expect(useChatStore.getState().messagesByGroupId['7']).toHaveLength(1);
  });
});

describe('REST send', () => {
  it('re-uses one Idempotency-Key when the same message is re-sent after a failure', async () => {
    fetchMock
      .mockRejectedValueOnce(new TypeError('Network request failed'))
      .mockResolvedValueOnce(
        successEnvelope({ id: 11, content: 'hello', created_at: '2026-01-01T00:00:11Z' }, 201),
      );
    const store = useChatStore.getState();

    store.setDraftMessage(7, 'hello');
    await store.sendMessage(7);
    expect(useChatStore.getState().sendErrorMessage).not.toBeNull();

    await useChatStore.getState().sendMessage(7);

    const first = headersOf(fetchMock, 0)['Idempotency-Key'];
    expect(first).toBeTruthy();
    expect(headersOf(fetchMock, 1)['Idempotency-Key']).toBe(first);
    expect(useChatStore.getState().messagesByGroupId['7'].map((message) => message.id)).toEqual([
      11,
    ]);
  });

  it('surfaces a friendly error and keeps the draft when the key was reused with another body', async () => {
    fetchMock.mockResolvedValue(errorEnvelope(409, 'IDEMPOTENCY_KEY_REUSED'));
    const store = useChatStore.getState();

    store.setDraftMessage(7, 'hello');
    await store.sendMessage(7);

    expect(useChatStore.getState().sendErrorMessage).toMatch(/\S/u);
    expect(useChatStore.getState().draftByGroupId['7']).toBe('hello');
  });
});
