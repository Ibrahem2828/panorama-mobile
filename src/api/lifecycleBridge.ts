import type { NormalizedApiError } from './errors';

/**
 * The API client reports server lifecycle errors (maintenance, forced update) here without
 * knowing anything about UI. A feature registers the handler that turns them into a
 * global blocking screen.
 */
export type LifecycleHandler = (error: NormalizedApiError) => void;

let lifecycleHandler: LifecycleHandler | null = null;

export function registerLifecycleHandler(handler: LifecycleHandler | null): void {
  lifecycleHandler = handler;
}

export function reportLifecycleError(error: NormalizedApiError): void {
  if (error.code !== 'MAINTENANCE_MODE' && error.code !== 'APP_UPDATE_REQUIRED') {
    return;
  }

  lifecycleHandler?.(error);
}
