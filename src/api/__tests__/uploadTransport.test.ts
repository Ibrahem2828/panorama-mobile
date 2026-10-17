import { uploadWithProgress } from '../uploadTransport';

type Listener = () => void;

class FakeXhr {
  static last: FakeXhr;

  status = 0;
  responseText = '';
  upload: { onprogress: ((event: unknown) => void) | null } = { onprogress: null };
  onload: Listener | null = null;
  onerror: Listener | null = null;
  ontimeout: Listener | null = null;
  onabort: Listener | null = null;
  requestHeaders: Record<string, string> = {};
  aborted = false;
  sent: unknown = null;

  constructor() {
    FakeXhr.last = this;
  }

  open() {}

  setRequestHeader(name: string, value: string) {
    this.requestHeaders[name] = value;
  }

  send(body: unknown) {
    this.sent = body;
  }

  abort() {
    this.aborted = true;
  }

  getAllResponseHeaders() {
    return 'Content-Type: application/json\r\nX-Request-Id: abc\r\n';
  }
}

const originalXhr = (globalThis as { XMLHttpRequest?: unknown }).XMLHttpRequest;

beforeEach(() => {
  (globalThis as { XMLHttpRequest?: unknown }).XMLHttpRequest = FakeXhr;
});

afterAll(() => {
  (globalThis as { XMLHttpRequest?: unknown }).XMLHttpRequest = originalXhr;
});

function baseInit(overrides: Partial<Parameters<typeof uploadWithProgress>[1]> = {}) {
  return {
    method: 'POST',
    headers: { Authorization: 'Bearer x', 'Content-Type': 'multipart/form-data' },
    body: new FormData(),
    onUploadProgress: jest.fn(),
    ...overrides,
  };
}

describe('uploadWithProgress', () => {
  it('reports progress, skips the content type and resolves a standard Response', async () => {
    const init = baseInit();
    const pending = uploadWithProgress('https://api.example.com/x', init);
    const xhr = FakeXhr.last;

    xhr.upload.onprogress?.({ lengthComputable: true, loaded: 10, total: 40 });
    xhr.upload.onprogress?.({ lengthComputable: false, loaded: 20, total: 0 });
    xhr.status = 201;
    xhr.responseText = '{"ok":true}';
    xhr.onload?.();

    const response = await pending;

    expect(init.onUploadProgress).toHaveBeenCalledTimes(1);
    expect(init.onUploadProgress).toHaveBeenCalledWith({ loaded: 10, total: 40 });
    expect(xhr.requestHeaders).toEqual({ Authorization: 'Bearer x' });
    expect(response.status).toBe(201);
    expect(response.headers.get('content-type')).toBe('application/json');
    expect(await response.json()).toEqual({ ok: true });
  });

  it('handles an empty 204 answer', async () => {
    const pending = uploadWithProgress('https://api.example.com/x', baseInit());

    FakeXhr.last.status = 204;
    FakeXhr.last.onload?.();

    expect((await pending).status).toBe(204);
  });

  it('rejects with an AbortError when the caller cancels', async () => {
    const controller = new AbortController();
    const pending = uploadWithProgress(
      'https://api.example.com/x',
      baseInit({ signal: controller.signal }),
    );

    controller.abort();

    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    expect(FakeXhr.last.aborted).toBe(true);
  });

  it('rejects immediately when the signal is already aborted', async () => {
    const controller = new AbortController();

    controller.abort();

    await expect(
      uploadWithProgress('https://api.example.com/x', baseInit({ signal: controller.signal })),
    ).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('maps a network failure to a TypeError the API client understands', async () => {
    const pending = uploadWithProgress('https://api.example.com/x', baseInit());

    FakeXhr.last.onerror?.();

    await expect(pending).rejects.toBeInstanceOf(TypeError);
  });
});
