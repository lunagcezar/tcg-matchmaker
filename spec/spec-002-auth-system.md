---
title: Auth System — Supabase Integration, JWT Middleware, Profile & Account Management
version: 1.0
date_created: 2026-07-14
tags: auth, middleware, api, backend
---

# Introduction

This specification defines the authentication and user management system for the TCG Matchmaker Worker. It covers the Supabase client integration in the Worker, JWT verification middleware, and all auth-related API routes (profile, account management, onboarding, data export).

## 1. Purpose & Scope

**Purpose:** Implement the Worker-side auth infrastructure so that subsequent specs can rely on authenticated user context in every request.

**Scope:**

- `@supabase/supabase-js` integration in the Worker (secret key for DB, publishable key for JWT verify)
- JWT verification middleware that extracts user identity and checks banned status
- Auth API domain routes (profile CRUD, account deletion, suspension, data export, onboarding)
- Updated shared Zod schemas for auth-related request/response types

**Out of scope:**

- Frontend signup/login UI (done via Supabase Auth directly)
- Turnstile CAPTCHA integration (covered in a separate spec)
- Rate limiting middleware (covered in a separate spec)
- Supabase Auth triggers (webhooks, email templates)

## 2. Definitions

| Term            | Definition                                                                           |
| --------------- | ------------------------------------------------------------------------------------ |
| Secret key      | `sb_secret_...` — Supabase API key used by Hono for all DB operations (bypasses RLS) |
| Publishable key | `sb_publishable_...` — Supabase API key used by frontend for Auth only               |
| JWT             | JSON Web Token issued by Supabase Auth after sign-in                                 |
| Onboarding      | First-run flow that creates the initial admin user when no users exist               |

## 3. Requirements, Constraints & Guidelines

### Supabase Client (`@supabase/supabase-js`)

- **DB-001**: Worker must create a Supabase client using `SUPABASE_URL` + `SUPABASE_SECRET_KEY` for all database operations.
- **DB-002**: Worker must NOT use the secret-key client for JWT verification — use `auth.getUser()` with the JWT from the request header instead.
- **DB-003**: The Supabase client factory must be a single reusable function in `packages/worker/src/db/client.ts`.

### Auth Middleware

- **AUTH-001**: Every authenticated route must verify the JWT via `supabase.auth.getUser(token)`.
- **AUTH-002**: If the JWT is missing, malformed, or expired, return `401 { data: null, error: "Unauthorized", meta: null }`.
- **AUTH-003**: After JWT verification, look up the user in `public.users`. If the user has `banned_at` set, return `403 { data: null, error: "Account is banned", meta: null }`.
- **AUTH-004**: The authenticated user context (`userId`, `role`, `username`) must be available as `c.var.user` in downstream handlers.
- **AUTH-005**: The middleware must be usable as both a global guard and per-route guard.

### Auth Routes

- **ROUTE-001**: `GET /api/auth/me` — Returns the current authenticated user's full profile. Uses `UserResponseSchema`.
- **ROUTE-002**: `PATCH /api/auth/profile` — Updates `display_name`. Validates with `ProfileUpdateSchema`. Returns updated profile.
- **ROUTE-003**: `GET /api/auth/onboarding` — Returns `{ hasAdmin: boolean }`. Checks if any `public.users` record has `role = 'admin'`.
- **ROUTE-004**: `POST /api/auth/onboarding` — Creates the first admin. Validates with `SignupSchema`. Rejected with `400` if an admin already exists. Creates Supabase Auth user, then creates `public.users` record with `role = admin`, then records consent.
- **ROUTE-005**: `POST /api/auth/export` — Returns all user personal data as JSON (profile, consents, event participation history).
- **ROUTE-006**: `POST /api/auth/suspend` — Sets `suspended_at` on the current user. Igempotent (re-suspending is a no-op).
- **ROUTE-007**: `DELETE /api/auth/account` — Deletes account. Last admin protection: if user is the only admin remaining, return `400 "Promote another admin before deleting your account"`. Otherwise: delete Supabase Auth user, anonymize `public.users`, set `deleted_at`. Returns `200 { data: null, error: null, meta: null }`.

