import { buildGroupChatWebSocketUrl } from '../../../config/env';
import { normalizeApiError } from '../../../api';
import type { ChatConnectionStatus, ChatMessage, Id } from '../types';
import { useLocaleStore } from '../../../i18n';

export type ChatWebSocketHandlers = {
  onMessage?: (message: ChatMessage) => void;
  onStatusChange?: (status: ChatConnectionStatus) => void;
  onError?: (message: string) => void;
  /**
   * Fired after every successful RE-connect (not the first connect). Messages sent while
   * the socket was down are never replayed by the server, so the owner must run a REST
   * catch-up here.
   */
  onReconnected?: () => void;
};

/** What the client needs to know about the app, injected so it stays platform-free. */
export type ChatConnectionEnvironment = {
  isForeground: () => boolean;
  subscribe: (listeners: {
    onForeground: () => void;
    onBackground: () => void;
    onNetworkAvailable: () => void;
  }) => () => void;
};

type ChatWebSocketClientOptions = {
  groupId: Id;
  /** Requests a FRESH single-use handshake ticket. Called before every connect attempt. */
  getTicket: () => Promise<string>;
  handlers?: ChatWebSocketHandlers;
  environment?: ChatConnectionEnvironment;
  webSocketFactory?: (url: string) => WebSocket;
  random?: () => number;
};

export type ChatWebSocketClient = {
  connect: () => void;
  disconnect: () => void;
  /** Returns false when the socket is not open (the caller should fall back to REST). */
  send: (message: string) => boolean;
};

export const RECONNECT_BASE_DELAY_MS = 1000;
export const RECONNECT_MAX_DELAY_MS = 30_000;

/** Close codes sent by the backend consumer: 4401 not authenticated, 4403 not allowed. */
const TERMINAL_CLOSE_CODES = new Set([4401, 4403, 1008]);

export function isTerminalCloseCode(code: number | undefined): boolean {
  return typeof code === 'number' && TERMINAL_CLOSE_CODES.has(code);
}

/**
 * Exponential backoff with "equal jitter": the nominal delay doubles per attempt up to the
 * cap, and the actual wait is a random value in [nominal/2, nominal] so a crowd of clients
 * dropped by the same outage does not reconnect in lockstep.
 */
export function computeReconnectDelayMs(attempt: number, random: () => number = Math.random) {
  const nominal = Math.min(RECONNECT_MAX_DELAY_MS, RECONNECT_BASE_DELAY_MS * 2 ** attempt);

  return Math.round(nominal / 2 + (nominal / 2) * random());
}

// Read at failure time so the message follows the current locale.
function chatErrors() {
  return useLocaleStore.getState().t.chat.errors;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toText(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }

  if (typeof value === 'number') {
    return String(value);
  }

  return undefined;
}

function toId(value: unknown): Id | null {
  if (typeof value === 'string' || typeof value === 'number') {
    return value;
  }

  return null;
}

/**
 * Accepts only server-issued chat messages. Frames without a server id are dropped on
 * purpose: a locally invented id would never match the REST copy of the same message and
 * would show it twice. The REST catch-up delivers anything dropped here.
 */
export function normalizeSocketMessage(payload: unknown, groupId: Id): ChatMessage | null {
  if (!isRecord(payload)) {
    return null;
  }

  // `{type:'typing'}` and `{type:'error', message}` frames are not chat messages.
  if (payload.type !== undefined && payload.type !== 'message') {
    return null;
  }

  const candidate = isRecord(payload.data)
    ? payload.data
    : isRecord(payload.message)
      ? payload.message
      : payload;
  const id = toId(candidate.id);
  const content =
    toText(candidate.content) ??
    toText(candidate.message) ??
    toText(candidate.body) ??
    toText(candidate.text);

  if (id === null || !content) {
    return null;
  }

  return {
    ...candidate,
    id,
    group: toId(candidate.group) ?? groupId,
    sender: toId(candidate.sender) ?? (isRecord(candidate.sender) ? candidate.sender : null),
    sender_name: toText(candidate.sender_name),
    content,
    created_at: toText(candidate.created_at),
    updated_at: toText(candidate.updated_at),
  };
}

function isTerminalTicketError(error: unknown): boolean {
  const { code } = normalizeApiError(error);

  return (
    code === 'UNAUTHORIZED' ||
    code === 'FORBIDDEN' ||
    code === 'NOT_FOUND' ||
    code === 'APP_UPDATE_REQUIRED'
  );
}

