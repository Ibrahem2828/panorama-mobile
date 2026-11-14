import {
  DownloadError,
  runPackageDownload,
  type DownloadDeps,
  type PackageResponse,
} from '../downloadCore';

const PACKAGE = Uint8Array.from({ length: 1000 }, (_, i) => i % 251);

type Script = {
  /** Called per request: returns the response for the requested range. */
  respond: (headers: Record<string, string>, call: number) => PackageResponse | Error;
};

function makeBody(
  bytes: Uint8Array,
  pieces: number,
  failAfterPieces?: number,
): AsyncIterable<Uint8Array> {
  const size = Math.ceil(bytes.length / pieces);

  return {
    async *[Symbol.asyncIterator]() {
      let emitted = 0;

      for (let offset = 0; offset < bytes.length; offset += size) {
        if (failAfterPieces !== undefined && emitted >= failAfterPieces) {
          throw new Error('connection reset');
        }

        emitted += 1;
        yield bytes.slice(offset, offset + size);
      }
    },
  };
}

function rangeStart(headers: Record<string, string>): number {
  const match = /^bytes=(\d+)-$/u.exec(headers.Range ?? '');

  return match ? Number(match[1]) : 0;
}

function response(
  status: number,
  body: Uint8Array | null,
  headers: Record<string, string> = {},
  options: { pieces?: number; failAfter?: number } = {},
): PackageResponse {
  return {
    status,
    getHeader: (name) => headers[name.toLowerCase()] ?? null,
    chunks: body ? makeBody(body, options.pieces ?? 4, options.failAfter) : null,
    cancel: () => undefined,
  };
}

function harness(script: Script, initial = new Uint8Array(0)) {
  let file = initial;
  let cancelled = false;
  const requests: Record<string, string>[] = [];
  const persisted: number[] = [];
  const progress: number[] = [];
  const deps: DownloadDeps = {
    request: async (headers) => {
      requests.push(headers);

      const out = script.respond(headers, requests.length);

      if (out instanceof Error) {
        throw out;
      }

      return out;
    },
    partialBytes: () => file.length,
    truncate: () => {
      file = new Uint8Array(0);
    },
    append: (bytes) => {
      const next = new Uint8Array(file.length + bytes.length);

      next.set(file);
      next.set(bytes, file.length);
      file = next;
    },
    isCancelled: () => cancelled,
    onProgress: (done) => progress.push(done),
    persist: (done) => void persisted.push(done),
    sleep: async () => undefined,
  };

  return {
    deps,
    requests,
    persisted,
    progress,
    file: () => file,
    cancel: () => {
      cancelled = true;
    },
  };
}

const ok = (headers: Record<string, string> = { etag: '"abc"' }) => response(200, PACKAGE, headers);

