import { env } from '../../../config/env';
import type { ChatConnectionStatus, ChatMessage, Id } from '../types';

export type ChatWebSocketHandlers = {
  onMessage?: (message: ChatMessage) => void;
  onStatusChange?: (status: ChatConnectionStatus) => void;
  onError?: (message: string) => void;
};

type ChatWebSocketClientOptions = {
  groupId: Id;
  authToken: string;
  handlers?: ChatWebSocketHandlers;
};

export type ChatWebSocketClient = {
  connect: () => void;
  disconnect: () => void;
  send?: (message: string) => void;
};

const WEBSOCKET_ERROR_MESSAGE = 'تم فقد الاتصال بالمحادثة. يمكنك تحديث الرسائل يدويا.';
const MAX_RECONNECT_ATTEMPTS = 3;
const BASE_RECONNECT_DELAY_MS = 1200;

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

function normalizeSocketMessage(payload: unknown, groupId: Id): ChatMessage | null {
  if (!isRecord(payload)) {
    return null;
  }

  const candidate = isRecord(payload.message)
    ? payload.message
    : isRecord(payload.data)
      ? payload.data
      : payload;
  const content =
    toText(candidate.content) ??
    toText(candidate.message) ??
    toText(candidate.body) ??
    toText(candidate.text);

  if (!content) {
    return null;
  }

  return {
    ...candidate,
    id: toId(candidate.id) ?? `${String(groupId)}-ws-${Date.now()}`,
    group: toId(candidate.group) ?? groupId,
    sender: toId(candidate.sender) ?? (isRecord(candidate.sender) ? candidate.sender : null),
    sender_name: toText(candidate.sender_name),
    content,
    created_at: toText(candidate.created_at) ?? new Date().toISOString(),
    updated_at: toText(candidate.updated_at),
  };
}

function buildWebSocketUrl(groupId: Id, authToken: string): string {
  return `${env.wsBaseUrl}/ws/v1/groups/${encodeURIComponent(
    String(groupId),
  )}/chat/?token=${encodeURIComponent(authToken)}`;
}

export function createChatWebSocketClient({
  groupId,
  authToken,
  handlers,
}: ChatWebSocketClientOptions): ChatWebSocketClient {
  let socket: WebSocket | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let reconnectAttempts = 0;
  let shouldReconnect = true;

  function setStatus(status: ChatConnectionStatus) {
    handlers?.onStatusChange?.(status);
  }

  function clearReconnectTimer() {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  }

  function scheduleReconnect() {
    if (!shouldReconnect || reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      setStatus('disconnected');
      return;
    }

    reconnectAttempts += 1;
    setStatus('reconnecting');
    clearReconnectTimer();

    reconnectTimer = setTimeout(() => {
      connect();
    }, BASE_RECONNECT_DELAY_MS * reconnectAttempts);
  }

  function connect() {
    if (socket && socket.readyState !== WebSocket.CLOSED) {
      return;
    }

    shouldReconnect = true;
    setStatus(reconnectAttempts > 0 ? 'reconnecting' : 'connecting');

    try {
      socket = new WebSocket(buildWebSocketUrl(groupId, authToken));
    } catch {
      setStatus('error');
      handlers?.onError?.(WEBSOCKET_ERROR_MESSAGE);
      scheduleReconnect();
      return;
    }

    socket.onopen = () => {
      reconnectAttempts = 0;
      setStatus('connected');
    };

    socket.onmessage = (event) => {
      try {
        const payload: unknown = JSON.parse(String(event.data));
        const message = normalizeSocketMessage(payload, groupId);

        if (message) {
          handlers?.onMessage?.(message);
        }
      } catch {
        handlers?.onError?.(WEBSOCKET_ERROR_MESSAGE);
      }
    };

    socket.onerror = () => {
      setStatus('error');
      handlers?.onError?.(WEBSOCKET_ERROR_MESSAGE);
    };

    socket.onclose = () => {
      if (shouldReconnect) {
        scheduleReconnect();
      } else {
        setStatus('disconnected');
      }
    };
  }

  function disconnect() {
    shouldReconnect = false;
    clearReconnectTimer();

    if (socket) {
      socket.close();
      socket = null;
    }

    setStatus('disconnected');
  }

  function send(message: string) {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return;
    }

    socket.send(JSON.stringify({ type: 'message', content: message }));
  }

  return {
    connect,
    disconnect,
    send,
  };
}