### Shared Schemas

- **SCH-001**: Add `OnboardingStatusSchema` — `{ hasAdmin: boolean }`
- **SCH-002**: Update `UserSchema` to match the full `public.users` columns (all nullable fields preserved)
- **SCH-003**: Add `UserResponseSchema` — full profile response excluding sensitive fields
- **SCH-004**: Add `AccountResponseSchema` — generic `{ success: boolean }` for delete/suspend responses

### Error Handling

- **ERR-001**: All auth routes must return the standard `{ data, error, meta }` response format.
- **ERR-002**: Validation errors (Zod) must return `400` with details.
- **ERR-003**: Resource-not-found errors must return `404`.
- **ERR-004**: Server errors must return `500`.

## 4. Interfaces & Data Contracts

### API Routes

| Method   | Path                   | Auth     | Request Body          | Response                                             |
| -------- | ---------------------- | -------- | --------------------- | ---------------------------------------------------- |
| `GET`    | `/api/auth/me`         | Required | —                     | `UserResponseSchema`                                 |
| `PATCH`  | `/api/auth/profile`    | Required | `ProfileUpdateSchema` | `UserResponseSchema`                                 |
| `GET`    | `/api/auth/onboarding` | No       | —                     | `OnboardingStatusSchema`                             |
| `POST`   | `/api/auth/onboarding` | No       | `SignupSchema`        | `UserResponseSchema`                                 |
| `POST`   | `/api/auth/export`     | Required | —                     | `UserDataExportSchema` (profile + consents + events) |
| `POST`   | `/api/auth/suspend`    | Required | —                     | `AccountActionResponseSchema`                        |
| `DELETE` | `/api/auth/account`    | Required | —                     | `AccountActionResponseSchema`                        |

### Auth Middleware Context

```typescript
// Added to Hono's Variables via c.set / c.var
type AuthUser = {
  id: string;
  email: string;
  username: string;
  role: 'player' | 'organizer' | 'admin';
};
```

### Route Registration

```typescript
// In worker/src/index.ts
import { authRouter } from './auth/index.js';

app.route('/api/auth', authRouter);
```

### Supabase Client

```typescript
// worker/src/db/client.ts
import { createClient } from '@supabase/supabase-js';

export function createSecretClient(url: string, secretKey: string) {
  return createClient(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
```

### Updated Shared Schemas

```typescript
// Add to shared/src/schemas/user.ts
export const OnboardingStatusSchema = z.object({
  hasAdmin: z.boolean(),
});

export const UserResponseSchema = z.object({
  id: z.string().uuid(),
  username: z.string(),
  display_name: z.string(),
  role: z.enum(['player', 'organizer', 'admin']),
  avatar_path: z.string().nullable(),
  banned_at: z.string().datetime().nullable(),
  suspended_at: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
});

export const AccountActionResponseSchema = z.object({
  success: z.boolean(),
});
```

## 5. Acceptance Criteria

- **AC-001**: `GET /api/auth/me` returns 401 when no JWT is provided.
- **AC-002**: `GET /api/auth/me` returns the user profile when a valid JWT is provided.
- **AC-003**: `GET /api/auth/onboarding` returns `{ hasAdmin: false }` when no admin exists.
- **AC-004**: `POST /api/auth/onboarding` with valid data creates a user with role `admin`.
- **AC-005**: `POST /api/auth/onboarding` returns 400 if an admin already exists.
- **AC-006**: `DELETE /api/auth/account` anonymizes the user and sets `deleted_at`.
- **AC-007**: `DELETE /api/auth/account` returns 400 if the user is the only remaining admin.
- **AC-008**: `POST /api/auth/suspend` sets `suspended_at` on the current user.
- **AC-009**: `PATCH /api/auth/profile` updates `display_name`.
- **AC-010**: `POST /api/auth/export` returns JSON with user data.
- **AC-011**: All routes return the standard `{ data, error, meta }` response format.
- **AC-012**: All routes validate input with Zod schemas and return 400 on invalid input.
- **AC-013**: Worker TypeScript compiles without errors (`pnpm -F @tcg/worker exec tsc --noEmit`).
- **AC-014**: Shared package TypeScript compiles without errors.

