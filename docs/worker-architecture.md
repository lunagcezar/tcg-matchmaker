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
- Attaches middleware (`authMiddleware`, `adminMiddleware`, `rateLimitMiddleware`).
- Parses request input: `c.req.param()`, `c.req.query()`, `await c.req.json()`.
- Creates Supabase client: `createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY)`.
- Delegates to a single service function per route.
- Maps the service result to HTTP response: `c.json(result, status)`.
- **Does not** contain business logic, validation, or database queries.

```ts
// events/router.ts — example route
eventRouter.get('/:id', async (c) => {
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);
  const result = await getEvent(supabase, c.req.param('id')!);
  if (!result.data) return c.json(result, 404);
  return c.json(result);
});
```

### Service (`service.ts`)

- Pure functions that receive dependencies as arguments (supabase client, user ID, params).
- Validates input with Zod schemas from `@tcg/shared`.
- Applies business rules: status transitions, ownership checks, duplicate detection.
- Calls repository functions for data access.
- Returns a `{ data, error, meta }` object. `error` is a string when something fails.
- **Does not** know about HTTP requests, responses, or status codes.

```ts
// events/service.ts — example
export async function getEvent(supabase: ReturnType<typeof createSecretClient>, id: string) {
  const event = await findEventById(supabase, id);
  if (!event) return { data: null, error: 'Event not found', meta: null };
  const count = await countEventParticipants(supabase, id);
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

| Concern           | Location                                                      |
| ----------------- | ------------------------------------------------------------- |
| Auth middleware   | `middleware/auth.ts` — JWT verification + banned check        |
| Admin guard       | `middleware/admin.ts` — role check                            |
| Rate limiting     | `middleware/rate-limit.ts` — KV-backed factory                |
| Logger            | `middleware/logger.ts` — structured logging + Sentry          |
| DB client factory | `db/client.ts` — `createSecretClient()`, `createAuthClient()` |
| App bootstrap     | `index.ts` — CORS, Sentry, error handler, route mounting      |

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
