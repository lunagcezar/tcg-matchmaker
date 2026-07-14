# Plan — spec-005: Test Backfill & TDD Infrastructure

## Summary

Set up Vitest for the worker package, create test utilities, and write tests for all existing middleware and routes. Tests use mocked Supabase client and exercise Hono routes via `app.request()`.

## Implementation Order

```
         ┌───────────────────────────────┐
         │  Vitest config + test deps    │  (1) vitest.config.ts
         │  + helpers + mocks            │      test/helpers.ts, test/mocks.ts
         └───────────────┬───────────────┘
                         │
         ┌───────────────▼───────────────┐
         │  Middleware tests             │  (2) auth.test.ts, admin.test.ts
         │  (auth + admin)               │
         └───────────────┬───────────────┘
                         │
         ┌───────────────▼───────────────┐
         │  Auth route tests             │  (3) Tests for all 7 routes
         │  (7 routes, 14+ cases)        │
         └───────────────┬───────────────┘
                         │
         ┌───────────────▼───────────────┐
         │  TCG route tests             │  (4) Tests for all CRUD + formats
         │  (10+ cases)                  │
         └───────────────────────────────┘
```

## Parallelizable Blocks

| Block | Items | Dependencies |
|-------|-------|-------------|
| A | Vitest config + test helpers | None |
| B | Middleware tests | A |
| C | Auth route tests | A |
| D | TCG route tests | A |

Blocks C and D can run in parallel after A. B is simpler and can be done alongside C/D.

## Seams & Mocking Strategy

**Mock `@supabase/supabase-js` entirely.** The worker code calls `createSecretClient(url, key)` which returns a Supabase client. We mock the module so that `createClient()` returns a mock object with:

- `auth.getUser()` — returns `{ data: { user }, error: null }` or throws
- `from().select().eq().single()` — returns mock data
- `from().insert().select().single()` — returns mock data
- `from().update().eq().select().single()` — returns mock data

The mock returns different data based on test setup (via `vi.mocked().mockImplementation` or a mutable mock store).

**Do NOT mock `c.var.user`** — the auth middleware sets it; tests for admin middleware and routes should set it via the middleware chain or by injecting it before the route handler.

## Concrete File List

### New files

| File | Purpose |
|------|---------|
| `packages/worker/vitest.config.ts` | Vitest config (no Workers pool needed for unit tests) |
| `packages/worker/test/helpers.ts` | `createMockSupabase()`, `createTestApp()` |
| `packages/worker/test/mocks.ts` | `mockUser`, `mockTcg`, `mockFormat` data factories |
| `packages/worker/src/middleware/__tests__/auth.test.ts` | Auth middleware tests |
| `packages/worker/src/middleware/__tests__/admin.test.ts` | Admin middleware tests |
| `packages/worker/src/auth/__tests__/index.test.ts` | Auth route tests |
| `packages/worker/src/tcgs/__tests__/index.test.ts` | TCG + format route tests |

### Modified files

| File | Change |
|------|--------|
| `packages/worker/package.json` | Update `test` script (already points to vitest) |