export function createChatWebSocketClient({
  groupId,
  getTicket,
  handlers,
  environment,
  webSocketFactory = (url) => new WebSocket(url),
  random = Math.random,
}: ChatWebSocketClientOptions): ChatWebSocketClient {
  let socket: WebSocket | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let unsubscribeEnvironment: (() => void) | null = null;
  let reconnectAttempts = 0;
  let hasConnectedBefore = false;
  let isRunning = false;
  let isAcquiringTicket = false;
  // Bumped on every start/stop so a late ticket or a stale socket callback is ignored.
  let generation = 0;

  function setStatus(status: ChatConnectionStatus) {
    handlers?.onStatusChange?.(status);
  }

  function clearReconnectTimer() {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  }

  function canConnectNow(): boolean {
    return isRunning && (environment ? environment.isForeground() : true);
  }

  function scheduleReconnect(minimumDelayMs = 0) {
    clearReconnectTimer();

    if (!canConnectNow()) {
      // Backgrounded: stay quiet. Returning to the foreground restarts the loop.
      setStatus('disconnected');
      return;
    }

    const delayMs = Math.max(minimumDelayMs, computeReconnectDelayMs(reconnectAttempts, random));

    reconnectAttempts += 1;
    setStatus('reconnecting');
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      void openConnection();
    }, delayMs);
  }

  async function openConnection() {
    if (!canConnectNow() || isAcquiringTicket) {
      return;
    }

    if (socket && socket.readyState !== WebSocket.CLOSED) {
      return;
    }

    const attemptGeneration = generation;

    isAcquiringTicket = true;
    setStatus(hasConnectedBefore || reconnectAttempts > 0 ? 'reconnecting' : 'connecting');

    let ticket: string;

    try {
      // A ticket is single-use: never cache or reuse it across connection attempts.
      ticket = await getTicket();
    } catch (error) {
      if (attemptGeneration !== generation) {
        return;
      }

      isAcquiringTicket = false;

      if (isTerminalTicketError(error)) {
        isRunning = false;
        setStatus('disconnected');
        handlers?.onError?.(
          normalizeApiError(error).code === 'FORBIDDEN'
            ? chatErrors().permission
            : chatErrors().unauthorized,
        );
        return;
      }

      setStatus('error');
      handlers?.onError?.(chatErrors().websocket);
      scheduleReconnect((normalizeApiError(error).retryAfterSeconds ?? 0) * 1000);
      return;
    }

    if (attemptGeneration !== generation) {
      return;
    }

    isAcquiringTicket = false;

    if (!canConnectNow()) {
      return;
    }

    let nextSocket: WebSocket;

    try {
      nextSocket = webSocketFactory(
        `${buildGroupChatWebSocketUrl(groupId)}?ticket=${encodeURIComponent(ticket)}`,
      );
    } catch {
      setStatus('error');
      handlers?.onError?.(chatErrors().websocket);
      scheduleReconnect();
      return;
    }

    socket = nextSocket;

    nextSocket.onopen = () => {
      if (attemptGeneration !== generation || socket !== nextSocket) {
        return;
      }

      const isReconnect = hasConnectedBefore;

      reconnectAttempts = 0;
      hasConnectedBefore = true;
      setStatus('connected');

      if (isReconnect) {
        handlers?.onReconnected?.();
      }
    };

    nextSocket.onmessage = (event) => {
      if (socket !== nextSocket) {
        return;
      }

      try {
        const payload: unknown = JSON.parse(String(event.data));

        if (isRecord(payload) && payload.type === 'error') {
          handlers?.onError?.(chatErrors().websocket);
          return;
        }

        const message = normalizeSocketMessage(payload, groupId);

        if (message) {
          handlers?.onMessage?.(message);
        }
      } catch {
        handlers?.onError?.(chatErrors().websocket);
      }
    };

    nextSocket.onerror = () => {
      // A close event always follows; reconnection is decided there.
      if (socket === nextSocket) {
        setStatus('error');
      }
    };

    nextSocket.onclose = (event) => {
      if (socket !== nextSocket) {
        return;
      }

      socket = null;

      if (!isRunning) {
        setStatus('disconnected');
        return;
      }

      if (isTerminalCloseCode(event?.code)) {
        isRunning = false;
        setStatus('disconnected');
        handlers?.onError?.(
          event.code === 4403 ? chatErrors().permission : chatErrors().unauthorized,
        );
        return;
      }

      scheduleReconnect();
    };
  }

  function resumeImmediately() {
    if (!isRunning || socket || isAcquiringTicket) {
      return;
    }

    reconnectAttempts = 0;
    clearReconnectTimer();
    void openConnection();
  }

  function pauseForBackground() {
    clearReconnectTimer();

    if (socket) {
      const closing = socket;

      socket = null;
      closing.close();
    }

    // Invalidate any ticket request still in flight.
    generation += 1;
    isAcquiringTicket = false;
    setStatus('disconnected');
  }

  function connect() {
    if (isRunning) {
      return;
    }

    isRunning = true;
    generation += 1;
    reconnectAttempts = 0;

    unsubscribeEnvironment =
      environment?.subscribe({
        onForeground: resumeImmediately,
        onBackground: pauseForBackground,
        onNetworkAvailable: resumeImmediately,
      }) ?? null;

    void openConnection();
  }

  function disconnect() {
    isRunning = false;
    generation += 1;
    isAcquiringTicket = false;
    clearReconnectTimer();
    unsubscribeEnvironment?.();
    unsubscribeEnvironment = null;

    if (socket) {
      const closing = socket;

      socket = null;
      closing.close();
    }

    setStatus('disconnected');
  }

  function send(message: string): boolean {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return false;
    }

    socket.send(JSON.stringify({ type: 'message', content: message }));

    return true;
  }

  return {
    connect,
    disconnect,
    send,
  };
}
