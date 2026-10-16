import { normalizeChatMessage } from '../messages';
import {
  createPending,
  findMatchingPending,
  isDefinitiveRejection,
  markFailed,
  markSending,
  removePending,
  setProgress,
} from '../pending';
import type { ChatMessage, PendingMessage } from '../../types';

const NOW = new Date('2026-01-01T10:00:00Z');
let counter = 0;
const newKey = () => `key-${(counter += 1)}`;

function make(content = 'hello', attachment = false): PendingMessage {
  return createPending({
    localId: `l-${content}`,
    idempotencyKey: 'key-0',
    content,
    attachment: attachment
      ? { uri: 'file:///a.jpg', name: 'a.jpg', mimeType: 'image/jpeg', size: 10 }
      : null,
    now: NOW,
  });
}

describe('pending state machine', () => {
  beforeEach(() => {
    counter = 0;
  });

  it('starts in sending with no error and zero progress', () => {
    expect(make()).toMatchObject({
      status: 'sending',
      error: null,
      progress: 0,
      keyBurned: false,
      createdAt: NOW.toISOString(),
    });
  });

  it('sending -> failed keeps the content and records the error', () => {
    const [failed] = markFailed([make()], 'l-hello', 'oops', false);

    expect(failed).toMatchObject({ status: 'failed', error: 'oops', content: 'hello' });
  });

  it('failed -> sending re-uses the idempotency key after a transient failure', () => {
    const failed = markFailed([make()], 'l-hello', 'net', false);
    const [retrying] = markSending(failed, 'l-hello', newKey);

    expect(retrying).toMatchObject({ status: 'sending', error: null, idempotencyKey: 'key-0' });
  });

  it('failed -> sending mints a new key after a definitive rejection', () => {
    const failed = markFailed([make()], 'l-hello', 'bad', true);
    const [retrying] = markSending(failed, 'l-hello', newKey);

    expect(retrying.idempotencyKey).toBe('key-1');
    expect(retrying.keyBurned).toBe(false);
  });

  it('only touches the targeted bubble', () => {
    const list = [make('a'), make('b')];
    const next = markFailed(list, 'l-a', 'x', false);

    expect(next[0].status).toBe('failed');
    expect(next[1]).toBe(list[1]);
  });

  it('clamps upload progress and ignores it once failed', () => {
    const list = [make('a', true)];

    expect(setProgress(list, 'l-a', 0.4)[0].progress).toBe(0.4);
    expect(setProgress(list, 'l-a', 7)[0].progress).toBe(1);
    expect(setProgress(markFailed(list, 'l-a', 'x', false), 'l-a', 0.9)[0].progress).toBe(0);
  });

  it('removePending drops one bubble and is referentially stable when absent', () => {
    const list = [make('a'), make('b')];

    expect(removePending(list, 'l-a').map((p) => p.localId)).toEqual(['l-b']);
    expect(removePending(list, 'nope')).toBe(list);
  });
});

describe('matching the server copy to its optimistic bubble', () => {
  const server = (content: string, senderId: number, hasAttachment = false): ChatMessage =>
    normalizeChatMessage({
      id: 1,
      content,
      sender_detail: { id: senderId, full_name: 'X' },
      has_attachment: hasAttachment,
    }) as ChatMessage;

  it('matches an own message with the same text', () => {
    const list = [make('hello')];

    expect(findMatchingPending(list, server('hello', 1), 1)?.localId).toBe('l-hello');
  });

  it('ignores other people, other text, and bubbles that already failed', () => {
    const list = [make('hello')];

    expect(findMatchingPending(list, server('hello', 2), 1)).toBeNull();
    expect(findMatchingPending(list, server('other', 1), 1)).toBeNull();
    expect(
      findMatchingPending(markFailed(list, 'l-hello', 'x', false), server('hello', 1), 1),
    ).toBeNull();
  });

  it('distinguishes attachment messages from text with the same caption', () => {
    const list = [make('look', true)];

    expect(findMatchingPending(list, server('look', 1, false), 1)).toBeNull();
    expect(findMatchingPending(list, server('look', 1, true), 1)).not.toBeNull();
  });
});

describe('isDefinitiveRejection', () => {
  it('treats 4xx answers as definitive, except throttling', () => {
    expect(isDefinitiveRejection(400, 'VALIDATION_ERROR')).toBe(true);
    expect(isDefinitiveRejection(403, 'FORBIDDEN')).toBe(true);
    expect(isDefinitiveRejection(429, 'RATE_LIMITED')).toBe(false);
    expect(isDefinitiveRejection(409, 'IDEMPOTENCY_IN_PROGRESS')).toBe(false);
  });

  it('keeps the key for network errors and 5xx', () => {
    expect(isDefinitiveRejection(undefined, 'NETWORK_ERROR')).toBe(false);
    expect(isDefinitiveRejection(503, 'SERVER_ERROR')).toBe(false);
  });
});
