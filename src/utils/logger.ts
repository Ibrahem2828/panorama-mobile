type LogLevel = 'debug' | 'info' | 'warn' | 'error';
type LogContext = Record<string, unknown>;

type LogPayload = {
  level: LogLevel;
  message: string;
  context?: LogContext;
};

export function createLogPayload(payload: LogPayload) {
  return payload;
}

const sensitiveKeyPattern = /(password|token|secret|authorization|apiKey|otp)/i;

function sanitizeContext(context?: LogContext): LogContext | undefined {
  if (!context) {
    return undefined;
  }

  return Object.fromEntries(
    Object.entries(context).map(([key, value]) => [
      key,
      sensitiveKeyPattern.test(key) ? '[redacted]' : value,
    ]),
  );
}

function writeLog(level: LogLevel, message: string, context?: LogContext) {
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction && (level === 'debug' || level === 'info')) {
    return;
  }

  const sanitizedContext = sanitizeContext(context);
  const payload = createLogPayload({
    level,
    message,
    context: sanitizedContext,
  });

  if (payload.context) {
    console[level](`[${payload.level}] ${payload.message}`, payload.context);
    return;
  }

  console[level](`[${payload.level}] ${payload.message}`);
}

export const logger = {
  debug(message: string, context?: LogContext) {
    writeLog('debug', message, context);
  },
  info(message: string, context?: LogContext) {
    writeLog('info', message, context);
  },
  warn(message: string, context?: LogContext) {
    writeLog('warn', message, context);
  },
  error(message: string, context?: LogContext) {
    writeLog('error', message, context);
  },
} as const;
