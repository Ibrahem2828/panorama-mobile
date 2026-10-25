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
const mockLoadGroupDetail = jest.fn();
jest.mock('../../../groups/store', () => ({
  useGroupsStore: {
    getState: () => ({
      selectedGroup: {
        id: 7,
        current_user_membership_status: 'approved',
        send_messages_permission: 'all_members',
      },
      myGroups: [],
      availableGroups: [],
      loadGroupDetail: mockLoadGroupDetail,
    }),
  },
}));

import {
  errorEnvelope,
  headersOf,
  installFetchMock,
  successEnvelope,
} from '../../../../api/__tests__/testUtils';
import * as webSocketService from '../../services/chatWebSocketService';
import { normalizeChatMessage } from '../../logic/messages';
import type { ChatMessage } from '../../types';
import { FALLBACK_POLL_INTERVAL_MS, useChatStore } from '../chatStore';

const fetchMock = installFetchMock();

function page(ids: number[], next: string | null = null) {
  return successEnvelope({
    count: ids.length,
    next,
    previous: null,
    results: ids.map((id) => ({
      id,
      content: `m${id}`,
      sender_detail: { id: 2, full_name: 'Sara' },
      created_at: `2026-01-01T00:00:${String(id).padStart(2, '0')}Z`,
    })),
  });
}

type ClientOptions = Parameters<typeof webSocketService.createChatWebSocketClient>[0];
let capturedOptions: ClientOptions | null = null;
const disconnect = jest.fn();

const frameOf = (payload: Record<string, unknown>) => normalizeChatMessage(payload) as ChatMessage;
const flush = () => new Promise((resolve) => setImmediate(resolve));
const room = () => useChatStore.getState().rooms['7'];
const messageIds = () => room().messages.map((message) => message.id);

function routeFetch(handlers: { messages?: () => Response; send?: () => Promise<Response> }) {
  fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
    if (init?.method === 'POST' && url.endsWith('/chat-ticket/')) {
      return successEnvelope({ ticket: 'abc', expires_at: 'x' }, 201);
    }

    if (init?.method === 'POST') {
      return handlers.send ? handlers.send() : successEnvelope({}, 201);
    }

    return handlers.messages ? handlers.messages() : page([]);
  });
}

beforeEach(() => {
  fetchMock.mockReset();
  mockLoadGroupDetail.mockReset();
  disconnect.mockReset();
  useChatStore.getState().reset();
  capturedOptions = null;
  jest.spyOn(webSocketService, 'createChatWebSocketClient').mockImplementation((options) => {
    capturedOptions = options;

    return {
      connect: jest.fn(),
      disconnect,
      send: jest.fn(() => false),
      sendFrame: jest.fn(() => false),
    };
  });
});

