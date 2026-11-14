import { fetch as streamingFetch } from 'expo/fetch';
import { FileMode, type File, type FileHandle } from 'expo-file-system';

import { getAppClientHeaders, refreshAccessTokenOnce } from '../../../api';
import { buildApiUrl } from '../../../config/env';
import { isTrustedBackendUrl } from '../../../utils/trustedUrl';
import { useAuthStore } from '../../auth/store';
import { DownloadError, type PackageResponse } from './downloadCore';
import { offlineDeviceHeaders } from './deviceId';
import type { DecryptSource } from './pnof';

const TRUSTED = { pathPrefixes: ['/api/v1/lectures/'], allowHttpInDevelopment: true } as const;

/** Append-only writer for the partial ciphertext file. `bytes` is the size on disk (the resume point). */
export class PartWriter {
  private handle: FileHandle | null = null;
  bytes: number;

  constructor(private readonly file: File) {
    this.bytes = file.exists ? (file.size ?? 0) : 0;
  }

  append(chunk: Uint8Array): void {
    try {
      if (!this.handle) {
        if (!this.file.exists) {
          this.file.create({ intermediates: true });
        }

        this.handle = this.file.open(FileMode.Append);
      }

      this.handle.writeBytes(chunk);
      this.bytes += chunk.length;
    } catch {
      this.close();
      throw new DownloadError('disk');
    }
  }

  truncate(): void {
    this.close();
    this.file.create({ intermediates: true, overwrite: true });
    this.bytes = 0;
  }

  close(): void {
    try {
      this.handle?.close();
    } catch {
      // Already closed.
    }

    this.handle = null;
  }
}

async function readerToIterable(
  body: ReadableStream<Uint8Array> | null,
): Promise<{ chunks: AsyncIterable<Uint8Array> | null; cancel: () => void }> {
  if (!body) {
    return { chunks: null, cancel: () => undefined };
  }

  const reader = body.getReader();

  return {
    chunks: {
      async *[Symbol.asyncIterator]() {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            return;
          }

          if (value && value.length > 0) {
            yield value;
          }
        }
      },
    },
    cancel: () => {
      void reader.cancel().catch(() => undefined);
    },
  };
}

/**
 * Opens the ciphertext package stream. Uses the bearer token, the device id header and the app client headers; a 401 refreshes
 * the token once. The URL must stay on the configured backend.
 */
export function createPackageRequester(
  packageUrl: string,
  signal: AbortSignal,
): (rangeHeaders: Record<string, string>) => Promise<PackageResponse> {
  const url = buildApiUrl(packageUrl);

  return async (rangeHeaders) => {
    if (!isTrustedBackendUrl(url, TRUSTED)) {
      throw new DownloadError('server');
    }

    const send = async (token: string | null) =>
      streamingFetch(url, {
        signal,
        headers: {
          ...getAppClientHeaders(),
          ...(await offlineDeviceHeaders()),
          Accept: 'application/octet-stream',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...rangeHeaders,
        },
      });

    let response = await send(useAuthStore.getState().accessToken);

    if (response.status === 401) {
      const token = await refreshAccessTokenOnce();

      response = await send(token ?? useAuthStore.getState().accessToken);
    }

    const { chunks, cancel } = await readerToIterable(response.body);

    return {
      status: response.status,
      getHeader: (name) => response.headers.get(name),
      chunks,
      cancel,
    };
  };
}

/** Random-access reader over a stored package for the PNOF decryptor. Close it when done. */
export function openPackageReader(file: File): DecryptSource & { close(): void } {
  const handle = file.open(FileMode.ReadOnly);

  return {
    size: handle.size ?? file.size ?? 0,
    async read(start, length) {
      handle.offset = start;

      return handle.readBytes(length);
    },
    close() {
      try {
        handle.close();
      } catch {
        // Already closed.
      }
    },
  };
}

/** Sequential writer for the decrypted temp copy. */
export function openTempWriter(file: File): {
  write(bytes: Uint8Array): void;
  close(): void;
} {
  file.create({ intermediates: true, overwrite: true });

  const handle = file.open(FileMode.WriteOnly);

  return {
    write(bytes) {
      handle.writeBytes(bytes);
    },
    close() {
      try {
        handle.close();
      } catch {
        // Already closed.
      }
    },
  };
}
