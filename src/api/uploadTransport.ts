import type { HttpHeaders } from './http';

export type UploadProgress = {
  loaded: number;
  total: number;
};

type UploadTransportInit = {
  method: string;
  headers: HttpHeaders;
  body: FormData;
  signal?: AbortSignal;
  onUploadProgress: (progress: UploadProgress) => void;
};

const NULL_BODY_STATUSES = new Set([101, 204, 205, 304]);

function createAbortError(): Error {
  const error = new Error('Aborted');
  error.name = 'AbortError';

  return error;
}

function parseResponseHeaders(raw: string): Headers {
  const headers = new Headers();

  raw
    .trim()
    .split(/[\r\n]+/u)
    .forEach((line) => {
      const separator = line.indexOf(':');

      if (separator <= 0) {
        return;
      }

      try {
        headers.append(line.slice(0, separator).trim(), line.slice(separator + 1).trim());
      } catch {
        // Ignore a header the platform refuses to represent.
      }
    });

  return headers;
}

/**
 * `fetch` cannot report upload progress, so multipart uploads that need a progress bar go
 * through XMLHttpRequest. The result is a standard `Response`, which keeps the rest of the
 * API client (parsing, error mapping, auth refresh) identical for both transports.
 */
export function uploadWithProgress(url: string, init: UploadTransportInit): Promise<Response> {
  return new Promise<Response>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    let settled = false;

    function finish(action: () => void) {
      if (settled) {
        return;
      }

      settled = true;
      init.signal?.removeEventListener('abort', handleAbort);
      action();
    }

    function handleAbort() {
      finish(() => {
        xhr.abort();
        reject(createAbortError());
      });
    }

    if (init.signal?.aborted) {
      reject(createAbortError());
      return;
    }

    init.signal?.addEventListener('abort', handleAbort);

    xhr.open(init.method, url);

    Object.entries(init.headers).forEach(([name, value]) => {
      // The platform sets the multipart boundary itself.
      if (name.toLowerCase() !== 'content-type') {
        xhr.setRequestHeader(name, value);
      }
    });

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        init.onUploadProgress({ loaded: event.loaded, total: event.total });
      }
    };

    xhr.onload = () => {
      finish(() => {
        const bodyText = NULL_BODY_STATUSES.has(xhr.status) ? null : (xhr.responseText ?? '');

        resolve(
          new Response(bodyText, {
            status: xhr.status,
            headers: parseResponseHeaders(xhr.getAllResponseHeaders() ?? ''),
          }),
        );
      });
    };

    xhr.onerror = () => finish(() => reject(new TypeError('Network request failed')));
    xhr.ontimeout = () => finish(() => reject(createAbortError()));
    xhr.onabort = () => finish(() => reject(createAbortError()));

    xhr.send(init.body);
  });
}
