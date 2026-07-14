# Plan — spec-002: Auth System

## Summary

Implement the Worker-side auth infrastructure: Supabase client factory, JWT verification middleware, and all auth-domain API routes (profile CRUD, onboarding, account management, data export).

## Implementation Order

```
         ┌─────────────────┐
         │  Shared schemas │  (1) Add OnboardingStatusSchema, UserResponseSchema,
         │  (no deps)      │      AccountActionResponseSchema
         └────────┬────────┘
                  │
                  ▼
         ┌─────────────────┐
         │  @supabase/supabase-js │  (2) Add dependency to worker package.json
         │  dependency       │      pnpm install
         └────────┬────────┘
                  │
          ┌───────┴───────┐
          ▼               ▼
   ┌────────────┐  ┌────────────────┐
   │ db/client  │  │ auth middleware│  (3) DB client factory
   │ (factory)  │  │                │  (4) JWT verify + banned check
   └─────┬──────┘  └────────┬───────┘
         │                  │
         └───────┬──────────┘
                 ▼
         ┌────────────────┐
         │  Auth routes   │  (5) GET /api/auth/me
         │  (auth/index)  │      PATCH /api/auth/profile
         │                │      GET /api/auth/onboarding
         │                │      POST /api/auth/onboarding
         │                │      POST /api/auth/export
         │                │      POST /api/auth/suspend
         │                │      DELETE /api/auth/account
         └───────┬────────┘
                 ▼
         ┌────────────────┐
         │  Mount in app  │  (6) app.route("/api/auth", authRouter)
         │  index.ts      │
         └────────────────┘
```

## Parallelizable Blocks

| Block | Items | Dependencies |
|-------|-------|-------------|
| A | Shared schema updates | None |
| B | Worker dependency + install | A (schemas referenced by routes) |
| C | DB client + auth middleware | B (uses supabase-js) |
| D | Auth routes | A + C |
| E | Mount routes in index.ts | D |

Blocks A can start immediately. B follows A. C follows B. D follows C. E follows D.

## Technical Decisions

1. **Supabase client factory**: Single factory function `createSecretClient` that takes URL + key. Separate function `createAuthClient` for JWT verification using the publishable key.
2. **Middleware architecture**: One composable middleware function `authMiddleware` that both verifies JWT and checks the ban status. Uses `c.set("user", ...)` to pass user context.
3. **Route organization**: All auth routes in `packages/worker/src/auth/index.ts` using `Hono().route()` pattern. Each handler is a standalone function or inline.
4. **Error responses**: Consistent `{ data, error, meta }` envelope. Zod errors formatted as `{ data: null, error: "Validation failed: field: message", meta: null }`.
5. **Onboarding flow**: GET checks admin existence (COUNT query). POST creates Supabase Auth user via `supabase.auth.admin.createUser()`, then inserts into `public.users`, then inserts consent.
6. **Account deletion**: Uses `supabase.auth.admin.deleteUser()` for the Auth user, then UPDATE on `public.users` for anonymization.

## Concrete File List

### Modified files

| File | Change |
|------|--------|
| `packages/worker/package.json` | Add `@supabase/supabase-js` dependency |
| `packages/worker/src/index.ts` | Import and mount auth router |
| `packages/shared/src/schemas/user.ts` | Add onboarding/response schemas + types |

### New files

| File | Purpose |
|------|---------|
| `packages/worker/src/db/client.ts` | Supabase client factories (secret + auth) |
| `packages/worker/src/middleware/auth.ts` | JWT verification + banned check middleware |
| `packages/worker/src/auth/index.ts` | All auth routes mounted under `/api/auth` |

## Acceptance Criteria Check

| AC | How to verify |
|----|--------------|
| AC-001 to AC-012 | Via Vitest route tests with mocked Supabase client |
| AC-013 | `pnpm -F @tcg/worker exec tsc --noEmit` |
| AC-014 | `pnpm -F @tcg/shared exec tsc --noEmit` |
