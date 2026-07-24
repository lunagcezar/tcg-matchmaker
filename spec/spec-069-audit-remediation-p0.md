---
title: Audit Remediation — P0 Bug Fixes and Core DRY/SOLID Improvements
version: 1.0
date_created: 2026-07-24
last_updated: 2026-07-24
owner: OpenCode
 tags:
  - quality
  - refactor
  - worker
  - frontend
  - shared
---

# Introduction

A recent code-quality audit found DRY and SOLID violations across the `tcg-matchmaker` monorepo, plus a small number of functional bugs. This specification defines the first remediation phase (P0), focusing on correctness, removal of duplicated cross-cutting concerns, and alignment with the shared package as the single source of truth.

## 1. Purpose & Scope

### Purpose

- Fix the bugs and policy violations discovered in the audit.
- Remove the most damaging duplication in the worker and frontend.
- Establish shared patterns for API responses, validation, and database-client access.

### Scope

- Worker: bracket endpoint bug, DB-client instantiation, response/validation helpers, role constants.
- Frontend: locale bug, tournament `best_of` bug, `any` types, raw `fetch` in `useAuthStore`, role constants.
- Shared: role constants, store-membership constants, validation helpers.
- Tests and linting must remain green.

### Out of scope

- UI component extraction (EventRow, DateTimePicker, admin list wrapper).
- Splitting large pages (SettingsPage, ManagePage) into smaller components.
- Completing shared types or adding Luxon formatting.
- These are deferred to a follow-up phase.

## 2. Definitions

- **DRY**: Don't Repeat Yourself — every piece of knowledge has a single, unambiguous representation.
- **SOLID**: Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion.
- **DB client**: The Supabase secret-key client used by the worker to query Postgres.
- **Response envelope**: The `{ data, error, meta }` shape returned by every API response.

## 3. Requirements, Constraints & Guidelines

### Correctness

- **REQ-001**: The frontend locale picker must respect a stored locale of `en-US` and not always default to `pt-BR`.
- **REQ-002**: The `GET /api/tournaments/:id/bracket` endpoint must return all rounds and all matches for a tournament, not only the first round.
- **REQ-003**: The tournament creation form must send `best_of` as a number matching `CreateEventSchema`, not as a string.

### Type safety

- **REQ-004**: No `any` type may remain in production frontend code under `packages/frontend/src`.
- **REQ-005**: Worker and frontend role checks must use the shared `Role` type and `ROLES` constant instead of string literals.

### DRY / cross-cutting concerns

- **REQ-006**: The worker must create the secret Supabase client exactly once per request in middleware and attach it to `c.var.db`.
- **REQ-007**: All worker routers must consume `c.var.db` and must not call `createSecretClient(...)` directly.
- **REQ-008**: The worker must provide a single `validationResult(schema, body)` helper for Zod parsing; service code must not hand-format Zod issue messages.
- **REQ-009**: The worker must provide standard response helpers (`ok`, `badRequest`, `notFound`, `forbidden`, `unauthorized`, `validationError`) so response shape and status codes are authored once.
- **REQ-010**: The frontend must use `apiGet` from `@/composables/useApi` for the `/api/auth/me` call instead of raw `fetch`.

### Constants

- **REQ-011**: The shared package must export `ROLES` and `Role` for user roles and `STORE_MEMBERSHIP_ROLES`/`StoreMembershipRole` for store membership roles.
- **REQ-012**: Worker authorization checks and frontend color/guard code must import these constants instead of using string literals.

### Testing

- **REQ-013**: Every bug fix must be accompanied by a regression test that fails before the fix and passes after.
- **REQ-014**: All existing tests and linting must continue to pass.

## 4. Interfaces & Data Contracts

### Worker middleware

```ts
// src/middleware/db.ts
export async function dbClientMiddleware(c: Context, next: Next) {
  c.set('db', createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY));
  await next();
}
```

`Variables` type in `src/index.ts` is extended with `db: ReturnType<typeof createSecretClient>`.

### Worker response helpers

```ts
// src/lib/responses.ts
export function ok<T>(c: Context, data: T, meta?: unknown) { ... }
export function badRequest(c: Context, error: string) { ... }
export function validationError(c: Context, issues: string[]) { ... }
export function notFound(c: Context, error = 'Not found') { ... }
export function forbidden(c: Context, error = 'Forbidden') { ... }
export function unauthorized(c: Context, error = 'Unauthorized') { ... }
```

### Worker validation helper

