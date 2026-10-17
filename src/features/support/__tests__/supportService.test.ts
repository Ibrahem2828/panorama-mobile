jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { extra: { apiBaseUrl: 'https://api.example.com' } } },
}));

import { ar } from '../../../i18n/locales/ar';
import { en } from '../../../i18n/locales/en';
import {
  buildCreateTicketBody,
  buildReplyBody,
  getSupportCategoryLabel,
  getSupportPriorityLabel,
  getSupportTicketStatusLabel,
} from '../services/supportService';

describe('support label mapping', () => {
  it('resolves a status through whichever catalog it is given', () => {
    expect(getSupportTicketStatusLabel('resolved', ar.support, ar.common.unknown)).toBe(
      ar.support.status.resolved,
    );
    expect(getSupportTicketStatusLabel('resolved', en.support, en.common.unknown)).toBe(
      en.support.status.resolved,
    );
  });

  it('falls back to the shared unknown label for a status the backend adds later', () => {
    expect(getSupportTicketStatusLabel('escalated', en.support, en.common.unknown)).toBe(
      en.common.unknown,
    );
  });

  /** A missing category and an unrecognised one are different states and read differently. */
  it('separates an absent category from an unrecognised one', () => {
    expect(getSupportCategoryLabel(undefined, en.support)).toBe(en.support.category.none);
    expect(getSupportCategoryLabel('billing', en.support)).toBe(en.support.category.custom);
  });

  it('separates an absent priority from an unrecognised one', () => {
    expect(getSupportPriorityLabel(undefined, ar.support)).toBe(ar.support.priority.none);
    expect(getSupportPriorityLabel('blocker', ar.support)).toBe(ar.support.priority.custom);
  });
});

describe('support contract statuses and priorities', () => {
  it('knows the statuses and priorities the backend really sends', () => {
    expect(getSupportTicketStatusLabel('waiting_user', ar.support, ar.common.unknown)).toBe(
      ar.support.status.waiting,
    );
    expect(getSupportPriorityLabel('normal', ar.support)).toBe(ar.support.priority.medium);
  });
});

describe('support request bodies', () => {
  const attachment = {
    uri: 'file:///cache/a.jpg',
    name: 'a.jpg',
    size: 10,
    mimeType: 'image/jpeg',
  };

  it('sends plain JSON, trimmed, when there is no attachment', () => {
    expect(
      buildCreateTicketBody({ category: 'technical', subject: ' s ', message: ' m ' }),
    ).toEqual({ category: 'technical', subject: 's', message: 'm' });
    expect(buildReplyBody({ message: ' hi ', attachment: null })).toEqual({ message: 'hi' });
  });

  it('switches to multipart with the attachment field', () => {
    const create = buildCreateTicketBody({
      category: 'files',
      subject: 's',
      message: 'm',
      attachment,
    }) as FormData;
    const reply = buildReplyBody({ message: 'hi', attachment }) as FormData;

    expect(create).toBeInstanceOf(FormData);
    expect(create.get('category')).toBe('files');
    expect(create.has('attachment')).toBe(true);
    expect(reply.get('message')).toBe('hi');
    expect(reply.has('attachment')).toBe(true);
  });
});
