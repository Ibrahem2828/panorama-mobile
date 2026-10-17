jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { extra: { apiBaseUrl: 'https://api.example.com' } } },
}));

import { containsArabic, createApiError, normalizeHttpError, resolveUserMessage } from '../errors';

describe('backend error code mapping', () => {
  it('maps 503 MAINTENANCE_MODE and keeps the maintenance details', () => {
    const error = normalizeHttpError({
      status: 503,
      responseBody: {
        success: false,
        code: 'MAINTENANCE_MODE',
        message: 'Back soon',
        errors: { title_ar: 'صيانة', estimated_end_at: '2026-01-01T10:00:00Z' },
      },
    });

    expect(error.code).toBe('MAINTENANCE_MODE');
    expect(error.status).toBe(503);
    expect(error.details).toMatchObject({ title_ar: 'صيانة' });
    // Lifecycle details are not form field errors.
    expect(error.fieldErrors).toBeUndefined();
  });

  it('maps 426 APP_UPDATE_REQUIRED and exposes the store url', () => {
    const error = normalizeHttpError({
      status: 426,
      responseBody: {
        success: false,
        code: 'APP_UPDATE_REQUIRED',
        message: 'Update',
        errors: { store_url: 'https://play.google.com/store/apps/details?id=x' },
      },
    });

    expect(error.code).toBe('APP_UPDATE_REQUIRED');
    expect(error.details?.store_url).toBe('https://play.google.com/store/apps/details?id=x');
  });

  it('keeps an unrelated 503 as a generic server error', () => {
    expect(
      normalizeHttpError({
        status: 503,
        responseBody: { success: false, code: 'SERVICE_DEPENDENCY_UNAVAILABLE', errors: {} },
      }).code,
    ).toBe('SERVER_ERROR');
  });

  it('only trusts MAINTENANCE_MODE on its documented status', () => {
    expect(
      normalizeHttpError({ status: 500, responseBody: { code: 'MAINTENANCE_MODE' } }).code,
    ).toBe('SERVER_ERROR');
  });

  it('distinguishes the 409 idempotency variants from a plain conflict', () => {
    const reused = normalizeHttpError({
      status: 409,
      responseBody: { success: false, code: 'IDEMPOTENCY_KEY_REUSED', errors: {} },
    });
    const inProgress = normalizeHttpError({
      status: 409,
      responseBody: { success: false, code: 'IDEMPOTENCY_IN_PROGRESS', errors: {} },
    });
    const conflict = normalizeHttpError({
      status: 409,
      responseBody: { success: false, code: 'CONFLICT', errors: {} },
    });

    expect(reused.code).toBe('IDEMPOTENCY_KEY_REUSED');
    expect(inProgress.code).toBe('IDEMPOTENCY_IN_PROGRESS');
    expect(conflict.code).toBe('CONFLICT');
  });

  it('still maps the classic statuses', () => {
    expect(normalizeHttpError({ status: 401, responseBody: {} }).code).toBe('UNAUTHORIZED');
    expect(
      normalizeHttpError({ status: 429, responseBody: { retry_after_seconds: 7 } }),
    ).toMatchObject({
      code: 'RATE_LIMITED',
      retryAfterSeconds: 7,
    });
  });
});

describe('user message resolution', () => {
  it('replaces an English backend message with the localized default for the code', () => {
    const error = normalizeHttpError({
      status: 400,
      responseBody: { success: false, message: 'Validation error', errors: { email: ['bad'] } },
    });

    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.message).not.toBe('Validation error');
    expect(containsArabic(error.message)).toBe(true);
    expect(error.technicalMessage).toBe('Validation error');
    expect(error.fieldErrors).toEqual({ email: ['bad'] });
  });

  it('keeps a backend message that is already Arabic', () => {
    const error = normalizeHttpError({
      status: 404,
      responseBody: { success: false, message: 'المجموعة غير موجودة' },
    });

    expect(error.message).toBe('المجموعة غير موجودة');
  });

  it('uses the default when there is no message and never an English one', () => {
    expect(resolveUserMessage('SERVER_ERROR', undefined)).toBe(
      resolveUserMessage('SERVER_ERROR', 'Internal'),
    );
    expect(containsArabic(resolveUserMessage('NETWORK_ERROR', 'Network down'))).toBe(true);
  });

  it('applies the same rule to errors created locally', () => {
    expect(createApiError({ status: 500, message: 'Oops' }).message).toBe(
      resolveUserMessage('SERVER_ERROR'),
    );
    expect(createApiError({ status: 500, message: 'خطأ ما' }).message).toBe('خطأ ما');
  });

  it('detects Arabic characters', () => {
    expect(containsArabic('Hello')).toBe(false);
    expect(containsArabic('Hello مرحبا')).toBe(true);
    expect(containsArabic(undefined)).toBe(false);
  });
});