```ts
// src/lib/validation.ts
export function validate<T>(schema: ZodSchema<T>, body: unknown):
  | { success: true; data: T }
  | { success: false; error: string; issues: string[] } { ... }
```

### Shared constants

```ts
// packages/shared/src/constants.ts
export const ROLES = ['player', 'organizer', 'admin'] as const;
export type Role = (typeof ROLES)[number];

export const STORE_MEMBERSHIP_ROLES = ['owner', 'manager', 'staff'] as const;
export type StoreMembershipRole = (typeof STORE_MEMBERSHIP_ROLES)[number];
```

## 5. Acceptance Criteria

- **AC-001**: Given a browser with `localStorage.locale = 'en-US'`, when the app boots, then the active locale is `en-US`.
- **AC-002**: Given a tournament with three rounds, when calling `GET /api/tournaments/:id/bracket`, then the response includes all three rounds and all matches.
- **AC-003**: Given a tournament creation form with "Best Of" set to "3", when submitted, then the request body contains `best_of: 3` (number).
- **AC-004**: Given `rg -n "no-explicit-any" packages/frontend/src`, when the command is run, then no matches are found.
- **AC-005**: Given `rg -n "createSecretClient\(" packages/worker/src --type ts`, when the command is run, then the only matches are in `src/db/client.ts` and `src/middleware/db.ts`.
- **AC-006**: Given a worker route test, when the route needs a database client, then the test provides it via `c.set('db', mockDb)` or middleware rather than mocking `createSecretClient`.
- **AC-007**: Given `rg -n "role: 'player' | 'organizer' | 'admin'" packages/worker/src packages/frontend/src`, when the command is run, then no matches are found.
- **AC-008**: Given `pnpm test`, when the command completes, then all worker and frontend tests pass.
- **AC-009**: Given `pnpm lint`, when the command completes, then it exits with zero errors and zero warnings.

## 6. Test Automation Strategy

- **Unit tests**: Vitest for worker and frontend.
- **Integration tests**: Existing worker route tests with mocked Supabase client.
- **Regression tests**: Add tests for locale selection, bracket endpoint, and `best_of` type before fixing them.
- **CI**: `pnpm test` and `pnpm lint` must pass.
- **Coverage**: No new production code without a test that fails first.

## 7. Rationale & Context

The audit showed that the codebase has grown faster than its shared abstractions. The worker currently has 66 call sites creating the same Supabase client, response envelopes are hand-rolled everywhere, and Zod validation errors are reformatted in each service. The frontend has policy-level `any` usage and a raw `fetch` call that duplicates the `useApi` wrapper. Fixing these first prevents the duplication from compounding and makes the follow-up UI refactor safer.

## 8. Dependencies & External Integrations

- **EXT-001**: Supabase PostgreSQL — worker queries via the secret-key client.
- **EXT-002**: Hono — worker router framework; middleware dependency injection is used for `c.var.db`.
- **EXT-003**: Zod — shared schemas and validation helpers.

## 9. Examples & Edge Cases

### DB client middleware usage

```ts
// Before
app.get('/api/tournaments', async (c) => {
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);
  ...
});

// After
app.use('*', dbClientMiddleware);
app.get('/api/tournaments', async (c) => {
  const supabase = c.var.db;
  ...
});
```

### Validation helper usage

```ts
// Before
const parsed = CreateEventSchema.safeParse(body);
if (!parsed.success) {
  return c.json(
    {
      data: null,
      error: `Validation failed: ${parsed.error.issues.map((i) => i.message).join(', ')}`,
      meta: null,
    },
    400,
  );
}

// After
const result = validate(CreateEventSchema, body);
if (!result.success) {
  return validationError(c, result.issues);
}
const data = result.data;
```

### Locale edge case

If `localStorage` has no locale, the app should continue to default based on `navigator.language.startsWith('pt')`. Parentheses must be added so the conditional applies to the entire `localStorage.getItem('locale') || ...` expression.

## 10. Validation Criteria

- All acceptance criteria pass.
- `pnpm test` exits 0.
- `pnpm lint` exits 0 with no warnings.
- No new `any` types in production code.
- No direct `createSecretClient` calls in worker routers.
- No duplicated role string literals.

## 11. Related Specifications / Further Reading

- `spec-001-project-infrastructure.md`
- `spec-065-worker-domain-refactor.md`
- `spec-068-filter-segment-admin-table.md`
- `AGENTS.md` — Code Conventions and API Conventions
