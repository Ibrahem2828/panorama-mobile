jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { extra: { apiBaseUrl: 'https://api.example.com' } } },
}));

import { ApiClientError, createApiError } from '../../../api';
import {
  isDeletionRequested,
  isDeletionUnavailable,
  normalizeDeletionRecord,
} from '../services/accountDeletion';

const base = {
  requested_at: '2026-05-01T00:00:00Z',
  scheduled_for: '2026-05-15T00:00:00Z',
  cancelled_at: null,
  completed_at: null,
  reason: '',
};

describe('normalizeDeletionRecord', () => {
  it('keeps a record that has a status and drops the empty answer', () => {
    expect(normalizeDeletionRecord({ ...base, status: 'requested' })).toMatchObject({
      status: 'requested',
    });
    expect(normalizeDeletionRecord({})).toBeNull();
    expect(normalizeDeletionRecord(null)).toBeNull();
    expect(normalizeDeletionRecord('x')).toBeNull();
  });
});

describe('isDeletionRequested', () => {
  it('uses the status the backend really sends', () => {
    expect(isDeletionRequested({ ...base, status: 'requested' })).toBe(true);
    expect(isDeletionRequested({ ...base, status: 'pending' })).toBe(false);
    expect(isDeletionRequested({ ...base, status: 'cancelled' })).toBe(false);
    expect(isDeletionRequested(null)).toBe(false);
  });
});

describe('isDeletionUnavailable', () => {
  const failure = (status: number) =>
    new ApiClientError(createApiError({ code: 'UNKNOWN_ERROR', status }));

  it('treats a switched-off feature as unavailable but not ordinary failures', () => {
    expect(isDeletionUnavailable(failure(403))).toBe(true);
    expect(isDeletionUnavailable(failure(404))).toBe(true);
    expect(isDeletionUnavailable(failure(503))).toBe(true);
    expect(isDeletionUnavailable(failure(500))).toBe(false);
    expect(isDeletionUnavailable(new TypeError('offline'))).toBe(false);
  });
});
