---
title: Sentry Logging Integration — Worker + Frontend
version: 1.0
date_created: 2026-07-15
tags: observability, sentry, logging, middleware, operations
---

# Introduction

This specification wires Sentry error tracking into both the Hono Worker and the Quasar frontend. It reuses the existing structured logger for the Worker and adds a minimal Quasar boot file for the frontend, keeping LGPD sanitization and keeping Sentry disabled when no DSN is configured.

## 1. Purpose & Scope

**Purpose:** Integrate real Sentry SDKs with the existing logging infrastructure on both Worker and frontend.

**Scope:**

- Worker: initialize `@sentry/hono/cloudflare` middleware using `SENTRY_DSN` from Cloudflare bindings.
- Worker: adapt the existing `createLogger` Sentry transport to call Sentry SDK functions.
- Worker: preserve LGPD sanitization performed by the logger before events reach Sentry.
- Frontend: install `@sentry/vue` and initialize it in a Quasar boot file using `VITE_SENTRY_DSN`.
- Frontend: enable browser tracing and session replay integrations.

**Out of scope:**

- Adding Sentry to CI/CD or release-source-map uploads.
- Changing logger sanitization rules (covered by spec-014).
- Actual Sentry project setup or DSN provisioning.

## 2. Definitions

- **DSN**: Data Source Name — Sentry project endpoint used by SDKs to send events.
- **LGPD**: Lei Geral de Proteção de Dados — Brazilian data protection law requiring personal data sanitization before third-party services.
- **Boot file**: Quasar convention for application initialization code in `src/boot/`.

## 3. Requirements, Constraints & Guidelines

- **REQ-001**: The Worker must initialize Sentry only when `SENTRY_DSN` is present in Cloudflare bindings.
- **REQ-002**: The Worker logger must send `error`/`critical` logs to Sentry via `captureException` and `info`/`warn` logs via `captureMessage`.
- **REQ-003**: The Worker must not duplicate automatic error capture; the existing `app.onError` handler remains the single path for unhandled errors.
- **REQ-004**: The Worker Sentry middleware must provide request isolation so manual captures include request context.
- **REQ-005**: The frontend must initialize Sentry only when `VITE_SENTRY_DSN` is present.
- **REQ-006**: The frontend must attach Sentry to the Vue app and router for error and performance monitoring.
- **CON-001**: No personal data (email, name, username, phone) may be sent to Sentry; existing logger sanitization must remain in effect.
- **CON-002**: SDK calls must be safe when no DSN is configured (no runtime errors in dev/tests).
- **GUD-001**: Keep the logger transport interface generic so the SDK can be swapped without changing `logger.ts`.

## 4. Interfaces & Data Contracts

### Worker logger transport

```typescript
// packages/worker/src/middleware/logger.ts
export interface SentryTransport {
  captureException(err: Error, context?: Record<string, unknown>): void;
  captureMessage(msg: string, context?: Record<string, unknown>): void;
}
```

### Worker Sentry transport adapter

```typescript
// packages/worker/src/middleware/sentry.ts
export function createSentryTransport(): SentryTransport;
```

### Worker initialization

```typescript
// packages/worker/src/index.ts
app.use(
  '*',
  sentry(app, (env) =>
    env.SENTRY_DSN ? { dsn: env.SENTRY_DSN, shouldHandleError: () => false } : { dsn: '' },
  ),
);

const logger = createLogger({ level: 'debug', sentry: createSentryTransport() });
```

### Frontend initialization

```typescript
// packages/frontend/src/boot/sentry.ts
Sentry.init({
  app,
  dsn,
  integrations: [Sentry.browserTracingIntegration({ router }), Sentry.replayIntegration()],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

## 5. Acceptance Criteria

- **AC-001**: Given `SENTRY_DSN` is set in Worker bindings, When an unhandled error occurs, Then the sanitized event is sent to Sentry.
- **AC-002**: Given `SENTRY_DSN` is empty, When the Worker starts, Then Sentry is disabled and no events are sent.
- **AC-003**: Given `VITE_SENTRY_DSN` is set, When the Quasar SPA boots, Then Sentry Vue integration is initialized with browser tracing and replay.
- **AC-004**: Given `VITE_SENTRY_DSN` is empty, When the Quasar SPA boots, Then Sentry initialization is skipped.
- **AC-005**: All existing Worker and frontend tests continue to pass.
- **AC-006**: `pnpm lint` and frontend `vue-tsc --noEmit` pass without new errors.

## 6. Test Automation Strategy

- **Test Levels**: Unit tests for the logger transport interface (already covered in spec-014), integration build verification.
- **Frameworks**: Vitest for Worker, Vitest + Vue Test Utils for frontend.
- **CI/CD Integration**: `pnpm test` and `pnpm lint` must pass before merge.
- **Coverage Requirements**: No coverage regression; existing tests must pass.

## 7. Rationale & Context

The project already has a structured logger with a pluggable Sentry transport interface, but it was only wired to a mock. Reusing this interface lets us connect the real Sentry SDK with minimal changes. Using `@sentry/hono/cloudflare` provides request-scoped isolation without changing route code. On the frontend, a Quasar boot file is the standard place for third-party SDK initialization.

## 8. Dependencies & External Integrations

### Third-Party Services

- **SVC-001**: Sentry — error tracking and performance monitoring service.

### Technology Platform Dependencies

- **PLT-001**: Cloudflare Workers runtime with `nodejs_compat` flag enabled (required by `@sentry/hono/cloudflare`).
- **PLT-002**: Quasar CLI with Vite (frontend boot file support).

### Compliance Dependencies

- **COM-001**: LGPD — personal data must be sanitized by the logger before Sentry transport.

## 9. Examples & Edge Cases

```typescript
// Worker: manual log call still sends sanitized data to Sentry
logger.warn('User action', { email: 'user@test.com', userId: 'abc' });
// Sentry receives extra: { email: '[SANITIZED]', userId: 'abc' }
```

### Edge cases

- Empty DSN: Sentry middleware receives `{ dsn: '' }` and remains disabled.
- Error thrown in route: Hono calls `app.onError`, logger sanitizes and sends to Sentry; Sentry middleware `shouldHandleError: () => false` prevents duplicate capture.
- Frontend boot without router: not applicable; router is always provided by Quasar boot context.

## 10. Validation Criteria

- `pnpm test` passes (64 Worker + 69 frontend tests).
- `pnpm lint` passes.
- `pnpm -F @tcg/frontend typecheck` passes.
- `pnpm -F @tcg/frontend build` succeeds.

## 11. Related Specifications / Further Reading

- [spec-014-logger-middleware.md](./spec-014-logger-middleware.md)
- [spec-020-operations-setup.md](./spec-020-operations-setup.md)
- [Sentry Hono Cloudflare docs](https://docs.sentry.io/platforms/javascript/guides/hono/)
- [Sentry Vue docs](https://docs.sentry.io/platforms/javascript/guides/vue/)
