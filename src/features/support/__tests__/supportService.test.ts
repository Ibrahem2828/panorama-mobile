jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { extra: { apiBaseUrl: 'https://api.example.com' } } },
}));

import { ar } from '../../../i18n/locales/ar';
import { en } from '../../../i18n/locales/en';
import {
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