describe('runPackageDownload', () => {
  it('downloads a package in one request and reports progress', async () => {
    const h = harness({ respond: () => ok() });
    const result = await runPackageDownload(
      { totalBytes: 1000, etag: null, persistEveryBytes: 1 },
      h.deps,
    );

    expect(Buffer.from(h.file())).toEqual(Buffer.from(PACKAGE));
    expect(result.etag).toBe('"abc"');
    expect(h.requests).toEqual([{}]);
    expect(h.progress[h.progress.length - 1]).toBe(1000);
    expect(h.persisted[h.persisted.length - 1]).toBe(1000);
  });

  it('resumes with Range and If-Range from the partial file', async () => {
    const h = harness(
      {
        respond: (headers) =>
          response(206, PACKAGE.slice(rangeStart(headers)), {
            'content-range': `bytes ${rangeStart(headers)}-999/1000`,
            etag: '"abc"',
          }),
      },
      PACKAGE.slice(0, 300),
    );

    await runPackageDownload({ totalBytes: 1000, etag: '"abc"' }, h.deps);

    expect(h.requests).toEqual([{ Range: 'bytes=300-', 'If-Range': '"abc"' }]);
    expect(Buffer.from(h.file())).toEqual(Buffer.from(PACKAGE));
  });

  it('survives a dropped connection by resuming from where the file ends', async () => {
    const h = harness({
      respond: (headers, call) =>
        call === 1
          ? response(200, PACKAGE, { etag: '"abc"' }, { pieces: 10, failAfter: 4 })
          : response(206, PACKAGE.slice(rangeStart(headers)), {
              'content-range': `bytes ${rangeStart(headers)}-999/1000`,
            }),
    });

    await runPackageDownload({ totalBytes: 1000, etag: null }, h.deps);

    expect(Buffer.from(h.file())).toEqual(Buffer.from(PACKAGE));
    expect(h.requests).toHaveLength(2);
    expect(h.requests[1].Range).toBe('bytes=400-');
    expect(h.requests[1]['If-Range']).toBe('"abc"');
  });

  it('keeps going while each attempt makes progress, but gives up after repeated failures with no progress', async () => {
    const dead = harness({ respond: () => new Error('offline') });

    await expect(
      runPackageDownload({ totalBytes: 1000, etag: null, maxAttempts: 3 }, dead.deps),
    ).rejects.toMatchObject({
      kind: 'network',
    });
    expect(dead.requests).toHaveLength(3);
  });

  it('keeps the partial file when it gives up so a later session can resume', async () => {
    const h = harness({
      respond: (headers, call) =>
        call === 1
          ? response(200, PACKAGE, {}, { pieces: 10, failAfter: 3 })
          : new Error('offline'),
    });

    await expect(
      runPackageDownload({ totalBytes: 1000, etag: '"abc"', maxAttempts: 2 }, h.deps),
    ).rejects.toMatchObject({
      kind: 'network',
    });
    expect(h.file().length).toBe(300);
    expect(h.persisted).toContain(300);
  });

  it('restarts from zero when the package changed on the server (200 to a ranged request)', async () => {
    const h = harness({ respond: () => ok({ etag: '"new"' }) }, new Uint8Array(250).fill(9));
    const result = await runPackageDownload({ totalBytes: 1000, etag: '"old"' }, h.deps);

    expect(Buffer.from(h.file())).toEqual(Buffer.from(PACKAGE));
    expect(result.etag).toBe('"new"');
  });

  it('treats an unsatisfiable range as a restart and a complete file as done', async () => {
    const restart = harness(
      {
        respond: (headers, call) => (call === 1 ? response(416, null) : response(200, PACKAGE, {})),
      },
      new Uint8Array(500),
    );

    await runPackageDownload({ totalBytes: 1000, etag: null }, restart.deps);
    expect(Buffer.from(restart.file())).toEqual(Buffer.from(PACKAGE));

    const done = harness({ respond: () => new Error('must not be called') }, PACKAGE.slice());

    await runPackageDownload({ totalBytes: 1000, etag: null }, done.deps);
    expect(done.requests).toHaveLength(0);
  });

  it('refuses a body longer than the license promised', async () => {
    const h = harness({ respond: () => response(200, new Uint8Array(1200), {}) });

    await expect(
      runPackageDownload({ totalBytes: 1000, etag: null }, h.deps),
    ).rejects.toMatchObject({ kind: 'integrity' });
    expect(h.file().length).toBe(0);
  });

  it('discards a partial file that is already larger than the package', async () => {
    const h = harness({ respond: () => ok() }, new Uint8Array(2000));

    await runPackageDownload({ totalBytes: 1000, etag: null }, h.deps);

    expect(h.file().length).toBe(1000);
    expect(h.requests[0]).toEqual({});
  });

  it('maps 404 to notFound without retrying, and retries 503', async () => {
    const gone = harness({ respond: () => response(404, null) });

    await expect(
      runPackageDownload({ totalBytes: 1000, etag: null }, gone.deps),
    ).rejects.toMatchObject({ kind: 'notFound' });
    expect(gone.requests).toHaveLength(1);

    const flaky = harness({ respond: (headers, call) => (call < 3 ? response(503, null) : ok()) });

    await runPackageDownload({ totalBytes: 1000, etag: null }, flaky.deps);
    expect(flaky.requests).toHaveLength(3);
  });

  it('stops on cancel and leaves what was written', async () => {
    const h = harness({ respond: () => response(200, PACKAGE, {}, { pieces: 10 }) });
    const original = h.deps.onProgress;

    h.deps.onProgress = (done, total) => {
      original(done, total);

      if (done >= 300) {
        h.cancel();
      }
    };

    await expect(
      runPackageDownload({ totalBytes: 1000, etag: null }, h.deps),
    ).rejects.toBeInstanceOf(DownloadError);
    await expect(
      runPackageDownload({ totalBytes: 1000, etag: null }, h.deps),
    ).rejects.toMatchObject({ kind: 'cancelled' });
    expect(h.file().length).toBe(300);
  });
});
