# Worker Architecture

## Overview

The Hono Worker (`packages/worker/src/`) follows **domain-driven design**. Each business domain is a self-contained folder with a consistent three-layer file structure: Router → Service → Repository.

```
┌─────────────────────────────────────────────────────────────┐
│                      Incoming HTTP Request                   │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  src/index.ts                                               │
│  • App bootstrap                                           │
│  • Middleware pipeline (CORS, auth, Sentry, error handling) │
│  • Mounts all domain routers at /api/*                     │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  Domain Router (e.g. events/router.ts)                      │
│  • Thin Hono route definitions                              │
│  • Parses request body, query params, path params           │
│  • Creates Supabase client from env bindings                │
│  • Calls service functions                                  │
│  • Returns JSON response with appropriate HTTP status       │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  Domain Service (e.g. events/service.ts)                    │
│  • Business logic and orchestration                         │
│  • Zod validation of request bodies                         │
│  • Auth / ownership checks (user is creator?)               │
│  • Status transitions (draft → open → in_progress)          │
│  • Calls repository functions                               │
│  • Returns { data, error, meta } result objects              │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  Domain Repository (e.g. events/repository.ts)              │
│  • Pure data access functions                               │
│  • Accepts supabase client as first argument                │
│  • One function per query pattern                           │
│  • Returns raw DB rows or { data, error }                   │
│  • No business logic, no HTTP concerns                      │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
                      Supabase DB
```

## File Conventions

Every domain folder contains exactly these files:

| File            | Responsibility                                                               | Typical size |
| --------------- | ---------------------------------------------------------------------------- | ------------ |
| `index.ts`      | Re-exports from `./router.js` (3 lines max). Entry point for `src/index.ts`. | 1–3 lines    |
| `router.ts`     | Hono route definitions. Thin handlers (3–10 lines each).                     | 30–80 lines  |
| `service.ts`    | Business logic. Pure functions that compose validation + repository calls.   | 50–150 lines |
| `repository.ts` | Data access. Pure Supabase queries. One function per query pattern.          | 30–120 lines |

### Example: `src/events/`

```
events/
  index.ts          → export { eventRouter } from './router.js';
  router.ts         → Hono routes: GET /, GET /:id, POST /, PATCH /:id, DELETE /:id, ...
  service.ts        → listEvents(), getEvent(), createEvent(), updateEventById(), ...
  repository.ts     → findEventsPaginated(), findEventById(), countEventParticipants(), ...
  __tests__/
    index.test.ts   → Vitest tests (unchanged)
```

## Layer Rules

### Router (`router.ts`)

- Defines Hono routes with HTTP methods and path patterns.
- Attaches middleware (`authMiddleware`, `adminMiddleware`, `rateLimitMiddleware`, `dbClientMiddleware`).
- Parses request input: `c.req.param()`, `c.req.query()`, `await c.req.json()`.
- Reads the Supabase client from `c.var.db` (created once per request by `dbClientMiddleware`).
- Delegates to a single service function per route.
- Maps the service result to HTTP response using helpers from `src/lib/responses.ts` (`ok`, `notFound`, `badRequest`, etc.).
- **Does not** create its own Supabase client, contain business logic, validation, or database queries.

```ts
// events/router.ts — example route
import { dbClientMiddleware } from '../middleware/db.js';
import { authMiddleware } from '../middleware/auth.js';
import { ok, notFound } from '../lib/responses.js';

eventRouter.get('/:id', dbClientMiddleware, authMiddleware, async (c) => {
  const result = await getEvent(c.var.db, c.req.param('id')!);
  if (!result.data) return notFound(c, result.error);
  return ok(c, result.data);
});
```

### Service (`service.ts`)

- Pure functions that receive dependencies as arguments (supabase client, user ID, params).
- Validates input with the `validate(schema, body)` helper from `src/lib/validation.js` and Zod schemas from `@tcg/shared`.
- Applies business rules: status transitions, ownership checks, duplicate detection.
- Calls repository functions for data access.
- Returns a `{ data, error, meta }` object. `error` is a string when something fails.
- **Does not** know about HTTP requests, responses, or status codes.

