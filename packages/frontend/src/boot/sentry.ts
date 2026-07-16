import { defineBoot } from '#q-app';
import * as Sentry from '@sentry/vue';
import type { Router } from 'vue-router';

export default defineBoot(({ app, router }) => {
  const dsn = import.meta.env.QCLI_SENTRY_DSN;
  if (!dsn) {
    return;
  }

  Sentry.init({
    app,
    dsn,
    integrations: [
      Sentry.browserTracingIntegration({ router: router as Router }),
      Sentry.replayIntegration(),
    ],
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
});
