import { normalizeChatMessage } from '../messages';
import { createPending } from '../pending';
import { GROUP_GAP_MS, buildChatItems, countNewIncoming, dayKey, getDayLabel } from '../timeline';
import type { ChatMessage } from '../../types';

function msg(
  id: number,
  senderId: number,
  createdAt: string,
  extra: Record<string, unknown> = {},
): ChatMessage {
  return normalizeChatMessage({
    id,
    content: `m${id}`,
    sender_detail: { id: senderId, full_name: `U${senderId}` },
    created_at: createdAt,
    ...extra,
  }) as ChatMessage;
}

// Local-time ISO strings keep the day boundaries independent of the machine's timezone.
const at = (day: number, hour: number, minute = 0) =>
  new Date(2026, 0, day, hour, minute).toISOString();

describe('buildChatItems', () => {
  it('returns newest first, with the day separator after (above) the first message of a day', () => {
    const items = buildChatItems(
      [msg(1, 2, at(1, 9)), msg(2, 2, at(1, 9, 1)), msg(3, 2, at(2, 9))],
      [],
      1,
    );

    expect(items.map((item) => item.kind)).toEqual(['message', 'day', 'message', 'message', 'day']);
    expect(items.map((item) => item.key)).toEqual([
      'm-3',
      `d-${dayKey(new Date(2026, 0, 2))}`,
      'm-2',
      'm-1',
      `d-${dayKey(new Date(2026, 0, 1))}`,
    ]);
  });

  it('groups consecutive messages of one sender and starts a new group on sender change', () => {
    const items = buildChatItems(
      [msg(1, 2, at(1, 9)), msg(2, 2, at(1, 9, 1)), msg(3, 3, at(1, 9, 2)), msg(4, 2, at(1, 9, 3))],
      [],
      1,
    );
    const starts = items
      .filter((item) => item.kind === 'message')
      .map((item) => (item.kind === 'message' ? [item.message.id, item.groupStart] : []));

    expect(starts).toEqual([
      [4, true],
      [3, true],
      [2, false],
      [1, true],
    ]);
  });

  it('starts a new group after a long silence from the same sender', () => {
    const items = buildChatItems(
      [
        msg(1, 2, at(1, 9)),
        msg(2, 2, new Date(new Date(at(1, 9)).getTime() + GROUP_GAP_MS + 1000).toISOString()),
      ],
      [],
      1,
    );
    const second = items.find((item) => item.kind === 'message' && item.message.id === 2);

    expect(second?.kind === 'message' && second.groupStart).toBe(true);
  });

  it('marks own messages and lets system messages break groups', () => {
    const items = buildChatItems(
      [
        msg(1, 1, at(1, 9)),
        msg(2, 2, at(1, 9, 1), { message_type: 'system' }),
        msg(3, 1, at(1, 9, 2)),
      ],
      [],
      1,
    );
    const messages = items.filter((item) => item.kind === 'message');

    expect(messages.every((item) => item.kind === 'message' && item.own)).toBe(true);
    expect(items.some((item) => item.kind === 'system')).toBe(true);
    expect(messages[0].kind === 'message' && messages[0].groupStart).toBe(true);
  });

  it('puts pending bubbles at the newest end, grouped with own messages', () => {
    const pending = createPending({
      localId: 'p1',
      idempotencyKey: 'k',
      content: 'sending',
      now: new Date(2026, 0, 1, 9, 5),
    });
    const items = buildChatItems([msg(1, 1, at(1, 9))], [pending], 1);

    expect(items[0]).toMatchObject({ kind: 'pending', key: 'p-p1', groupStart: false });
  });

  it('is empty for no input and gives every row a unique key', () => {
    expect(buildChatItems([], [], 1)).toEqual([]);

    const items = buildChatItems(
      [msg(1, 2, at(1, 9)), msg(2, 2, at(2, 9)), msg(3, 2, at(3, 9))],
      [],
      1,
    );

    expect(new Set(items.map((item) => item.key)).size).toBe(items.length);
  });
});

describe('countNewIncoming', () => {
  const list = [
    msg(1, 2, at(1, 9)),
    msg(2, 1, at(1, 9, 1)),
    msg(3, 2, at(1, 9, 2)),
    msg(4, 3, at(1, 9, 3)),
  ];

  it('counts only newer messages from other people', () => {
    expect(countNewIncoming(list, 1, 1)).toBe(2);
  });

  it('is zero before the first load and when nothing is newer', () => {
    expect(countNewIncoming(list, null, 1)).toBe(0);
    expect(countNewIncoming(list, 4, 1)).toBe(0);
  });
});

describe('getDayLabel', () => {
  const strings = { today: 'اليوم', yesterday: 'أمس' };
  const format = () => 'full date';
  const now = new Date(2026, 0, 10, 15);

  it('uses today / yesterday and a full date otherwise', () => {
    expect(getDayLabel(at(10, 1), now, strings, format)).toBe('اليوم');
    expect(getDayLabel(at(9, 23), now, strings, format)).toBe('أمس');
    expect(getDayLabel(at(1, 12), now, strings, format)).toBe('full date');
  });

  it('is empty for an invalid date', () => {
    expect(getDayLabel('nope', now, strings, format)).toBe('');
  });
});
