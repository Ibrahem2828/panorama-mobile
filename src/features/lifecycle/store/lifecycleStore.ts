import { create } from 'zustand';

import {
  lifecycleService,
  normalizeApiError,
  registerLifecycleHandler,
  type NormalizedApiError,
} from '../../../api';

export type MaintenanceInfo = {
  titleAr: string;
  titleEn: string;
  messageAr: string;
  messageEn: string;
  estimatedEndAt: string | null;
  retryAfterSeconds: number;
};

export type UpdateRequiredInfo = {
  storeUrl: string | null;
  messageAr: string;
  messageEn: string;
};

export type LifecycleProbeResult = 'recovered' | 'still_down' | 'failed';

type LifecycleState = {
  maintenance: MaintenanceInfo | null;
  updateRequired: UpdateRequiredInfo | null;
  isChecking: boolean;
  lastProbeResult: LifecycleProbeResult | null;

  handleLifecycleError: (error: NormalizedApiError) => void;
  /** Probes the public bootstrap endpoint and leaves maintenance mode if it is over. */
  recheck: () => Promise<LifecycleProbeResult>;
  reset: () => void;
};

/** Never poll faster than this, whatever the server's Retry-After says. */
export const MIN_MAINTENANCE_POLL_SECONDS = 15;
export const MAX_MAINTENANCE_POLL_SECONDS = 60;
const DEFAULT_RETRY_AFTER_SECONDS = 30;

function text(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function toMaintenanceInfo(error: NormalizedApiError): MaintenanceInfo {
  const details = error.details ?? {};
  const retryAfter = error.retryAfterSeconds ?? DEFAULT_RETRY_AFTER_SECONDS;

  return {
    titleAr: text(details.title_ar),
    titleEn: text(details.title_en),
    messageAr: text(details.message_ar),
    messageEn: error.technicalMessage ?? '',
    estimatedEndAt: typeof details.estimated_end_at === 'string' ? details.estimated_end_at : null,
    retryAfterSeconds: retryAfter,
  };
}

function toUpdateInfo(error: NormalizedApiError): UpdateRequiredInfo {
  const details = error.details ?? {};

  return {
    storeUrl: text(details.store_url).trim() || null,
    messageAr: text(details.message_ar),
    messageEn: text(details.message_en) || (error.technicalMessage ?? ''),
  };
}

export function getMaintenancePollIntervalMs(info: MaintenanceInfo | null): number {
  const seconds = Math.min(
    MAX_MAINTENANCE_POLL_SECONDS,
    Math.max(MIN_MAINTENANCE_POLL_SECONDS, info?.retryAfterSeconds ?? DEFAULT_RETRY_AFTER_SECONDS),
  );

  return seconds * 1000;
}

const initialState = {
  maintenance: null,
  updateRequired: null,
  isChecking: false,
  lastProbeResult: null,
};

export const useLifecycleStore = create<LifecycleState>((set, get) => ({
  ...initialState,

  handleLifecycleError(error) {
    if (error.code === 'APP_UPDATE_REQUIRED') {
      // Sticky: only installing a newer build resolves it.
      set({ updateRequired: toUpdateInfo(error) });
      return;
    }

    if (error.code === 'MAINTENANCE_MODE') {
      set({ maintenance: toMaintenanceInfo(error), lastProbeResult: null });
    }
  },

  async recheck() {
    if (get().isChecking) {
      return get().lastProbeResult ?? 'still_down';
    }

    set({ isChecking: true });

    try {
      const status = await lifecycleService.getServiceLifecycleStatus();

      if (status.maintenanceEnabled) {
        set({ isChecking: false, lastProbeResult: 'still_down' });
        return 'still_down';
      }

      set({ maintenance: null, isChecking: false, lastProbeResult: 'recovered' });
      return 'recovered';
    } catch (error) {
      const normalized = normalizeApiError(error);

      // The probe itself can be answered with the lifecycle errors on exotic setups.
      if (normalized.code === 'MAINTENANCE_MODE') {
        set({ isChecking: false, lastProbeResult: 'still_down' });
        return 'still_down';
      }

      set({ isChecking: false, lastProbeResult: 'failed' });
      return 'failed';
    }
  },

  reset() {
    set(initialState);
  },
}));

let isConnected = false;

/** Routes lifecycle errors reported by the API client into the store. Idempotent. */
export function connectLifecycleBridge(): void {
  if (isConnected) {
    return;
  }

  registerLifecycleHandler((error) => useLifecycleStore.getState().handleLifecycleError(error));
  isConnected = true;
}

connectLifecycleBridge();