afterEach(() => {
  useChatStore.getState().closeRoom();
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('opening a room', () => {
  it('loads the newest page oldest-first and fetches tickets with the JWT in the header only', async () => {
    routeFetch({ messages: () => page([3, 2, 1], 'https://api.example.com/next') });

    useChatStore.getState().openRoom(7);
    await flush();

    expect(messageIds()).toEqual([1, 2, 3]);
    expect(room().hasOlder).toBe(true);
    expect(fetchMock.mock.calls[0][0]).toContain('/api/v1/groups/7/messages/');
    expect(fetchMock.mock.calls[0][0]).toContain('ordering=-created_at');

    const ticket = await capturedOptions?.getTicket();
    const ticketCall = fetchMock.mock.calls.findIndex(([url]) => url.endsWith('/chat-ticket/'));

    expect(ticket).toBe('abc');
    expect(fetchMock.mock.calls[ticketCall][0]).not.toContain('jwt-access');
    expect(headersOf(fetchMock, ticketCall).Authorization).toBe('Bearer jwt-access');
  });

  it('surfaces a 403 as a forbidden room and stops the live connection', async () => {
    routeFetch({ messages: () => errorEnvelope(403, 'FORBIDDEN') });

    useChatStore.getState().openRoom(7);
    await flush();

    expect(room().forbidden).toBe(true);
    expect(disconnect).toHaveBeenCalled();
  });

  it('a failed first load shows an error, not an empty room', async () => {
    routeFetch({ messages: () => errorEnvelope(500, 'SERVER_ERROR') });

    useChatStore.getState().openRoom(7);
    await flush();

    expect(room().error).toMatch(/\S/u);
    expect(room().hasLoaded).toBe(false);
  });
});

describe('live updates', () => {
  it('catches up over REST when the socket connects and merges by server id', async () => {
    routeFetch({ messages: () => page([2, 1]) });
    useChatStore.getState().openRoom(7);
    await flush();

    routeFetch({ messages: () => page([4, 3, 2]) });
    capturedOptions?.handlers?.onStatusChange?.('connected');
    await flush();

    expect(messageIds()).toEqual([1, 2, 3, 4]);
  });

  it('a socket echo of a message already fetched over REST does not duplicate it', async () => {
    routeFetch({ messages: () => page([1]) });
    useChatStore.getState().openRoom(7);
    await flush();

    const frame = frameOf({ id: 1, content: 'm1', created_at: '2026-01-01T00:00:01Z', sender: 2 });

    capturedOptions?.handlers?.onMessage?.(frame);
    capturedOptions?.handlers?.onMessage?.(frame);

    expect(messageIds()).toEqual([1]);
  });

  it('removes a live-deleted message and never resurrects it from a stale page', async () => {
    routeFetch({ messages: () => page([2, 1]) });
    useChatStore.getState().openRoom(7);
    await flush();

    capturedOptions?.handlers?.onMessageDeleted?.(2);
    expect(messageIds()).toEqual([1]);

    routeFetch({ messages: () => page([2, 1]) });
    await useChatStore.getState().refresh(7);

    expect(messageIds()).toEqual([1]);
  });

  it('polls over REST only while the socket is not connected', async () => {
    jest.useFakeTimers({ doNotFake: ['setImmediate', 'nextTick'] });
    routeFetch({ messages: () => page([1]) });
    useChatStore.getState().openRoom(7);
    await flush();
    fetchMock.mockClear();

    jest.advanceTimersByTime(FALLBACK_POLL_INTERVAL_MS);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await flush();
    capturedOptions?.handlers?.onStatusChange?.('connected');
    await flush();
    fetchMock.mockClear();
    jest.advanceTimersByTime(FALLBACK_POLL_INTERVAL_MS * 3);

    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('older history', () => {
  it('loads the next page and prepends it without duplicates', async () => {
    routeFetch({ messages: () => page([4, 3], 'https://api.example.com/next') });
    useChatStore.getState().openRoom(7);
    await flush();

    routeFetch({ messages: () => page([3, 2, 1]) });
    await useChatStore.getState().loadOlder(7);

    expect(messageIds()).toEqual([1, 2, 3, 4]);
    expect(room().hasOlder).toBe(false);
    expect(fetchMock.mock.calls[fetchMock.mock.calls.length - 1][0]).toContain('page=2');
  });

  it('keeps what is loaded and offers a retry when an older page fails', async () => {
    routeFetch({ messages: () => page([2], 'https://api.example.com/next') });
    useChatStore.getState().openRoom(7);
    await flush();

    routeFetch({ messages: () => errorEnvelope(500, 'SERVER_ERROR') });
    await useChatStore.getState().loadOlder(7);

    expect(messageIds()).toEqual([2]);
    expect(room().loadOlderFailed).toBe(true);
    expect(room().isLoadingOlder).toBe(false);
  });
});

describe('optimistic sending', () => {
  it('shows a sending bubble, then replaces it with the confirmed message', async () => {
    routeFetch({
      messages: () => page([]),
      send: async () =>
        successEnvelope(
          {
            id: 11,
            content: 'hello',
            sender_detail: { id: 1, full_name: 'Me' },
            created_at: '2026-01-01T00:00:11Z',
          },
          201,
        ),
    });
    useChatStore.getState().openRoom(7);
    await flush();

    expect(useChatStore.getState().send(7, { text: ' hello ' })).toEqual({ ok: true });
    expect(room().pending[0]).toMatchObject({ content: 'hello', status: 'sending' });

    await flush();

    expect(room().pending).toHaveLength(0);
    expect(messageIds()).toEqual([11]);
  });

  it('drops the sending bubble when the socket echoes the same message first', async () => {
    let finishSend: (response: Response) => void = () => undefined;

    routeFetch({
      messages: () => page([]),
      send: () => new Promise<Response>((resolve) => (finishSend = resolve)),
    });
    useChatStore.getState().openRoom(7);
    await flush();
    useChatStore.getState().send(7, { text: 'hello' });

    capturedOptions?.handlers?.onMessage?.(
      frameOf({
        id: 11,
        content: 'hello',
        sender: 1,
        sender_detail: { id: 1, full_name: 'Me' },
        created_at: '2026-01-01T00:00:11Z',
      }),
    );

    expect(room().pending).toHaveLength(0);
    expect(messageIds()).toEqual([11]);

    finishSend(
      successEnvelope(
        { id: 11, content: 'hello', sender: 1, created_at: '2026-01-01T00:00:11Z' },
        201,
      ),
    );
    await flush();

    expect(messageIds()).toEqual([11]);
  });

  it('marks a network failure as failed and re-uses the same Idempotency-Key on retry', async () => {
    routeFetch({ messages: () => page([]) });
    useChatStore.getState().openRoom(7);
    await flush();

    fetchMock.mockImplementation(async (_url: string, init?: RequestInit) => {
      if (init?.method === 'POST') {
        throw new TypeError('Network request failed');
      }

      return page([]);
    });
    useChatStore.getState().send(7, { text: 'hello' });
    await flush();

    expect(room().pending[0].status).toBe('failed');
    expect(room().pending[0].error).toMatch(/\S/u);

    routeFetch({
      send: async () => successEnvelope({ id: 12, content: 'hello', sender: 1 }, 201),
    });
    useChatStore.getState().retry(7, room().pending[0].localId);
    await flush();

    const posts = fetchMock.mock.calls
      .map((call, index) => ({ method: call[1]?.method, index }))
      .filter(
        (call) =>
          call.method === 'POST' &&
          !String(fetchMock.mock.calls[call.index][0]).endsWith('/chat-ticket/'),
      );

    expect(posts).toHaveLength(2);
    expect(headersOf(fetchMock, posts[1].index)['Idempotency-Key']).toBeTruthy();
    expect(room().pending).toHaveLength(0);
    expect(messageIds()).toEqual([12]);
  });

  it('uses a fresh key after the server definitively rejected the previous one', async () => {
    routeFetch({
      messages: () => page([]),
      send: async () => errorEnvelope(400, 'VALIDATION_ERROR'),
    });
    useChatStore.getState().openRoom(7);
    await flush();
    useChatStore.getState().send(7, { text: 'hello' });
    await flush();

    const failed = room().pending[0];

    expect(failed.status).toBe('failed');
    expect(failed.keyBurned).toBe(true);

    useChatStore.getState().retry(7, failed.localId);

    expect(room().pending[0].idempotencyKey).not.toBe(failed.idempotencyKey);
  });

  it('discard removes a failed bubble', async () => {
    routeFetch({ messages: () => page([]), send: async () => errorEnvelope(500, 'SERVER_ERROR') });
    useChatStore.getState().openRoom(7);
    await flush();
    useChatStore.getState().send(7, { text: 'hello' });
    await flush();

    useChatStore.getState().discard(7, room().pending[0].localId);

    expect(room().pending).toHaveLength(0);
  });

  it('rejects empty and over-long text before any request', async () => {
    routeFetch({ messages: () => page([]) });
    useChatStore.getState().openRoom(7);
    await flush();
    fetchMock.mockClear();

    expect(useChatStore.getState().send(7, { text: '   ' }).ok).toBe(false);
    expect(useChatStore.getState().send(7, { text: 'x'.repeat(4001) }).ok).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
