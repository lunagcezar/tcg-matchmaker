const SENSITIVE_KEYS = new Set(['password', 'token', 'secret', 'authorization', 'cookie']);
const PERSONAL_KEYS = new Set(['email', 'name', 'display_name', 'username', 'phone']);

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical';

const LEVELS: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3, critical: 4 };

interface SentryTransport {
  captureException(err: Error, context?: Record<string, unknown>): void;
  captureMessage(msg: string, context?: Record<string, unknown>): void;
}

interface LoggerOptions {
  level: LogLevel;
  sentry?: SentryTransport;
}

function sanitize(data: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) continue;
    if (PERSONAL_KEYS.has(key.toLowerCase())) {
      result[key] = '[SANITIZED]';
    } else {
      result[key] = value;
    }
  }
  return result;
}

export function createLogger(options: LoggerOptions) {
  const currentLevel = LEVELS[options.level] ?? 1;
  const isDev = options.level === 'debug';

  function log(level: LogLevel, message: string, extra?: Record<string, unknown>) {
    if (LEVELS[level] < currentLevel) return;

    const timestamp = new Date().toISOString();
    const sanitized = extra ? sanitize(extra) : undefined;

    console.log(`[${timestamp}] [${level}]`, message, sanitized ?? '');

    if (options.sentry && level !== 'debug') {
      if (level === 'error' || level === 'critical') {
        const err = extra?.error instanceof Error ? extra.error : new Error(message);
        options.sentry.captureException(err, { extra: sanitized, level, timestamp });
      } else {
        options.sentry.captureMessage(message, { extra: sanitized, level, timestamp });
      }
    }
  }

  return {
    debug: (msg: string, extra?: Record<string, unknown>) => isDev && log('debug', msg, extra),
    info: (msg: string, extra?: Record<string, unknown>) => log('info', msg, extra),
    warn: (msg: string, extra?: Record<string, unknown>) => log('warn', msg, extra),
    error: (msg: string, extra?: Record<string, unknown>) => log('error', msg, extra),
    critical: (msg: string, extra?: Record<string, unknown>) => log('critical', msg, extra),
  };
}
