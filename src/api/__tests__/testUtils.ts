type MockResponseInit = {
  status?: number;
  body?: unknown;
  headers?: Record<string, string>;
};

/** Minimal fetch Response stand-in carrying exactly what the API client reads. */
export function mockResponse({ status = 200, body, headers = {} }: MockResponseInit = {}) {
  const text = body === undefined ? '' : JSON.stringify(body);

  return {
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get: (name: string) =>
        name.toLowerCase() === 'content-type' && text
          ? 'application/json'
          : (headers[name.toLowerCase()] ?? null),
    },
    text: async () => text,
  } as unknown as Response;
}

export function successEnvelope(data: unknown, status = 200) {
  return mockResponse({ status, body: { success: true, code: 'OK', message: 'ok', data } });
}

export function errorEnvelope(status: number, code: string, errors: unknown = {}, message = 'x') {
  return mockResponse({ status, body: { success: false, code, message, errors } });
}

type FetchMock = jest.Mock<Promise<Response>, [string, RequestInit?]>;

export function installFetchMock(): FetchMock {
  const fetchMock: FetchMock = jest.fn();

  (globalThis as { fetch: unknown }).fetch = fetchMock;

  return fetchMock;
}

export function headersOf(fetchMock: FetchMock, callIndex: number): Record<string, string> {
  return (fetchMock.mock.calls[callIndex]?.[1]?.headers ?? {}) as Record<string, string>;
}
