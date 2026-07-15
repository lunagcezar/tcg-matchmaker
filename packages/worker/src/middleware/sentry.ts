import { captureException, captureMessage } from '@sentry/hono/cloudflare';
import type { SentryTransport } from './logger.js';

export function createSentryTransport(): SentryTransport {
  return {
    captureException(err: Error, context?: Record<string, unknown>) {
      captureException(err, context);
    },
    captureMessage(msg: string, context?: Record<string, unknown>) {
      captureMessage(msg, context);
    },
  };
}
