---
title: Worker Domain Refactoring — Split Monolithic Files into Router/Service/Repository
version: 1.0
date_created: 2026-07-23
tags: worker, refactor, architecture
---

# Introduction

Refactor the Worker's domain folders to follow a consistent three-layer pattern (Router → Service → Repository), splitting 6 monolithic `index.ts` files that mix route definitions, business logic, and database queries into dedicated files with single responsibilities.

## 1. Purpose & Scope

**Purpose**: Reduce file sizes, separate concerns, and align the codebase with the DDD layering described in AGENTS.md (routes → service layer → database queries).

**Scope**: All 7 domain folders under `packages/worker/src/`:

- `auth/`
- `events/`
- `stores/`
- `tcgs/`
- `moderation/`
- `tournaments/`
- `notifications/`

The `geocoding/` domain (74 lines) is excluded — it is already small and single-purpose.

**Out of scope**: No behavioral changes. No API contract changes. No new features. No changes to `src/index.ts` (entry point). No changes to test files.

## 2. Definitions

- **Router**: Hono route definitions. Thin handlers that parse request params, call service functions, and return JSON responses. Located in `router.ts`.
- **Service**: Business logic. Orchestrates validation (Zod), calls repository functions, applies auth checks, and returns typed result objects. Located in `service.ts`.
- **Repository**: Data access. Pure Supabase query functions that accept a client and return raw DB rows. Located in `repository.ts`.
- **Domain index.ts**: Re-exports from `router.ts` so `src/index.ts` imports remain unchanged.

## 3. Requirements, Constraints & Guidelines

- **REQ-001**: Each domain folder must gain a `router.ts`, `service.ts`, and `repository.ts` file.
- **REQ-002**: Each domain's `index.ts` must re-export from `router.ts` with the same named exports as before.
- **REQ-003**: `src/index.ts` imports must not change (e.g., `import { eventRouter } from './events/index.js'`).
- **REQ-004**: All existing routes, middleware chains, validation behavior, error responses, and status codes must be preserved identically.
- **REQ-005**: `tournaments/index.ts` must move `generateSingleEliminationBracket` into `bracket-generators.ts` for consistency with the other 4 generators.
- **REQ-006**: `geocoding/index.ts` (74 lines) is left as-is.
- **REQ-007**: Each function must accept dependencies explicitly (supabase client) rather than capturing them from closures.
- **REQ-008**: No `any` types in production code.
- **CON-001**: Test files (`__tests__/*.test.ts`) must NOT be modified — they continue to test through the same exported interfaces.
- **CON-002**: File naming: `*.ts` with relative imports using `.js` extensions (ESM convention for Workers).
- **GUD-001**: Repository functions accept `supabase: ReturnType<typeof createSecretClient>` as first parameter.
- **GUD-002**: Service functions accept `supabase` first, then request-specific params, and return `{ data, error, meta }` or throw for non-recoverable errors.
- **GUD-003**: Router handlers are 3-10 lines: parse input, call service, return response.

## 4. Interfaces & Data Contracts

### Before (each domain)

```
auth/index.ts       (280 lines — routes + logic + queries mixed)
events/index.ts     (365 lines)
stores/index.ts     (320 lines)
tcgs/index.ts       (218 lines)
moderation/index.ts (231 lines)
tournaments/index.ts (506 lines)
notifications/index.ts (120 lines)
```

### After (each domain)

```
auth/
  index.ts          (1-3 lines re-exporting from ./router.js)
  router.ts         (thin Hono handlers)
  service.ts        (business logic, validation orchestration)
  repository.ts     (Supabase query functions)
```

### Export compatibility

| Domain        | Current exports                                | Re-exported unchanged                          |
| ------------- | ---------------------------------------------- | ---------------------------------------------- |
| auth          | `authRouter`                                   | `authRouter`                                   |
| events        | `eventRouter`                                  | `eventRouter`                                  |
| stores        | `storeRouter`                                  | `storeRouter`                                  |
| tcgs          | `tcgRouter`, `formatRouter`                    | `tcgRouter`, `formatRouter`                    |
| moderation    | `reportRouter`, `adminRouter`                  | `reportRouter`, `adminRouter`                  |
| tournaments   | `tournamentRouter`, `bracketMatchRouter`       | `tournamentRouter`, `bracketMatchRouter`       |
| notifications | `notificationRouter`, `pushSubscriptionRouter` | `notificationRouter`, `pushSubscriptionRouter` |

### Service pattern

