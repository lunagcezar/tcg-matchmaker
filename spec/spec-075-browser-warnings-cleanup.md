---
title: Clean Up Browser Console Warnings (Vue Router `next()` + Multiple GoTrueClient Instances)
version: 1.0
date_created: 2026-09-11
tags: frontend, refactor, vue-router, supabase, warnings
---

# Introduction

The frontend emits three warnings in the browser console during normal navigation and startup:

1. `[Vue Router warn]: The next() callback in navigation guards is deprecated. Return the value instead of calling next(value).` (appears twice — one per guarded navigation path)
2. `Multiple GoTrueClient instances detected in the same browser context. It is not an error, but this should be avoided as it may produce undefined behavior when used concurrently under the same storage key.` (from `GoTrueClient` v2.110.3)

This spec eliminates both root causes so the console is clean and runtime behavior matches the recommended library usage. No user-facing behavior changes.

## 1. Purpose & Scope

Remove the deprecated Vue Router navigation-guard `next()` callback pattern and eliminate the duplicate Supabase `createClient` instantiation.

**In scope**

- Rewrite `Router.beforeEach` in `src/router/index.ts` to return values instead of calling `next(value)`.
- Remove the duplicate `createClient(...)` call in `src/stores/useNotificationStore.ts` and reuse the shared client from `src/lib/supabase.ts`.
- Add regression tests covering both fixes.
- Docs (`docs/pages.md` / `docs/requirements.md`) update only if component structure or requirements change (expected: none beyond any router-guard module addition).

**Out of scope**

- Any change to authentication, onboarding, or role-guard behavior.
- Any change to notification Realtime subscription logic beyond the client source.
- Other console messages not listed in the Introduction (e.g. analytics, third-party devtools logs).
- Upgrading `vue-router` or `@supabase/supabase-js` versions.

## 2. Definitions

- **Navigation guard**: A Vue Router `beforeEach` hook that runs before every route resolution.
- **`next()` callback**: The legacy third argument of a navigation guard, used to signal success or redirect. Deprecated in `vue-router` v5 in favor of returning a value (`true`, `false`, a `RouteLocationRaw`, or `undefined`).
- **GoTrueClient**: Supabase's Auth client singleton created internally by `createClient(...)` from `@supabase/supabase-js`. Supabase warns when more than one instance is created in the same browser context because both share the same `sb-localhost-auth-token` storage key.
- **Shared supabase client**: The single client exported from `src/lib/supabase.ts`, already consumed by `useAuthStore`, `useApi`, and the `supabase` boot file.

## 3. Requirements, Constraints & Guidelines

### Vue Router guard (`src/router/index.ts`)

- **REQ-001**: The `beforeEach` guard shall not call the `next` callback anywhere. All outcomes must be expressed as return values:
  - allow navigation: `return true` (or return `undefined` at the end of the function);
  - redirect to onboarding: `return { name: 'onboarding' }`;
  - redirect to login: `return { name: 'login', query: { redirect: to.fullPath } }`;
  - redirect to home: `return { name: 'home' }`.
- **REQ-002**: The guard shall remain `async` and preserve the existing guard ordering: onboarding redirect → auth check → admin guard.
- **REQ-003**: The guard logic may be extracted to a standalone exported module (e.g. `src/router/guards.ts`) to make it unit-testable without mounting the router. If extracted, `src/router/index.ts` shall only wire `Router.beforeEach(routerGuard)`.
- **REQ-004**: No route definitions (`src/router/routes.ts`) shall change.
- **GUD-001**: Use `NavigationGuardReturn` (or `RouteLocationRaw`/`boolean`) as the guard's return type — no `any`.

### Duplicate Supabase client (`src/stores/useNotificationStore.ts`)

