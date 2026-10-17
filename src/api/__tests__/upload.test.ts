jest.mock('react-native', () => ({
  Platform: { OS: 'android' },
  I18nManager: { isRTL: true, forceRTL: jest.fn(), allowRTL: jest.fn() },
}));
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { extra: { apiBaseUrl: 'https://api.example.com' } } },
}));

import { isUploadCancelled, uploadFormData } from '../upload';

class FakeXhr {
  static last: FakeXhr;

  upload: { onprogress: ((event: unknown) => void) | null } = { onprogress: null };
  headers: Record<string, string> = {};
  status = 0;
  responseText = '';
  timeout = 0;
  method = '';
  url = '';
  sentBody: unknown;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onabort: (() => void) | null = null;
  ontimeout: (() => void) | null = null;

  constructor() {
    FakeXhr.last = this;
  }

  open(method: string, url: string) {
    this.method = method;
    this.url = url;
  }

  setRequestHeader(name: string, value: string) {
    this.headers[name] = value;
  }

  getResponseHeader() {
    return 'application/json';
  }

  send(body: unknown) {
    this.sentBody = body;
  }

  abort() {
    this.onabort?.();
  }

  respond(status: number, body: unknown) {
    this.status = status;
    this.responseText = JSON.stringify(body);
    this.onload?.();
  }
}

beforeEach(() => {
  (globalThis as { XMLHttpRequest: unknown }).XMLHttpRequest = FakeXhr;
});

describe('uploadFormData', () => {
  it('posts multipart with auth and idempotency headers and reports progress', async () => {
    const onProgress = jest.fn();
    const form = new FormData();
    const handle = uploadFormData('/api/v1/groups/7/messages/', form, {
      authToken: 'jwt',
      idempotencyKey: 'key-1',
      onProgress,
    });
    const xhr = FakeXhr.last;

    xhr.upload.onprogress?.({ lengthComputable: true, loaded: 25, total: 100 });
    xhr.respond(201, { success: true, code: 'OK', message: 'ok', data: { id: 5 } });

    await expect(handle.promise).resolves.toEqual({ id: 5 });
    expect(onProgress).toHaveBeenCalledWith(0.25);
    expect(xhr.method).toBe('POST');
    expect(xhr.url).toBe('https://api.example.com/api/v1/groups/7/messages/');
    expect(xhr.headers.Authorization).toBe('Bearer jwt');
    expect(xhr.headers['Idempotency-Key']).toBe('key-1');
    expect(xhr.headers['Content-Type']).toBeUndefined();
    expect(xhr.sentBody).toBe(form);
  });

  it('rejects with a normalised error on a 4xx answer', async () => {
    const handle = uploadFormData('/api/v1/groups/7/messages/', new FormData(), {
      authToken: 'jwt',
    });

    FakeXhr.last.respond(400, {
      success: false,
      code: 'VALIDATION_ERROR',
      message: 'bad',
      errors: { attachment: ['bad file'] },
    });

    await expect(handle.promise).rejects.toMatchObject({ code: 'VALIDATION_ERROR', status: 400 });
  });

  it('maps a network failure and lets the caller tell a cancel apart', async () => {
    const failing = uploadFormData('/api/v1/groups/7/messages/', new FormData());

    FakeXhr.last.onerror?.();
    await expect(failing.promise).rejects.toMatchObject({ code: 'NETWORK_ERROR' });

    const cancelled = uploadFormData('/api/v1/groups/7/messages/', new FormData());

    cancelled.abort();
    await cancelled.promise.catch((error: unknown) => {
      expect(isUploadCancelled(error)).toBe(true);
    });
    expect.assertions(2);
  });
});
