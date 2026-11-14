import { decideResume, resumeHeaders } from './licenseLogic';

export type DownloadFailureKind =
  | 'cancelled'
  | 'notFound'
  | 'network'
  | 'server'
  | 'integrity'
  | 'disk';

export class DownloadError extends Error {
  readonly kind: DownloadFailureKind;

  constructor(kind: DownloadFailureKind) {
    super(`Download failed: ${kind}`);
    this.kind = kind;
  }
}

export type PackageResponse = {
  status: number;
  getHeader(name: string): string | null;
  /** The body, read incrementally. Null when the response has no body. */
  chunks: AsyncIterable<Uint8Array> | null;
  /** Stops reading and releases the connection. */
  cancel(): void;
};

export type DownloadDeps = {
  request(headers: Record<string, string>): Promise<PackageResponse>;
  /** Size of the partial file on disk right now (the single source of truth for where to resume). */
  partialBytes(): number;
  truncate(): void;
  append(bytes: Uint8Array): void;
  isCancelled(): boolean;
  onProgress(doneBytes: number, totalBytes: number): void;
  /** Remembers progress and the entity tag so a later session can resume. Called at most every `persistEveryBytes`. */
  persist(doneBytes: number, etag: string | null): Promise<void> | void;
  sleep(ms: number): Promise<void>;
};

export type DownloadInput = {
  totalBytes: number;
  etag: string | null;
  /** Network attempts before giving up (the partial file is kept for a later resume). */
  maxAttempts?: number;
  persistEveryBytes?: number;
};

const RETRYABLE = new Set([408, 425, 429, 500, 502, 503, 504]);

/**
 * Downloads the PNOF package with Range/If-Range resumption into the partial file behind `deps`. The bytes are written exactly as
 * received (ciphertext). Resumes after a dropped connection on its own (bounded, with backoff); a package replaced on the
 * server (If-Range mismatch answers 200) restarts from zero; any byte count beyond the license's `file_size` is an integrity error.
 */
export async function runPackageDownload(
  input: DownloadInput,
  deps: DownloadDeps,
): Promise<{ etag: string | null }> {
  const maxAttempts = input.maxAttempts ?? 4;
  const persistEvery = input.persistEveryBytes ?? 2 * 1024 * 1024;
  let etag = input.etag;
  let attempt = 0;

  while (true) {
    if (deps.isCancelled()) {
      throw new DownloadError('cancelled');
    }

    let partial = deps.partialBytes();

    if (partial > input.totalBytes) {
      deps.truncate();
      partial = 0;
    }

    if (partial === input.totalBytes) {
      return { etag };
    }

    attempt += 1;

    let response: PackageResponse;

    try {
      response = await deps.request(resumeHeaders(partial, etag));
    } catch {
      if (attempt >= maxAttempts) {
        throw new DownloadError('network');
      }

      await deps.sleep(backoff(attempt));
      continue;
    }

    if (response.status === 404 || response.status === 403 || response.status === 401) {
      response.cancel();
      throw new DownloadError('notFound');
    }

    if (RETRYABLE.has(response.status)) {
      response.cancel();

      if (attempt >= maxAttempts) {
        throw new DownloadError(response.status >= 500 ? 'server' : 'network');
      }

      await deps.sleep(backoff(attempt));
      continue;
    }

    const decision = decideResume({
      partialBytes: partial,
      totalBytes: input.totalBytes,
      status: response.status,
      contentRange: response.getHeader('content-range'),
    });

    if (decision.action === 'complete') {
      response.cancel();
      return { etag };
    }

    if (decision.action === 'fail') {
      response.cancel();
      throw new DownloadError('server');
    }

    if (decision.action === 'restart') {
      deps.truncate();
      partial = 0;
    }

    etag = response.getHeader('etag') ?? etag;

    let written = partial;
    let sincePersist = 0;

    try {
      if (response.chunks) {
        for await (const chunk of response.chunks) {
          if (deps.isCancelled()) {
            response.cancel();
            throw new DownloadError('cancelled');
          }

          if (written + chunk.length > input.totalBytes) {
            response.cancel();
            deps.truncate();
            throw new DownloadError('integrity');
          }

          deps.append(chunk);
          written += chunk.length;
          sincePersist += chunk.length;
          deps.onProgress(written, input.totalBytes);

          if (sincePersist >= persistEvery) {
            sincePersist = 0;
            await deps.persist(written, etag);
          }
        }
      }
    } catch (error) {
      if (error instanceof DownloadError) {
        throw error;
      }

      await deps.persist(deps.partialBytes(), etag);

      if (deps.partialBytes() > partial) {
        attempt = 0;
      }

      if (attempt >= maxAttempts) {
        throw new DownloadError('network');
      }

      await deps.sleep(backoff(attempt));
      continue;
    }

    await deps.persist(written, etag);

    if (written === input.totalBytes) {
      return { etag };
    }

    // The stream ended early (the connection was cut): resume from where the file ends.
    if (written > partial) {
      attempt = 0;
    }

    if (attempt >= maxAttempts) {
      throw new DownloadError('network');
    }

    await deps.sleep(backoff(attempt));
  }
}

function backoff(attempt: number): number {
  return Math.min(8000, 500 * 2 ** (attempt - 1)) + Math.floor(Math.random() * 250);
}