```ts
// service.ts — example for events
export async function listEvents(
  supabase: ReturnType<typeof createSecretClient>,
  params: { type?: string; status?: string; tcgId?: string; cursor?: string; limit?: number },
): Promise<{ data: unknown[]; error: null; meta: { next_cursor: string | null; limit: number } }> {
  // ... business logic, calls repository ...
}
```

### Repository pattern

```ts
// repository.ts — example for events
export async function findEvents(
  supabase: ReturnType<typeof createSecretClient>,
  options: { ... },
): Promise<{ rows: unknown[]; hasMore: boolean }> {
  // ... pure Supabase query ...
}
```

## 5. Acceptance Criteria

- **AC-001**: Given all existing worker tests, when `pnpm test` is run, then all tests pass with the same count and coverage.
- **AC-002**: Given the Worker app bootstrap in `src/index.ts`, when it imports from each domain, then the same route exports are available at the same mount points.
- **AC-003**: Given any domain folder, when inspecting its structure, then `router.ts`, `service.ts`, and `repository.ts` exist and each file has a single responsibility.
- **AC-004**: Given the `tournaments/` domain, when `generateSingleEliminationBracket` is called during tournament start, then it behaves identically to before (same DB operations, same logic).
- **AC-005**: Given `pnpm lint` on the worker package, then no lint errors are reported.

## 6. Test Automation Strategy

- **No new tests** — this is a pure refactoring with zero behavioral change.
- All existing tests (70 worker tests) must continue to pass.
- Run `pnpm test` from the workspace root after the refactor.
- Run `pnpm lint` from the workspace root to verify no style/type regressions.

## 7. Rationale & Context

The current monolithic `index.ts` files violate the Single Responsibility Principle. A typical 300-line `index.ts` contains:

1. Route definitions (Hono decorators)
2. Request body parsing and Zod validation
3. Business logic (permissions, status transitions)
4. Database queries (Supabase chaining)
5. Error mapping to HTTP responses

This makes files hard to read, hard to test, and hard to modify — any change to DB schema, validation rules, or route structure touches the same file. The three-layer separation aligns with the DDD architecture already documented in AGENTS.md.

The `geocoding/` domain is intentionally left alone: at 74 lines and only 2 routes with straightforward fetch logic, splitting it would add ceremony without benefit.

## 8. Dependencies & External Integrations

- **Hono**: Route definitions remain in router.ts.
- **Supabase**: All DB access moves to repository.ts.
- **Zod**: Validation orchestration stays in service.ts.

## 9. Examples & Edge Cases

**Repository function signature** — all repository functions accept a supabase client:

```ts
// auth/repository.ts
export async function findAdminCount(supabase: ReturnType<typeof createSecretClient>) {
  const { count } = await supabase
    .from('users')
    .select('id', { count: 'exact', head: true })
    .eq('role', 'admin')
    .is('deleted_at', null);
  return count ?? 0;
}
```

**Service function signature** — orchestrates validation and repository calls:

```ts
// auth/service.ts
export async function checkOnboarding(supabase: ReturnType<typeof createSecretClient>) {
  const count = await findAdminCount(supabase);
  return { data: OnboardingStatusSchema.parse({ hasAdmin: count > 0 }), error: null, meta: null };
}
```

**Router handler** — thin delegation to service:

```ts
// auth/router.ts
authRouter.get('/onboarding', async (c) => {
  const supabase = createSecretClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);
  return c.json(await checkOnboarding(supabase));
});
```

**Edge case — rate-limit middleware**: Auth routes that use `rateLimitMiddleware` keep it in the route definition (router.ts), as it's a middleware concern, not business logic.

**Edge case — `Buffer` in events list**: The events list uses `Buffer` for cursor encoding (a known Workers compability issue). This stays as-is in the service layer; fixing it is out of scope.

## 10. Validation Criteria

1. `pnpm test` passes with 0 failures (worker tests).
2. `pnpm lint` passes with 0 errors.
3. No changes to `src/index.ts` (the entry point).
4. No changes to any `__tests__/*.test.ts` file.
5. Each domain has the files: `index.ts`, `router.ts`, `service.ts`, `repository.ts`.

## 11. Related Specifications / Further Reading

- `docs/requirements.md` — Project architecture documentation
- `AGENTS.md` — DDD layering description in "Project structure — monorepo with DDD worker" section
- `.agents/skills/tdd/` — TDD conventions
- `spec/spec-009-code-quality.md` — DRY test utilities and no-any rule
