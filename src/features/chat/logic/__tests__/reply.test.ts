import { buildMessageFormData } from '../attachments';
import { normalizeChatMessage } from '../messages';
import { createPending, markFailed, markSending } from '../pending';
import {
  REPLY_PREVIEW_MAX,
  canReplyToMessage,
  findMessageItemIndex,
  isHorizontalSwipe,
  isReplyTargetAvailable,
  quotedFromMessage,
  quotedFromPending,
  replyTargetFromMessage,
  shouldTriggerReply,
} from '../reply';
import { buildChatItems } from '../timeline';
import type { ChatMessage } from '../../types';

const labels = { unnamedSender: 'عضو', image: 'صورة', file: 'ملف' };

function msg(extra: Record<string, unknown> = {}): ChatMessage {
  return normalizeChatMessage({
    id: 10,
    sender_detail: { id: 3, full_name: 'سارة', is_staff: false },
    content: 'مرحبا بكم',
    message_type: 'text',
    created_at: '2026-01-01T00:00:10Z',
    ...extra,
  }) as ChatMessage;
}

describe('replyTargetFromMessage', () => {
  it('uses the author and the text, collapsed and truncated like the server preview', () => {
    const target = replyTargetFromMessage(msg({ content: 'سطر أول\n\n  سطر ثان' }), labels);

    expect(target).toEqual({ id: 10, senderName: 'سارة', preview: 'سطر أول سطر ثان' });
    expect(
      replyTargetFromMessage(msg({ content: 'ا'.repeat(200) }), labels).preview.length,
    ).toBeLessThanOrEqual(REPLY_PREVIEW_MAX + 3);
  });

  it('names attachments when there is no text and falls back to a generic author', () => {
    const image = replyTargetFromMessage(
      msg({ content: '', message_type: 'image', has_attachment: true, sender_detail: null }),
      labels,
    );
    const file = replyTargetFromMessage(
      msg({ content: '', message_type: 'file', has_attachment: true }),
      labels,
    );

    expect(image).toMatchObject({ preview: 'صورة', senderName: 'عضو' });
    expect(file.preview).toBe('ملف');
  });

  it('does not allow replying to system messages', () => {
    expect(canReplyToMessage(msg())).toBe(true);
    expect(canReplyToMessage(msg({ message_type: 'system' }))).toBe(false);
  });
});

describe('quotes inside bubbles', () => {
  it('reads the server reply detail', () => {
    const quote = quotedFromMessage(
      msg({
        id: 11,
        reply_to: 10,
        reply_to_detail: { id: 10, is_deleted: false, sender_name: 'سارة', preview: 'مرحبا' },
      }),
      labels,
    );

    expect(quote).toEqual({ id: 10, deleted: false, senderName: 'سارة', preview: 'مرحبا' });
  });

  it('marks a quote whose original was deleted, and returns null when there is no reply', () => {
    expect(
      quotedFromMessage(
        msg({ reply_to: 10, reply_to_detail: { id: 10, is_deleted: true } }),
        labels,
      ),
    ).toMatchObject({ id: 10, deleted: true });
    expect(quotedFromMessage(msg({ reply_to: 10 }), labels)).toMatchObject({ deleted: true });
    expect(quotedFromMessage(msg(), labels)).toBeNull();
  });

  it('shows the quote on an optimistic bubble from the stored target', () => {
    const pending = createPending({
      localId: 'l',
      idempotencyKey: 'k',
      content: 'ok',
      replyTo: { id: 10, senderName: 'سارة', preview: 'مرحبا' },
      now: new Date('2026-01-01T10:00:00Z'),
    });

    expect(quotedFromPending(pending)).toEqual({
      id: 10,
      deleted: false,
      senderName: 'سارة',
      preview: 'مرحبا',
    });
  });
});

describe('pending replies', () => {
  const target = { id: 10, senderName: 'سارة', preview: 'مرحبا' };

  it('keep their reply target through failure and retry', () => {
    let list = [
      createPending({
        localId: 'l',
        idempotencyKey: 'k',
        content: 'ok',
        replyTo: target,
        now: new Date('2026-01-01T10:00:00Z'),
      }),
    ];

    list = markFailed(list, 'l', 'x', true);
    list = markSending(list, 'l', () => 'new-key');

    expect(list[0]?.replyTo).toEqual(target);
    expect(list[0]?.idempotencyKey).toBe('new-key');
  });

  it('default to no reply', () => {
    const pending = createPending({
      localId: 'l',
      idempotencyKey: 'k',
      content: 'ok',
      now: new Date(),
    });

    expect(pending.replyTo).toBeNull();
  });
});

describe('sending a reply', () => {
  it('adds reply_to to the multipart body only when replying', () => {
    const attachment = {
      uri: 'file:///a.jpg',
      name: 'a.jpg',
      mimeType: 'image/jpeg',
      size: 10,
      kind: 'image' as const,
    };
    const withReply = buildMessageFormData({ content: 'x', attachment, replyToId: 10 });
    const without = buildMessageFormData({ content: 'x', attachment });

    expect(withReply.get('reply_to')).toBe('10');
    expect(without.get('reply_to')).toBeNull();
  });
});

describe('jumping to the original and swipe gestures', () => {
  it('finds the list row of a loaded message and reports -1 for an unloaded one', () => {
    const items = buildChatItems([msg({ id: 1 }), msg({ id: 2 }), msg({ id: 3 })], [], 99, {});

    expect(findMessageItemIndex(items, 2)).toBeGreaterThanOrEqual(0);
    expect(findMessageItemIndex(items, 999)).toBe(-1);
  });

  it('drops a pending reply when its target is no longer in the room', () => {
    const target = { id: 2, senderName: 'x', preview: '' };

    expect(isReplyTargetAvailable([msg({ id: 1 }), msg({ id: 2 })], target)).toBe(true);
    expect(isReplyTargetAvailable([msg({ id: 1 })], target)).toBe(false);
    expect(isReplyTargetAvailable([], null)).toBe(true);
  });

  it('treats only deliberate horizontal drags as swipes and triggers past the distance', () => {
    expect(isHorizontalSwipe(30, 4)).toBe(true);
    expect(isHorizontalSwipe(-30, 4)).toBe(true);
    expect(isHorizontalSwipe(30, 20)).toBe(false);
    expect(isHorizontalSwipe(5, 0)).toBe(false);
    expect(shouldTriggerReply(60)).toBe(true);
    expect(shouldTriggerReply(-60)).toBe(true);
    expect(shouldTriggerReply(20)).toBe(false);
  });
});