- **REQ-005**: `useNotificationStore` shall import the shared client from `@/lib/supabase` instead of calling `createClient(...)`.
- **REQ-006**: After the change, `createClient(` shall appear in exactly one frontend source file (`src/lib/supabase.ts`).
- **REQ-007**: Realtime subscribe/unsubscribe behavior shall be unchanged, including the `!supabase` null guard (the shared client may be `null` when env vars are absent).
- **GUD-002**: Remove the now-unused `createClient` import and the module-level env-var reads (`QCLI_SUPABASE_URL`, `QCLI_SUPABASE_PUBLISHABLE_KEY`) from `useNotificationStore.ts`; keep `RealtimeChannel` type import.

### General

- **CON-001**: No behavior change for authentication, onboarding flow, admin checks, or notification delivery.
- **CON-002**: Do not suppress warnings via `console.warn` overrides or eslint-disable.

## 4. Interfaces & Data Contracts

### Router guard signature (if extracted to `src/router/guards.ts`)

```ts
import type { NavigationGuard, RouteLocationNormalized } from 'vue-router';

export const routerGuard: NavigationGuard = async (to, from) => {
  // returns true | false | { name: 'onboarding' } | { name: 'login', query } | { name: 'home' } | undefined
};
```

In `src/router/index.ts`:

```ts
import { routerGuard } from './guards';
// ...
Router.beforeEach(routerGuard);
```

### Supabase client reuse (`src/stores/useNotificationStore.ts`)

```ts
// before
import { createClient } from '@supabase/supabase-js';
const supabaseUrl = import.meta.env.QCLI_SUPABASE_URL;
const supabaseKey = import.meta.env.QCLI_SUPABASE_PUBLISHABLE_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// after
import { supabase } from '@/lib/supabase';
```

`subscribeRealtime` and `unsubscribeRealtime` continue to reference the local `supabase` binding.

## 5. Acceptance Criteria

- **AC-001**: Given `src/router/index.ts` (and `src/router/guards.ts` if extracted), When searched for `next(`, Then no match exists.
- **AC-002**: Given the router guard, When navigating to a route with `meta.requiresAuth` while logged out, Then the guard returns `{ name: 'login', query: { redirect: to.fullPath } }` (previously `next({ name: 'login', query: ... })`) and the app redirects to login exactly as before.
- **AC-003**: Given the router guard, When navigating to a route with `meta.requiresAdmin` while logged out, Then the guard returns `{ name: 'login' }` and the app redirects to login.
- **AC-004**: Given the router guard, When an admin-role user navigates to an admin route, Then the guard allows navigation (`true`/`undefined`) and the page renders.
- **AC-005**: Given the router guard, When a user with a pending onboarding navigates to a non-onboarding, non-auth route, Then the guard returns `{ name: 'onboarding' }` and the app redirects to onboarding.
- **AC-006**: Given the frontend source, When searched for `createClient(`, Then it appears exactly once, in `src/lib/supabase.ts`.
- **AC-007**: Given the app running against a local Supabase stack, When the frontend loads and notifications subscribe, Then the console shows no `Multiple GoTrueClient instances detected` warning.
- **AC-008**: Given a navigation session, When the app loads and navigates across guarded routes, Then the console shows no `The next() callback in navigation guards is deprecated` warning.
- **AC-009**: Given Realtime is disabled (shared client `null`), When `subscribeRealtime(userId)` is called, Then it returns without throwing, as today.

## 6. Test Automation Strategy

- **Test Levels**: Unit (guard logic, client singleton invariant); manual smoke check for console output.
- **Frameworks**: Vitest + `@vue/test-utils` (existing frontend test stack).
- **Actions**:
  - Add `src/router/__tests__/guards.test.ts` exercising the guard directly with mocked `useAuthStore`/`useApi`:
    - logged out + `requiresAuth` → returns login redirect with `redirect` query;
    - logged out + `requiresAdmin` → returns login redirect;
    - admin role via `/api/auth/me` → allows;
    - pending onboarding → returns onboarding redirect;
    - non-admin role on admin route → returns home redirect.
  - Add a source-invariant regression test asserting `createClient(` appears exactly once across frontend `src` (excluding `node_modules`), failing before the `useNotificationStore` change and passing after.
  - Existing router tests (`src/router/__tests__/navItems.test.ts`) must continue to pass.
