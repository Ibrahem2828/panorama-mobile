import {
  compareMessages,
  getChatSenderName,
  isOwnChatMessage,
  mergeChatMessages,
  normalizeChatMessage,
  parseDeletedFrame,
  pruneMissingMessages,
  removeChatMessageById,
} from '../messages';
import type { ChatMessage } from '../../types';

function msg(id: number, createdAt = `2026-01-01T00:00:${String(id).padStart(2, '0')}Z`) {
  return normalizeChatMessage({ id, content: `m${id}`, created_at: createdAt }) as ChatMessage;
}

describe('normalizeChatMessage', () => {
  it('reads the backend serializer shape', () => {
    expect(
      normalizeChatMessage({
        id: 5,
        group: 7,
        sender: 3,
        sender_detail: { id: 3, full_name: 'Sara Ali' },
        content: 'hi',
        message_type: 'text',
        has_attachment: false,
        reply_to: null,
        created_at: '2026-01-01T00:00:05Z',
      }),
    ).toEqual({
      id: 5,
      group: 7,
      sender: 3,
      sender_detail: { id: 3, full_name: 'Sara Ali' },
      content: 'hi',
      message_type: 'text',
      has_attachment: false,
      reply_to: null,
      created_at: '2026-01-01T00:00:05Z',
    });
  });

  it('unwraps socket envelopes and numeric-string ids', () => {
    expect(normalizeChatMessage({ type: 'message', data: { id: '9', content: 'x' } })?.id).toBe(9);
    expect(normalizeChatMessage({ message: { id: 10, content: 'y' } })?.id).toBe(10);
  });

  it('never invents an id', () => {
    expect(normalizeChatMessage({ content: 'no id' })).toBeNull();
    expect(normalizeChatMessage({ id: 'abc', content: 'x' })).toBeNull();
    expect(normalizeChatMessage(null)).toBeNull();
  });

  it('drops deleted and empty messages but keeps attachment-only ones', () => {
    expect(normalizeChatMessage({ id: 1, content: 'x', is_deleted: true })).toBeNull();
    expect(normalizeChatMessage({ id: 2, content: '   ' })).toBeNull();
    expect(
      normalizeChatMessage({ id: 3, content: '', has_attachment: true, message_type: 'image' }),
    ).toMatchObject({ id: 3, has_attachment: true, message_type: 'image' });
  });

  it('falls back to text for unknown message types and to the fallback group', () => {
    expect(normalizeChatMessage({ id: 1, content: 'x', message_type: 'weird' }, 4)).toMatchObject({
      message_type: 'text',
      group: 4,
    });
  });
});

describe('mergeChatMessages', () => {
  it('de-duplicates the socket and REST copies of one message (incoming wins)', () => {
    const fromSocket = msg(5);
    const fromRest = { ...msg(5), content: 'edited' };

    const merged = mergeChatMessages([fromSocket], [fromRest]);

    expect(merged).toHaveLength(1);
    expect(merged[0].content).toBe('edited');
  });

  it('after a reconnect the catch-up fills the gap in order', () => {
    const merged = mergeChatMessages([msg(1), msg(2)], [msg(2), msg(3), msg(4)]);

    expect(merged.map((m) => m.id)).toEqual([1, 2, 3, 4]);
  });

  it('prepending an older page keeps chronological order', () => {
    const merged = mergeChatMessages([msg(5), msg(6)], [msg(3), msg(4), msg(5)]);

    expect(merged.map((m) => m.id)).toEqual([3, 4, 5, 6]);
  });

  it('orders by created_at and breaks ties by id', () => {
    const same = '2026-01-01T00:00:01Z';
    const merged = mergeChatMessages(
      [msg(9, same), msg(2, same), msg(1, '2026-01-01T00:00:02Z')],
      [],
    );

    expect(merged.map((m) => m.id)).toEqual([2, 9, 1]);
  });

  it('never resurrects ids deleted live', () => {
    expect(mergeChatMessages([msg(1)], [msg(2), msg(3)], new Set([2])).map((m) => m.id)).toEqual([
      1, 3,
    ]);
  });

  it('does not mutate its inputs', () => {
    const current = [msg(2)];

    mergeChatMessages(current, [msg(1)]);

    expect(current).toHaveLength(1);
  });
});

describe('deletions', () => {
  it('removeChatMessageById returns the same array when the id is absent', () => {
    const list = [msg(1)];

    expect(removeChatMessageById(list, 9)).toBe(list);
    expect(removeChatMessageById(list, 1)).toEqual([]);
  });

  it('parses message.deleted frames', () => {
    expect(parseDeletedFrame({ type: 'message.deleted', data: { id: 4, group_id: 7 } })).toBe(4);
    expect(parseDeletedFrame({ id: '6' })).toBe(6);
    expect(parseDeletedFrame({ data: {} })).toBeNull();
  });

  it('pruneMissing drops ids inside the fresh page range that the server no longer returns', () => {
    const current = [msg(1), msg(5), msg(6), msg(7)];

    expect(pruneMissingMessages(current, [msg(5), msg(7)], false).map((m) => m.id)).toEqual([
      1, 5, 7,
    ]);
  });

  it('pruneMissing keeps everything when an incomplete page is empty', () => {
    const current = [msg(1)];

    expect(pruneMissingMessages(current, [], false)).toBe(current);
    expect(pruneMissingMessages(current, [], true)).toEqual([]);
  });
});

describe('helpers', () => {
  it('compareMessages is a stable oldest-first order', () => {
    expect([msg(3), msg(1), msg(2)].sort(compareMessages).map((m) => m.id)).toEqual([1, 2, 3]);
  });

  it('identifies own messages by sender id, string or number', () => {
    const message = normalizeChatMessage({
      id: 1,
      content: 'x',
      sender_detail: { id: 3, full_name: 'A' },
    }) as ChatMessage;

    expect(isOwnChatMessage(message, 3)).toBe(true);
    expect(isOwnChatMessage(message, '3')).toBe(true);
    expect(isOwnChatMessage(message, 4)).toBe(false);
    expect(isOwnChatMessage(message, null)).toBe(false);
  });

  it('falls back when the sender has no name', () => {
    expect(getChatSenderName(msg(1), 'مستخدم')).toBe('مستخدم');
  });
});