```ts
// events/service.ts — example
import { validate } from '../lib/validation.js';
import { GetEventParamsSchema } from '@tcg/shared';

export async function getEvent(supabase: ReturnType<typeof createSecretClient>, rawId: string) {
  const v = validate(GetEventParamsSchema, { id: rawId });
  if (!v.success) return { data: null, error: v.error, meta: null };
  const event = await findEventById(supabase, v.data.id);
  if (!event) return { data: null, error: 'Event not found', meta: null };
  const count = await countEventParticipants(supabase, v.data.id);
  return {
    data: { ...EventSchema.parse(event), participant_count: count },
    error: null,
    meta: null,
  };
}
```

### Repository (`repository.ts`)

- Pure data access functions.
- First parameter is always the supabase client.
- One function per query pattern: `findById`, `findAll`, `insert`, `update`, `softDelete`.
- Returns raw data from Supabase: `T | null` or `{ data, error }`.
- **Does not** parse with Zod, apply business logic, or format responses.

```ts
// events/repository.ts — example
export async function findEventById(supabase: ReturnType<typeof createSecretClient>, id: string) {
  const { data } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single();
  return data;
}
```

## Cross-Cutting Concerns

| Concern           | Location                                                                          |
| ----------------- | --------------------------------------------------------------------------------- |
| Auth middleware   | `middleware/auth.ts` — JWT verification + banned check                            |
| Admin guard       | `middleware/admin.ts` — role check                                                |
| Rate limiting     | `middleware/rate-limit.ts` — KV-backed factory                                    |
| Logger            | `middleware/logger.ts` — structured logging + Sentry                              |
| DB client         | `middleware/db.ts` — creates one `createSecretClient()` per request at `c.var.db` |
| DB client factory | `db/client.ts` — `createSecretClient()`, `createAuthClient()`                     |
| Response helpers  | `lib/responses.ts` — `ok`, `created`, `badRequest`, `notFound`, etc.              |
| Validation helper | `lib/validation.ts` — `validate(schema, body)` returns typed `{ data/error }`     |
| Shared schemas    | `@tcg/shared` — Zod schemas and constants used by both frontend and Worker        |

## Quality Guidelines

The following rules were established by the P0 audit remediation (`spec-069`) and must be followed in all Worker code.

- **DB client once per request**: `middleware/db.ts` creates a single secret Supabase client and attaches it to `c.var.db`. Routers and services read `c.var.db`; they must not call `createSecretClient(...)` directly.
- **Use the validation helper**: All Zod parsing goes through `validate(schema, body)` in `src/lib/validation.ts`. Do not hand-format `parsed.error.issues` into strings in services.
- **Use response helpers**: Build every `{ data, error, meta }` envelope through helpers in `src/lib/responses.ts`. Do not construct `c.json(...)` response objects inline.
- **Use shared constants**: Import `ROLES`/`Role` and `STORE_MEMBERSHIP_ROLES`/`StoreMembershipRole` from `@tcg/shared` for all role checks. No role string literals.
- **No `any` in production**: Production code must not use `any`. Prefer `unknown`, precise types, or Zod schemas. Tests may use `as Type` assertions.
- **Regression tests**: Every bug fix needs a test that fails before the fix and passes after.

## Domains

| Domain           | Routes                                              | Description                |
| ---------------- | --------------------------------------------------- | -------------------------- |
| `auth/`          | `/api/auth/*`                                       | Auth, profile, export      |
| `events/`        | `/api/events/*`                                     | Matches + trading sessions |
| `tournaments/`   | `/api/tournaments/*`, `/api/bracket-matches/*`      | Tournaments + brackets     |
| `stores/`        | `/api/stores/*`                                     | Game stores + memberships  |
| `tcgs/`          | `/api/tcgs/*`, `/api/formats/*`                     | TCG + format CRUD          |
| `moderation/`    | `/api/reports/*`, `/api/admin/*`                    | Reports + admin actions    |
| `notifications/` | `/api/notifications/*`, `/api/push-subscriptions/*` | In-app + push notifs       |
| `geocoding/`     | `/api/geocode/*`                                    | Nominatim proxy (flat)     |

The `geocoding/` domain is the exception: at 74 lines with only 2 routes, it stays monolithic in a single `index.ts`.

## Type Passing

Service and repository functions use `ReturnType<typeof createSecretClient>` as the supabase client type. The actual client is created in the router and passed down:

```
Router:  createSecretClient(env.url, env.key) → passes to service →
Service: passes to repository →
Repo:    executes query → returns data →
Service: formats result → returns { data, error, meta } →
Router:  sends c.json(result, status)
```

This keeps every layer testable in isolation — repository functions can be tested with a mock client, service functions with a mock repository, and router functions with `app.request()`.