- **Test Data Management**: Mock `useAuthStore` (user set/unset) and `apiGet` (role payload) via Vitest `vi.mock`.
- **CI/CD Integration**: `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm knip`, `pnpm format:check` in the pre-push pipeline.
- **Manual verification**: run `pnpm dev`, open the app, confirm the three reported warnings no longer appear in the browser console.

## 7. Rationale & Context

`vue-router` v5.0.6 deprecates the `next()` callback; the emitted warning fires on every guarded navigation. Returning values from guards is the documented replacement and requires no behavioral change since each `next(x)` in the existing guard maps 1:1 to `return x`.

The `Multiple GoTrueClient instances` warning comes from two `createClient` calls creating two GoTrueClient singletons that both write to the same `sb-localhost-auth-token` localStorage key: `src/lib/supabase.ts` (the canonical client) and `src/stores/useNotificationStore.ts` (a private copy for Realtime). `useAuthStore`, `useApi`, and the boot file already share the canonical client; the notification store is the only outlier. Reusing the shared client is a DRY fix that removes the warning and the storage-key contention it warns about.

## 8. Dependencies & External Integrations

### External Systems

- **EXT-001**: None. Frontend-only change.

### Third-Party Services

- **SVC-001**: None.

### Infrastructure Dependencies

- **INF-001**: None.

### Data Dependencies

- **DAT-001**: None.

### Technology Platform Dependencies

- **PLT-001**: Vue 3 + `vue-router` v5 (deprecates `next`), `@supabase/supabase-js` v2.110.x (GoTrueClient singleton).

### Compliance Dependencies

- **COM-001**: None.

## 9. Examples & Edge Cases

### Guard return mapping (exhaustive)

| Current code                                                 | Replacement                                                   |
| ------------------------------------------------------------ | ------------------------------------------------------------- |
| `next();` (onboarding-required route)                        | `return;` (allow)                                             |
| `next({ name: 'onboarding' });`                              | `return { name: 'onboarding' };`                              |
| `next({ name: 'login', query: { redirect: to.fullPath } });` | `return { name: 'login', query: { redirect: to.fullPath } };` |
| `next({ name: 'login' });`                                   | `return { name: 'login' };`                                   |
| `next({ name: 'home' });`                                    | `return { name: 'home' };`                                    |
| `next();` (fall-through)                                     | `return;` (undefined ⇒ allow)                                 |

Edge cases:

- The guard is `async`; returning a promise that resolves to a `RouteLocationRaw`/boolean is fully supported by `vue-router`.
- `meta.requiresOnboarding` routes must still be allowed through (early `return`) before the auth check.
- The `redirect` query on the login redirect must be preserved exactly (`to.fullPath`).
- `supabase` shared client may be `null` when env vars are unset; `subscribeRealtime` must keep its existing null guard.

## 10. Validation Criteria

- `pnpm test` passes (new guard tests + client-invariant test + existing router/notification tests).
- `pnpm lint` and `pnpm typecheck` pass (no unused `createClient` import, no `any`).
- `pnpm knip` reports no dead exports after removing the duplicate client code.
- `pnpm format:check` passes.
- Manual: the three warnings in the Introduction no longer appear in the browser console under `pnpm dev`.

## 11. Related Specifications / Further Reading

- `spec-070-audit-remediation-p1.md` — introduced the frontend DRY/quality guidelines this fix follows
- `docs/pages.md` — router and layout structure
- Vue Router deprecation: `next()` callback — https://router.vuejs.org/guide/advanced/navigation-guards.html#global-before-guards
- Supabase warning reference: https://supabase.com/docs/reference/javascript/initializing
