jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { extra: { apiBaseUrl: 'https://api.example.com' } } },
}));

import { createApiError } from '../errors';
import { classifyApiError } from '../errorKind';

describe('classifyApiError', () => {
  it('maps a failed fetch (TypeError) to weak when the device looks online and offline when it is not', () => {
    const failure = new TypeError('Network request failed');

    expect(classifyApiError(failure)).toBe('weak');
    expect(classifyApiError(failure, { deviceOnline: true })).toBe('weak');
    expect(classifyApiError(failure, { deviceOnline: false })).toBe('offline');
  });

  it('maps aborted and gateway-timeout requests to timeout', () => {
    expect(classifyApiError({ name: 'AbortError', message: 'aborted' })).toBe('timeout');
    expect(classifyApiError(createApiError({ status: 504 }))).toBe('timeout');
    expect(classifyApiError(createApiError({ status: 408 }))).toBe('timeout');
    expect(classifyApiError(createApiError({ code: 'TIMEOUT' }), { deviceOnline: false })).toBe(
      'offline',
    );
  });

  it('maps 404 and 410 to notFound', () => {
    expect(classifyApiError(createApiError({ status: 404 }))).toBe('notFound');
    expect(classifyApiError(createApiError({ status: 410 }))).toBe('notFound');
    expect(classifyApiError(createApiError({ code: 'NOT_FOUND' }))).toBe('notFound');
  });

  it('maps 5xx and maintenance to server', () => {
    expect(classifyApiError(createApiError({ status: 500 }))).toBe('server');
    expect(classifyApiError(createApiError({ status: 502 }))).toBe('server');
    expect(classifyApiError(createApiError({ status: 503 }))).toBe('server');
    expect(classifyApiError(createApiError({ code: 'MAINTENANCE_MODE', status: 503 }))).toBe(
      'server',
    );
  });

  it('falls back to generic for everything else', () => {
    expect(classifyApiError(createApiError({ status: 400 }))).toBe('generic');
    expect(classifyApiError(createApiError({ status: 403 }))).toBe('generic');
    expect(classifyApiError('boom')).toBe('generic');
    expect(classifyApiError(undefined)).toBe('generic');
  });
});
