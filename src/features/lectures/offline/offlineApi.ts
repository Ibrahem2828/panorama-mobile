import { apiClient, endpoints, generateIdempotencyKey, normalizeApiError } from '../../../api';
import { useAuthStore } from '../../auth/store';
import { offlineDeviceHeaders } from './deviceId';
import {
  classifyOfflineError,
  parseServerLicense,
  parseSyncResponse,
  type OfflineErrorKind,
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

async function licenseCall(call: (opts: CallOptions) => Promise<unknown>): Promise<ServerLicense> {
  try {
    const license = parseServerLicense(
      await call({ ...(await options()), idempotencyKey: generateIdempotencyKey() }),
    );

    if (!license) {
      throw new OfflineLibraryError('unknown');
    }

    return license;
  } catch (error) {
    throw toLibraryError(error);
  }
}

/** Issues (201) or refreshes (200) the license of one lecture and returns the content key. */
export function issueLicense(lectureId: number | string): Promise<ServerLicense> {
  return licenseCall((opts) =>
    apiClient.post<unknown>(endpoints.lectures.offlineLicense(lectureId), undefined, opts),
  );
}

/** Extends the license; 404 means access is gone (the caller purges the local copy). */
export function renewLicense(lectureId: number | string): Promise<ServerLicense> {
  return licenseCall((opts) =>
    apiClient.post<unknown>(endpoints.lectures.offlineLicenseRenew(lectureId), undefined, opts),
  );
}

/** Tells the server the app deleted its copy (frees a device slot). Failures are ignored by the caller. */
export async function releaseLicense(lectureId: number | string): Promise<void> {
  try {
    const opts = await options();

    await apiClient.delete<unknown>(endpoints.lectures.offlineLicense(lectureId), {
      authToken: opts.authToken,
      headers: opts.headers,
    });
  } catch (error) {
    throw toLibraryError(error);
  }
}

export async function syncLicenses(licenseIds: string[]): Promise<SyncResponse> {
  try {
    const opts = await options();
    const data = await apiClient.post<unknown, { license_ids: string[] }>(
      endpoints.lectures.offlineLicensesSync,
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
