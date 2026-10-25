import {
  effectiveDeliveryState,
  normalizeChatMessage,
  parseReactionFrame,
  parseReceiptFrame,
  reactionList,
} from '../messages';
import { buildChatItems } from '../timeline';
import type { ChatMessage } from '../../types';

function own(id: number, state?: 'sent' | 'delivered' | 'read'): ChatMessage {
  return normalizeChatMessage({
    id,
    sender_detail: { id: 1, full_name: 'Me' },
    content: `m${id}`,
    created_at: `2026-01-01T00:00:${String(id).padStart(2, '0')}Z`,
    delivery: state ? { state, delivered_count: 0, read_count: 0, recipients: 3 } : undefined,
  }) as ChatMessage;
}

describe('effectiveDeliveryState', () => {
  it('keeps the server answer when no live cursor is further along', () => {
    expect(effectiveDeliveryState(own(5, 'delivered'), {}, 1)).toBe('delivered');
    expect(effectiveDeliveryState(own(5), {}, 1)).toBe('sent');
  });

  it('upgrades from the live cursors of other members', () => {
    expect(effectiveDeliveryState(own(5, 'sent'), { 2: { delivered: 5, read: 0 } }, 1)).toBe(
      'delivered',
    );
    expect(effectiveDeliveryState(own(5, 'sent'), { 2: { delivered: 9, read: 5 } }, 1)).toBe(
      'read',
    );
  });

  it('never goes back and ignores the member’s own cursor', () => {
    expect(effectiveDeliveryState(own(5, 'read'), {}, 1)).toBe('read');
    expect(effectiveDeliveryState(own(5, 'sent'), { 1: { delivered: 9, read: 9 } }, 1)).toBe(
      'sent',
    );
    expect(effectiveDeliveryState(own(5, 'sent'), { 2: { delivered: 4, read: 4 } }, 1)).toBe(
      'sent',
    );
  });
});

describe('buildChatItems ticks', () => {
  it('gives only the member’s own messages a tick state', () => {
    const other = normalizeChatMessage({
      id: 6,
      sender_detail: { id: 2, full_name: 'Other' },
      content: 'hi',
    }) as ChatMessage;
    const items = buildChatItems([own(5, 'sent'), other], [], 1, { 2: { delivered: 5, read: 5 } });
    const messages = items.filter((item) => item.kind === 'message');

    expect(messages.map((item) => (item.kind === 'message' ? item.delivery : 'x'))).toEqual([
      null,
      'read',
    ]);
  });
});

describe('socket frames', () => {
  it('parses receipts and rejects malformed ones', () => {
    expect(
      parseReceiptFrame({
        type: 'receipt',
        data: { user_id: 2, delivered_up_to: 7, read_up_to: 5 },
      }),
    ).toEqual({ user_id: 2, delivered_up_to: 7, read_up_to: 5 });
    expect(parseReceiptFrame({ type: 'receipt', data: {} })).toBeNull();
    expect(parseReceiptFrame(null)).toBeNull();
  });

  it('parses reactions, dropping zero counts', () => {
    expect(
      parseReactionFrame({
        type: 'reaction',
        data: { message_id: 3, user_id: 2, emoji: '👍', counts: { '👍': 2, '❤️': 0 } },
      }),
    ).toEqual({ message_id: 3, user_id: 2, emoji: '👍', counts: { '👍': 2 } });
    expect(parseReactionFrame({ data: { user_id: 2 } })).toBeNull();
  });

  it('lists reactions most used first', () => {
    expect(reactionList({ '👍': 1, '❤️': 3 })).toEqual([
      { emoji: '❤️', count: 3 },
      { emoji: '👍', count: 1 },
    ]);
  });
});
