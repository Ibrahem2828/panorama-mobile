jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {
      extra: { apiBaseUrl: 'https://api.example.com', wsBaseUrl: 'wss://api.example.com' },
    },
  },
}));

import { ApiClientError } from '../../../../api/errors';
import {
  RECONNECT_BASE_DELAY_MS,
  RECONNECT_MAX_DELAY_MS,
  computeReconnectDelayMs,
  createChatWebSocketClient,
  isTerminalCloseCode,
  normalizeSocketMessage,
  type ChatConnectionEnvironment,
} from '../chatWebSocketService';

class FakeWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;
  static instances: FakeWebSocket[] = [];

  readyState = FakeWebSocket.CONNECTING;
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onerror: (() => void) | null = null;
  onclose: ((event: { code: number }) => void) | null = null;
  sent: string[] = [];

  constructor(readonly url: string) {
    FakeWebSocket.instances.push(this);
  }

  send(data: string) {
    this.sent.push(data);
  }

  close() {
    this.readyState = FakeWebSocket.CLOSED;
  }

  open() {
    this.readyState = FakeWebSocket.OPEN;
    this.onopen?.();
  }

  receive(payload: unknown) {
    this.onmessage?.({ data: JSON.stringify(payload) });
  }

  drop(code = 1006) {
    this.readyState = FakeWebSocket.CLOSED;
    this.onclose?.({ code });
  }
}

const lastSocket = () => FakeWebSocket.instances[FakeWebSocket.instances.length - 1];

function setup(
  options: { getTicket?: () => Promise<string>; environment?: ChatConnectionEnvironment } = {},
) {
  let counter = 0;
  const getTicket = options.getTicket ?? jest.fn(async () => `ticket-${(counter += 1)}`);
  const handlers = {
    onMessage: jest.fn(),
    onStatusChange: jest.fn(),
    onError: jest.fn(),
    onReconnected: jest.fn(),
  };
  const client = createChatWebSocketClient({
    groupId: 7,
    getTicket,
    handlers,
    environment: options.environment,
    webSocketFactory: (url) => new FakeWebSocket(url) as unknown as WebSocket,
    random: () => 1, // no jitter reduction: delay === nominal
  });

  return { client, getTicket: getTicket as jest.Mock, handlers };
}

/** Lets the pending ticket promise settle. */
async function flush() {
  await jest.advanceTimersByTimeAsync(0);
}

beforeEach(() => {
  jest.useFakeTimers();
  FakeWebSocket.instances = [];
  (globalThis as { WebSocket: unknown }).WebSocket = FakeWebSocket;
});

afterEach(() => jest.useRealTimers());

describe('ticket handshake', () => {
  it('requests a ticket first and connects with ?ticket= (never a JWT)', async () => {
    const { client, getTicket } = setup();

    client.connect();
    await flush();

    expect(getTicket).toHaveBeenCalledTimes(1);
    expect(lastSocket().url).toBe('wss://api.example.com/ws/v1/groups/7/chat/?ticket=ticket-1');
    expect(lastSocket().url).not.toContain('token=');
  });

  it('requests a FRESH ticket before every reconnect', async () => {
    const { client, getTicket } = setup();

    client.connect();
    await flush();
    lastSocket().open();
    lastSocket().drop(1006);
    await jest.advanceTimersByTimeAsync(RECONNECT_BASE_DELAY_MS);
    lastSocket().open();
    lastSocket().drop(1006);
    await jest.advanceTimersByTimeAsync(RECONNECT_BASE_DELAY_MS);

    expect(getTicket).toHaveBeenCalledTimes(3);
    expect(FakeWebSocket.instances.map((socket) => socket.url.split('ticket=')[1])).toEqual([
      'ticket-1',
      'ticket-2',
      'ticket-3',
    ]);
  });

  it('stops without reconnecting when the ticket is denied (401/403)', async () => {
    const getTicket = jest.fn(async () => {
      throw new ApiClientError({ code: 'FORBIDDEN', status: 403, message: 'no' });
    });
    const { client, handlers } = setup({ getTicket });

    client.connect();
    await flush();
    await jest.advanceTimersByTimeAsync(RECONNECT_MAX_DELAY_MS * 3);

    expect(getTicket).toHaveBeenCalledTimes(1);
    expect(FakeWebSocket.instances).toHaveLength(0);
    expect(handlers.onError).toHaveBeenCalledTimes(1);
  });

  it('keeps retrying (with fresh tickets) when the ticket call fails transiently', async () => {
    let calls = 0;
    const getTicket = jest.fn(async () => {
      calls += 1;
      if (calls === 1) throw new ApiClientError({ code: 'NETWORK_ERROR', message: 'offline' });
      return 'ticket-ok';
    });
    const { client } = setup({ getTicket });

    client.connect();
    await flush();
    await jest.advanceTimersByTimeAsync(RECONNECT_BASE_DELAY_MS);

    expect(getTicket).toHaveBeenCalledTimes(2);
    expect(lastSocket().url).toContain('ticket=ticket-ok');
  });
});

