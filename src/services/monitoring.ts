import * as Sentry from '@sentry/react-native';

import { env } from '../config/env';

let initialised = false;

/**
 * Crash and error reporting. Inert unless a DSN is configured for a non-development
 * build, so local runs and tests never send anything.
 */
export function initMonitoring(): void {
  if (initialised || env.isDevelopment || !env.sentryDsn) return;
  initialised = true;
  Sentry.init({
    dsn: env.sentryDsn,
    environment: env.appEnv,
    enableAutoSessionTracking: true,
    tracesSampleRate: env.isProduction ? 0.1 : 0,
    sendDefaultPii: false,
    beforeSend(event) {
      // Never ship credentials or contact details that rode along in a request.
      if (event.request) {
        delete event.request.headers;
        delete event.request.cookies;
        delete event.request.data;
      }
      if (event.user) event.user = { id: event.user.id };
      return event;
    },
  });
}

export function reportError(error: unknown, context?: Record<string, unknown>): void {
  if (!initialised) return;
  Sentry.captureException(error, context ? { extra: context } : undefined);
}

export function setMonitoringUser(userId: string | number | null): void {
  if (!initialised) return;
  Sentry.setUser(userId === null ? null : { id: String(userId) });
}
