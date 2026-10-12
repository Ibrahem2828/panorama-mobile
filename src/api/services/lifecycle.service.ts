import { apiClient } from '../client';
import { endpoints } from '../endpoints';

export type ServiceLifecycleStatus = {
  maintenanceEnabled: boolean;
  retryAfterSeconds: number | null;
  storeUrl: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toNonEmptyString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

/**
 * Probes the public mobile bootstrap endpoint. `/health/` is deliberately NOT used: the
 * backend exempts it from the maintenance gate, so it answers 200 during maintenance and
 * would make the app believe the outage is over. Bootstrap is exempt too, but it reports
 * the real maintenance flag in its payload.
 */
export async function getServiceLifecycleStatus(): Promise<ServiceLifecycleStatus> {
  const data = await apiClient.get<unknown>(endpoints.mobileBootstrap);
  const maintenance = isRecord(data) && isRecord(data.maintenance) ? data.maintenance : null;
  const update = isRecord(data) && isRecord(data.update) ? data.update : null;

  return {
    maintenanceEnabled: maintenance?.enabled === true,
    retryAfterSeconds:
      typeof maintenance?.retry_after_seconds === 'number' ? maintenance.retry_after_seconds : null,
    storeUrl: toNonEmptyString(update?.store_url),
  };
}