describe('reconnect policy', () => {
  it('backs off exponentially up to the cap, with jitter inside [n/2, n]', () => {
    const delays = [0, 1, 2, 3, 4, 5, 6, 10].map((attempt) =>
      computeReconnectDelayMs(attempt, () => 1),
    );

    expect(delays).toEqual([1000, 2000, 4000, 8000, 16000, 30000, 30000, 30000]);
    expect(computeReconnectDelayMs(3, () => 0)).toBe(4000);
    expect(computeReconnectDelayMs(3, () => 0.5)).toBe(6000);
  });

  it('is unbounded: it keeps reconnecting well past three attempts', async () => {
    const { client, getTicket } = setup();

    client.connect();
    await flush();

    for (let index = 0; index < 8; index += 1) {
      lastSocket().drop(1006);
      await jest.advanceTimersByTimeAsync(RECONNECT_MAX_DELAY_MS);
    }

    expect(getTicket.mock.calls.length).toBeGreaterThanOrEqual(9);
  });

  it('follows the exponential schedule between failed attempts', async () => {
    const { client, getTicket } = setup();

    client.connect();
    await flush();
    lastSocket().drop(1006); // attempt 0 -> 1000ms
    await jest.advanceTimersByTimeAsync(999);
    expect(getTicket).toHaveBeenCalledTimes(1);
    await jest.advanceTimersByTimeAsync(1);
    expect(getTicket).toHaveBeenCalledTimes(2);

    lastSocket().drop(1006); // attempt 1 -> 2000ms
    await jest.advanceTimersByTimeAsync(1999);
    expect(getTicket).toHaveBeenCalledTimes(2);
    await jest.advanceTimersByTimeAsync(1);
    expect(getTicket).toHaveBeenCalledTimes(3);
  });

  it('resets the backoff after a successful connection', async () => {
    const { client, getTicket } = setup();

    client.connect();
    await flush();
    lastSocket().drop(1006);
    await jest.advanceTimersByTimeAsync(RECONNECT_BASE_DELAY_MS);
    lastSocket().drop(1006);
    await jest.advanceTimersByTimeAsync(2 * RECONNECT_BASE_DELAY_MS);
    lastSocket().open();
    lastSocket().drop(1006);

    await jest.advanceTimersByTimeAsync(RECONNECT_BASE_DELAY_MS);
    expect(getTicket).toHaveBeenCalledTimes(4);
  });

  it.each([4401, 4403])('stops on terminal close code %s', async (code) => {
    const { client, getTicket, handlers } = setup();

    client.connect();
    await flush();
    lastSocket().open();
    lastSocket().drop(code);
    await jest.advanceTimersByTimeAsync(RECONNECT_MAX_DELAY_MS * 2);

    expect(getTicket).toHaveBeenCalledTimes(1);
    expect(handlers.onError).toHaveBeenCalled();
    expect(isTerminalCloseCode(code)).toBe(true);
  });

  it('does not reconnect after disconnect() (screen unmounted)', async () => {
    const { client, getTicket } = setup();

    client.connect();
    await flush();
    lastSocket().open();
    client.disconnect();
    lastSocket().drop(1000);
    await jest.advanceTimersByTimeAsync(RECONNECT_MAX_DELAY_MS * 2);

    expect(getTicket).toHaveBeenCalledTimes(1);
  });

  it('ignores a ticket that resolves after disconnect()', async () => {
    let resolveTicket: (ticket: string) => void = () => undefined;
    const getTicket = jest.fn(() => new Promise<string>((resolve) => (resolveTicket = resolve)));
    const { client } = setup({ getTicket });

    client.connect();
    client.disconnect();
    resolveTicket('late');
    await flush();

    expect(FakeWebSocket.instances).toHaveLength(0);
  });

  it('fires onReconnected only for re-connects, not the first connect', async () => {
    const { client, handlers } = setup();

    client.connect();
    await flush();
    lastSocket().open();
    expect(handlers.onReconnected).not.toHaveBeenCalled();

    lastSocket().drop(1006);
    await jest.advanceTimersByTimeAsync(RECONNECT_BASE_DELAY_MS);
    lastSocket().open();

    expect(handlers.onReconnected).toHaveBeenCalledTimes(1);
  });
});