## 6. Test Automation Strategy

- **Test Levels**: Unit tests for middleware, integration tests for routes.
- **Frameworks**: Vitest + `@cloudflare/vitest-pool-workers` for Worker route testing.
- **Seams**: Mock `@supabase/supabase-js` client for middleware tests; use Miniflare bindings for route tests.
- **Coverage**: All auth routes must have at least one success and one error test case.

## 7. Rationale & Context

- **Two clients, not one**: The Worker needs the secret key client for DB operations (insert/update/delete). But for JWT verification, calling `auth.getUser()` with the request's JWT is the correct approach — it lets Supabase verify the token server-side.
- **No session persistence**: The secret-key client explicitly disables `autoRefreshToken` and `persistSession` because it never manages user sessions — it only performs admin-level DB operations.
- **Onboarding as a Worker route**: The onboarding page checks `GET /api/auth/onboarding` to decide whether to show the setup form. `POST /api/auth/onboarding` creates the Auth user and the DB record in one atomic flow.
- **Account deletion via Worker**: Deleting a Supabase Auth user requires the secret key (admin-level API). The frontend publishable key cannot delete users. This makes the Worker the natural place for account management.

## 8. Dependencies & External Integrations

### External Systems

- **EXT-001**: Supabase Auth — JWT issuance and verification via `auth.getUser()`.
- **EXT-002**: Supabase Database — `public.users` and `public.consents` tables for profile and consent storage.

### Third-Party Services

- **SVC-001**: Supabase — managed PostgreSQL + Auth. Secret key required for admin operations.

### Infrastructure Dependencies

- **INF-001**: Cloudflare Workers runtime — Workers-specific crypto APIs for JWT verification.
- **INF-002**: `@supabase/supabase-js` v2 — JS client for Supabase Auth and Database.

## 9. Examples & Edge Cases

### JWT Verification Middleware

```typescript
// Expected flow
const authHeader = c.req.header('Authorization');
if (!authHeader?.startsWith('Bearer ')) {
  return c.json({ data: null, error: 'Unauthorized', meta: null }, 401);
}
const token = authHeader.slice(7);
const {
  data: { user },
  error,
} = await supabase.auth.getUser(token);
if (error || !user) {
  return c.json({ data: null, error: 'Unauthorized', meta: null }, 401);
}
```

### Last Admin Protection

```typescript
// Before deleting the user's Auth account
const { count } = await supabase
  .from('users')
  .select('id', { count: 'exact', head: true })
  .eq('role', 'admin')
  .is('deleted_at', null);
if (count === 1 && user.role === 'admin') {
  return c.json(
    { data: null, error: 'Promote another admin before deleting your account', meta: null },
    400,
  );
}
```

### Onboarding Guard

```typescript
// POST /api/auth/onboarding
const { count } = await supabase
  .from('users')
  .select('id', { count: 'exact', head: true })
  .eq('role', 'admin')
  .is('deleted_at', null);
if (count > 0) {
  return c.json({ data: null, error: 'Admin already exists', meta: null }, 400);
}
```

## 10. Validation Criteria

- `pnpm install` succeeds at root.
- `pnpm -F @tcg/worker exec tsc --noEmit` passes.
- `pnpm -F @tcg/shared exec tsc --noEmit` passes.
- `pnpm -F @tcg/frontend exec quasar build` passes (ensures shared schema changes are compatible).
- All routes in the auth domain return consistent `{ data, error, meta }` envelope.

## 11. Related Specifications / Further Reading

- `docs/requirements.md` — FR-01 to FR-10 (Auth & Profile requirements)
- `docs/use-cases.md` — UC-01, UC-02, UC-03, UC-25, UC-26, UC-32, UC-33, UC-34
- `docs/data-model.md` — Users and Consents tables
- `spec/spec-001-project-infrastructure.md` — Foundation that spec-002 builds on
- `AGENTS.md` — Auth flow documentation (API Conventions section)
- `@supabase/supabase-js` docs: https://supabase.com/docs/reference/javascript
