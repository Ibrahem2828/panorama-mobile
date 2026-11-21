import { apiClient, endpoints, generateIdempotencyKey, normalizeApiError } from '../../../api';
import { useAuthStore } from '../../auth/store';
import { offlineDeviceHeaders } from './deviceId';
import {
  issueWithPreparing,
  PreparingCancelledError,
  PreparingTimeoutError,
  type LicenseAttempt,
} from './preparing';
import {
  classifyOfflineError,
  parsePreparing,
  parseServerLicense,
  parseSyncResponse,
  type OfflineErrorKind,
  type OfflineKind,
  type ServerLicense,
  type SyncResponse,
} from './licenseLogic';

/** An offline-library failure already classified for the UI. `status` 404 on renew means the membership is gone. */
export class OfflineLibraryError extends Error {
  readonly kind: OfflineErrorKind;
  readonly status: number | undefined;

  constructor(kind: OfflineErrorKind, status?: number) {
    super(`Offline library: ${kind}`);
    this.kind = kind;
    this.status = status;
  }
}

export function toLibraryError(error: unknown): OfflineLibraryError {
  if (error instanceof OfflineLibraryError) {
    return error;
  }

  const normalized = normalizeApiError(error);
  const offline = (normalized.details as { offline?: boolean } | undefined)?.offline === true;

  return new OfflineLibraryError(
    classifyOfflineError({
      status: normalized.status ?? null,
      code: normalized.errorCode ?? null,
      offline,
      detail: normalized.fieldErrors?.detail?.join(' ') ?? null,
    }),
    normalized.status,
  );
}

function authToken(): string | null {
  return useAuthStore.getState().accessToken;
}

async function options() {
  return { authToken: authToken(), headers: await offlineDeviceHeaders(), noCache: true };
}

type CallOptions = Awaited<ReturnType<typeof options>> & { idempotencyKey: string };

/** The license routes of a kind: lectures and library files expose the same five routes under different prefixes. */
function routes(kind: OfflineKind) {
  return kind === 'file' ? endpoints.files : endpoints.lectures;
}

async function licenseAttempt(
  kind: OfflineKind,
  call: (opts: CallOptions) => Promise<unknown>,
): Promise<LicenseAttempt<ServerLicense>> {
  try {
    const data = await call({ ...(await options()), idempotencyKey: generateIdempotencyKey() });
    const preparing = parsePreparing(data);

    if (preparing) {
      return { kind: 'preparing', delayMs: preparing.delayMs };
    }

    const license = parseServerLicense(data, kind);

    if (!license) {
      throw new OfflineLibraryError('unknown');
    }

    return { kind: 'license', license };
  } catch (error) {
    throw toLibraryError(error);
  }
}

export type IssueOptions = {
  /** Called on every 202 answer (a big file is still being packaged on the server). */
  onPreparing?: (attempt: number) => void;
  isCancelled?: () => boolean;
};

/**
 * Issues (201) or refreshes (200) the license of one lecture or file and returns the content key. For a big library file the
 * server first answers 202 while it builds the package: the same request is repeated until the license arrives.
 */
export function issueLicense(
  id: number | string,
  kind: OfflineKind = 'lecture',
  issue: IssueOptions = {},
): Promise<ServerLicense> {
  return issueWithPreparing({
    attempt: () =>
      licenseAttempt(kind, (opts) =>
        apiClient.post<unknown>(routes(kind).offlineLicense(id), undefined, opts),
      ),
    sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    isCancelled: issue.isCancelled ?? (() => false),
    onPreparing: issue.onPreparing,
  }).catch((error: unknown) => {
    if (error instanceof PreparingCancelledError) {
      throw error;
    }

    if (error instanceof PreparingTimeoutError) {
      throw new OfflineLibraryError('notReady');
    }

    throw toLibraryError(error);
  });
}

/** Extends the license; 404 means access is gone (the caller purges the local copy). */
export function renewLicense(
  id: number | string,
  kind: OfflineKind = 'lecture',
): Promise<ServerLicense> {
  return issueWithPreparing({
    attempt: () =>
      licenseAttempt(kind, (opts) =>
        apiClient.post<unknown>(routes(kind).offlineLicenseRenew(id), undefined, opts),
      ),
    sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    isCancelled: () => false,
    maxAttempts: 1,
  }).catch((error: unknown) => {
    throw toLibraryError(error);
  });
}

/** Tells the server the app deleted its copy (frees a device slot). Failures are ignored by the caller. */
export async function releaseLicense(
  id: number | string,
  kind: OfflineKind = 'lecture',
): Promise<void> {
  try {
    const opts = await options();

    await apiClient.delete<unknown>(routes(kind).offlineLicense(id), {
      authToken: opts.authToken,
      headers: opts.headers,
    });
  } catch (error) {
    throw toLibraryError(error);
  }
}

export async function syncLicenses(
  licenseIds: string[],
  kind: OfflineKind = 'lecture',
): Promise<SyncResponse> {
  try {
    const opts = await options();
    const data = await apiClient.post<unknown, { license_ids: string[] }>(
      routes(kind).offlineLicensesSync,
      { license_ids: licenseIds },
      { authToken: opts.authToken, headers: opts.headers },
    );
    const parsed = parseSyncResponse(data);

    if (!parsed) {
      throw new OfflineLibraryError('unknown');
    }

    return parsed;
  } catch (error) {
    throw toLibraryError(error);
  }
}
