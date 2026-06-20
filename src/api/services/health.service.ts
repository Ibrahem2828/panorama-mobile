import { apiClient } from '../client';
import { endpoints } from '../endpoints';

export type HealthStatus = {
  isHealthy: boolean;
  status: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toStatusText(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }

  return undefined;
}

export async function getHealthStatus(): Promise<HealthStatus> {
  const response = await apiClient.get<unknown>(endpoints.health);
  const status = isRecord(response)
    ? (toStatusText(response.status) ??
      toStatusText(response.message) ??
      toStatusText(response.detail) ??
      'ok')
    : (toStatusText(response) ?? 'ok');
  const explicitHealth = isRecord(response) ? response.healthy : undefined;

  return {
    isHealthy: typeof explicitHealth === 'boolean' ? explicitHealth : true,
    status,
  };
}