describe('foreground / network', () => {
  function makeEnvironment() {
    let foreground = true;
    const listeners: Parameters<ChatConnectionEnvironment['subscribe']>[0][] = [];
    const environment: ChatConnectionEnvironment = {
      isForeground: () => foreground,
      subscribe: (next) => {
        listeners.push(next);
        return () => undefined;
      },
    };

    return {
      environment,
      goBackground() {
        foreground = false;
        listeners.forEach((listener) => listener.onBackground());
      },
      goForeground() {
        foreground = true;
        listeners.forEach((listener) => listener.onForeground());
      },
      networkBack() {
        listeners.forEach((listener) => listener.onNetworkAvailable());
      },
    };
  }

  it('closes in the background without scheduling reconnects, then resumes at once on foreground', async () => {
    const env = makeEnvironment();
    const { client, getTicket } = setup({ environment: env.environment });

    client.connect();
    await flush();
    lastSocket().open();
    env.goBackground();
    await jest.advanceTimersByTimeAsync(RECONNECT_MAX_DELAY_MS * 2);
    expect(getTicket).toHaveBeenCalledTimes(1);

    env.goForeground();
    await flush();

    expect(getTicket).toHaveBeenCalledTimes(2);
    lastSocket().open();
  });

  it('reconnects immediately (skipping the backoff wait) when the network returns', async () => {
    const env = makeEnvironment();
    const { client, getTicket } = setup({ environment: env.environment });

    client.connect();
    await flush();
    lastSocket().drop(1006);
    lastSocket().drop(1006);
    env.networkBack();
    await flush();

    expect(getTicket).toHaveBeenCalledTimes(2);
  });
});

describe('message frames', () => {
  it('accepts a server message frame and keeps its server id', () => {
    const message = normalizeSocketMessage(
      {
        type: 'message',
        data: { id: 42, content: 'hi', sender: 3, created_at: '2026-01-01T00:00:00Z' },
      },
      7,
    );

    expect(message).toMatchObject({ id: 42, content: 'hi', group: 7 });
  });

  it('never invents an id: frames without a server id are dropped', () => {
    expect(normalizeSocketMessage({ type: 'message', data: { content: 'hi' } }, 7)).toBeNull();
  });

  it('does not turn error or typing frames into chat messages', () => {
    expect(
      normalizeSocketMessage({ type: 'error', code: 'RATE_LIMITED', message: 'Too many' }, 7),
    ).toBeNull();
    expect(normalizeSocketMessage({ type: 'typing', user_id: 2, is_typing: true }, 7)).toBeNull();
  });

  it('delivers parsed messages to the handler', async () => {
    const { client, handlers } = setup();

    client.connect();
    await flush();
    lastSocket().open();
    lastSocket().receive({ type: 'message', data: { id: 1, content: 'a' } });
    lastSocket().receive({ type: 'typing', user_id: 2, is_typing: true });

    expect(handlers.onMessage).toHaveBeenCalledTimes(1);
  });

  it('send() reports false when the socket is not open so callers can fall back to REST', async () => {
    const { client } = setup();

    expect(client.send('hello')).toBe(false);
    client.connect();
    await flush();
    expect(client.send('hello')).toBe(false);
    lastSocket().open();
    expect(client.send('hello')).toBe(true);
    expect(JSON.parse(lastSocket().sent[0])).toEqual({ type: 'message', content: 'hello' });
  });
});
