---
title: Reject Banned Accounts at Login and During Active Sessions
version: 2.0
date_created: 2026-09-11
last_updated: 2026-09-11
tags: frontend, auth, bug, moderation
---

# Introduction

Banned accounts can complete sign-in and keep using the app: the frontend logs in through Supabase Auth directly (`supabase.auth.signInWithPassword`), which knows nothing about the application's `banned_at` column in the custom `users` table. A banned user receives a valid session, `useAuthStore.signIn` sets `user`, and the router guard (`router/guards.ts`) only checks that `user` exists — so the banned account can sign in **and** browse authenticated pages (Settings, Profile, create forms, etc.). The ban is only enforced by the Worker's `authMiddleware` per API call (`GET /api/auth/me` and every other authenticated route return **403 "Account is banned"**), but the frontend discards that error (`fetchProfile` only reads `data`) and never signs the session out.

This spec makes the frontend honor the Worker's authoritative ban/deletion signal in **both** places: (A) reject the account at the interactive login step, and (B) sign out an already-active banned session the moment any API call reports the rejection, redirecting to the login page with a localized "account was banned" message.

## 1. Purpose & Scope

Reject banned and deleted accounts at login, and invalidate their sessions during active use, surfacing a localized login error in both cases.

**In scope**

| Artifact                                              | Change                                                                                                                                                                                                            |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/authMessages.ts`                             | New — `ACCOUNT_BANNED_MESSAGE` / `ACCOUNT_DELETED_MESSAGE` constants (shared by `useApi`, `useAuthStore`, boot, and `LoginPage`; avoids the `useAuthStore → useApi` cycle)                                        |
| `src/stores/useAuthStore.ts`                          | `fetchProfile()` returns `{ data, error }`; `signIn()` rejects account-level rejections (sign out + throw the Worker's message); new `handleRejectedSession()` action signs out and clears state                  |
| `src/composables/useApi.ts`                           | Extract a shared `parseResponse`; when a response carries an account-level rejection (`error` === `'Account is banned'` or `'Account not found'`), invoke a module-level session-rejection handler (default null) |
| `src/boot/auth.ts`                                    | Register the session-rejection handler once: on rejection, sign out via `useAuthStore.handleRejectedSession()` and redirect to `/login?reason=banned                                                              | deleted` |
| `src/pages/auth/LoginPage.vue`                        | Map the ban/deleted Worker messages (from a thrown `signIn` error or the `reason` query param) to localized messages                                                                                              |
| `src/i18n/en-US/index.ts` + `src/i18n/pt-BR/index.ts` | Add `auth.banned` ('Your account has been banned' / 'Sua conta foi banida') and `auth.deleted` ('This account no longer exists' / 'Esta conta não existe mais')                                                   |
| Frontend tests                                        | `useAuthStore.test.ts` (mock `@/lib/supabase` + fetch), new `useApi.test.ts` (rejection handler), `LoginPage.test.ts` (localized ban error from thrown error and from `?reason=banned`)                           |

**Out of scope**

- Worker changes: `authMiddleware` already rejects banned (`forbidden(c, 'Account is banned')`) and deleted (`notFound(c, 'Account not found')`) users; `packages/worker/src/middleware/__tests__/auth.test.ts` locks the 403/404 behavior. No backend change.
- A dedicated Worker `POST /api/auth/login` endpoint — Supabase Auth owns credentials; the Worker never sees passwords. Rejected.
- Enforcing the ban inside Supabase Auth (requires auth hooks/custom flows; out of scope).
- i18n of other raw backend error strings surfaced in the UI (consistent with the deferred backfill in spec-077/078).
- Banning the account in real time on the server while a session is idle on a page that makes no API calls (there is no push notification; the ban is enforced on the next API interaction or navigation guard).

## 2. Definitions

- **Banned account**: a `users` row with `banned_at` set. Supabase Auth still issues sessions; the Worker rejects every authenticated API call with HTTP 403 `error: 'Account is banned'`.
- **Deleted account**: a `users` row with `deleted_at` set (soft delete); the Worker rejects with HTTP 404 `error: 'Account not found'`.
- **Account-level rejection**: an API response whose `error` is exactly `'Account is banned'` or `'Account not found'` (auth middleware only; unique strings across the API). Contrast: transient network failure (fetch rejects) — not an account-level rejection.
- **Session-rejection handler**: a module-level callback in `useApi.ts` (default null) invoked whenever any `api*` call observes an account-level rejection; the boot file registers it to sign out + redirect.

## 3. Requirements, Constraints & Guidelines

### Part A — login rejection (`useAuthStore`)

- **REQ-001**: `fetchProfile()` shall return `Promise<{ data: UserProfile | null; error: string | null }>`; `error` is non-null only on an account-level rejection from `/api/auth/me`. On network failure it returns `{ data: null, error: null }`.
- **REQ-002**: `signIn()` shall, after a successful Supabase sign-in, call `fetchProfile()`; on an account-level rejection it shall `await supabase.auth.signOut()`, clear `user`/`profile`, and `throw new Error(profileResult.error)`.
- **REQ-003**: `signIn()` for a valid account behaves as today; a transient network failure during the profile fetch does **not** reject the login.
- **REQ-004**: The stable Worker error strings live in `src/lib/authMessages.ts` (`ACCOUNT_BANNED_MESSAGE = 'Account is banned'`, `ACCOUNT_DELETED_MESSAGE = 'Account not found'`), consumed by `useApi`, `LoginPage`, and `boot/auth.ts` as a single source of truth.

### Part B — active-session invalidation (`useApi` + boot)

- **REQ-005**: `apiGet`/`apiPost`/`apiPatch`/`apiDelete` shall return the existing `{ data, error, meta }` envelope unchanged, but whenever a response `error` equals `ACCOUNT_BANNED_MESSAGE` or `ACCOUNT_DELETED_MESSAGE`, they shall invoke the registered session-rejection handler (no-op when none is registered).
- **REQ-006**: `useApi` exports `setSessionRejectedHandler(handler | null)` for registration.
- **REQ-007**: `src/boot/auth.ts` registers the handler once: on rejection it calls `useAuthStore().handleRejectedSession()` (signs out Supabase, clears `user`/`profile`) and navigates to `{ name: 'login', query: { reason: 'banned' | 'deleted' } }`.
- **REQ-008**: `handleRejectedSession()` in `useAuthStore` awaits `supabase.auth.signOut()` and nulls `user`/`profile`; it never throws.

### Login page

- **REQ-009**: When `signIn` rejects with `ACCOUNT_BANNED_MESSAGE` (Part A) or the route carries `query.reason === 'banned'` (Part B), the login error shows `$t('auth.banned')`; for `ACCOUNT_DELETED_MESSAGE` / `query.reason === 'deleted'`, it shows `$t('auth.deleted')`; any other error message is shown raw (current behavior).
- **REQ-010**: On mount, `LoginPage` reads `route.query.reason`; after displaying it, it clears the `reason` param via `router.replace` (no stale message on refresh/back).

### i18n

- **REQ-011**: Add `auth.banned` and `auth.deleted` to both `en-US` and `pt-BR` (`'Your account has been banned'`/`'Sua conta foi banida'`, `'This account no longer exists'`/`'Esta conta não existe mais'`).

### Constraints & guidelines

- **CON-001**: No Worker or shared-schema changes; the ban/deletion source of truth stays in the Worker middleware.
- **CON-002**: No production `any`; `strict` TS.
- **CON-003**: `useApi` must not import `useAuthStore` or the router (circular dependency: the store imports `useApi`). Decoupling happens via the registered handler.
- **GUD-001**: TDD — write tests first (RED), then implement (GREEN); keep every existing test green.
- **GUD-002**: Store seam: `vi.mock('@/lib/supabase', ...)`. API seam: `globalThis.fetch` stub. Boot seam: unit-test `setSessionRejectedHandler` wiring in `useApi.test.ts` and the handler behavior in the store/page tests.
- **GUD-003**: Credentials only ever go to Supabase Auth; the Worker never receives the password.

## 4. Interfaces & Data Contracts

### `useApi.ts` (rejection hook)

```ts
type ApiEnvelope = { data: unknown; error: string | null; meta: Record<string, unknown> | null };

let onSessionRejected: ((message: string) => void) | null = null;

export function setSessionRejectedHandler(handler: ((message: string) => void) | null): void {
  onSessionRejected = handler;
}

async function parseResponse(res: Response): Promise<ApiEnvelope> {
  const body = (await res.json()) as ApiEnvelope;
  if (body.error === ACCOUNT_BANNED_MESSAGE || body.error === ACCOUNT_DELETED_MESSAGE) {
    onSessionRejected?.(body.error);
  }
  return body;
}

export async function apiGet(path: string): Promise<ApiEnvelope> {
  const headers = await authHeaders();
  const res = await fetch(`${BASE_URL}${path}`, { headers });
  return parseResponse(res);
}
// apiPost / apiPatch / apiDelete: same, with their method/body — all route through parseResponse
```

### `src/lib/authMessages.ts` + `useAuthStore.ts` additions

```ts
// src/lib/authMessages.ts
export const ACCOUNT_BANNED_MESSAGE = 'Account is banned';
export const ACCOUNT_DELETED_MESSAGE = 'Account not found';

// src/stores/useAuthStore.ts
async function handleRejectedSession() {
  await supabase?.auth.signOut();
  user.value = null;
  profile.value = null;
}

// fetchProfile returns the envelope:
async function fetchProfile(): Promise<{ data: UserProfile | null; error: string | null }> {
  if (!supabase || !user.value) return { data: null, error: null };
  try {
    const json = (await apiGet('/api/auth/me')) as {
      data: UserProfile | null;
      error: string | null;
    };
    profile.value = json.data ?? null;
    return json;
  } catch {
    profile.value = null;
    return { data: null, error: null };
  }
}

// inside signIn, after user.value = data.user:
const profileResult = await fetchProfile();
if (profileResult.error) {
  await supabase.auth.signOut();
  user.value = null;
  profile.value = null;
  throw new Error(profileResult.error);
}
```

### `boot/auth.ts`

```ts
export default defineBoot(async ({ router }) => {
  const authStore = useAuthStore();
  setSessionRejectedHandler((message) => {
    const reason = message === ACCOUNT_BANNED_MESSAGE ? 'banned' : 'deleted';
    void authStore.handleRejectedSession().then(() => {
      void router.push({ name: 'login', query: { reason } });
    });
  });
  await authStore.restoreSession();
});
```

### `LoginPage.vue`

```ts
const { t } = useI18n();
// on mount:
onMounted(() => {
  if (route.query.reason === 'banned') {
    error.value = t('auth.banned');
    void router.replace({ query: { redirect: route.query.redirect } });
  } else if (route.query.reason === 'deleted') {
    error.value = t('auth.deleted');
    void router.replace({ query: { redirect: route.query.redirect } });
  }
});
// in catch:
} catch (e) {
  const message = e instanceof Error ? e.message : '';
  if (message === ACCOUNT_BANNED_MESSAGE) error.value = t('auth.banned');
  else if (message === ACCOUNT_DELETED_MESSAGE) error.value = t('auth.deleted');
  else error.value = message || 'Failed to sign in';
}
```

## 5. Acceptance Criteria

- **AC-001**: Given a banned user entering valid credentials, When `signIn` runs, Then Supabase `signInWithPassword` succeeds but the store calls `supabase.auth.signOut()`, nulls `user`/`profile`, and rejects with `'Account is banned'`.
- **AC-002**: Given `signIn` rejects with `'Account is banned'`, When the login page renders the error, Then the shown message is `$t('auth.banned')`.
- **AC-003**: Given a deleted account signing in, When `signIn` runs, Then the store signs out and rejects with `'Account not found'`; the page shows `$t('auth.deleted')`.
- **AC-004**: Given a valid account, When `signIn` runs and `/api/auth/me` returns a profile, Then `user`/`profile` are set, `signOut` is not called, and behavior is unchanged.
- **AC-005**: Given a valid account but a network failure on `/api/auth/me`, When `signIn` runs, Then login succeeds with `user` set and `profile` null.
- **AC-006**: Given a banned user with a persisted session, When the app boots, Then `restoreSession` signs out and `user` is null.
- **AC-007**: Given any authenticated `api*` call returning `{ error: 'Account is banned' }` with a registered handler, When the response is parsed, Then the handler is invoked with `'Account is banned'` and the call still returns the full envelope.
- **AC-008**: Given the handler registered in `boot/auth.ts`, When a banned response arrives during an active session, Then `handleRejectedSession()` signs out and the router navigates to `/login?reason=banned`.
- **AC-009**: Given `/login?reason=banned`, When the login page mounts, Then the error shows `$t('auth.banned')` and the `reason` param is cleared.
- **AC-010**: Given no handler registered (e.g. tests), When an `api*` call receives a banned response, Then behavior is unchanged (envelope returned, no crash).
- **AC-011**: Given the repository, When `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm knip`, `pnpm format:check` run, Then all pass.

## 6. Test Automation Strategy

- **Test Levels**: Unit tests for `useAuthStore`, `useApi` (rejection handler), and `LoginPage` (localized messages); existing worker middleware tests already lock the backend.
- **Frameworks**: Vitest + `@vue/test-utils`; `globalThis.fetch` stubbing; `vi.mock('@/lib/supabase', ...)` for the store; mocked store for the page.
- **Actions (TDD order)**:
  - RED: store tests (AC-001/003/004/005/006), `useApi` tests (AC-007/010), page tests (AC-002/009). Run → fail against the current code.
  - GREEN: implement `useApi` hook + `parseResponse`, `useAuthStore` changes, boot registration, `LoginPage` mapping, i18n keys.
  - Keep existing tests green (`useAuthStore` `checkOnboarding`; `LoginPage` existing cases; store/page suites).
- **Test Data Management**: mock `/api/auth/me` per case (`{ data: null, error: 'Account is banned' }`, `{ data: null, error: 'Account not found' }`, `{ data: profile }`, fetch rejection). `useApi.test.ts` asserts `setSessionRejectedHandler` round-trip and reset (`setSessionRejectedHandler(null)` in `afterEach`).
- **CI/CD Integration**: `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm knip`, `pnpm format:check` in the pre-push pipeline (unchanged).
- **Coverage Requirements**: keep `pnpm test:coverage` thresholds unchanged.

## 7. Rationale & Context

The Worker is already the authoritative gate: `authMiddleware` (`packages/worker/src/middleware/auth.ts:49-51`) rejects banned/deleted accounts on every authenticated call, and `packages/worker/src/middleware/__tests__/auth.test.ts` locks the 403/404 behavior. The client gap has two halves:

1. **Login** (`signIn`): it trusts the Supabase session without verifying the app account, and `fetchProfile` swallows the `/api/auth/me` error. Fixing this at the store is the correct layer — Supabase Auth owns credentials, so the only way to learn "this app account is banned" is to exchange the fresh session for `/api/auth/me` and honor its `error`.
2. **Active session**: even after the login fix, a user banned _while logged in_ (or via a persisted session) still has `user` set and passes the router guard (`router/guards.ts:18-21` only checks `auth.user`), so authenticated pages remain reachable. Since every authenticated page must fetch data to render, and the Worker returns the ban on every such call, intercepting the rejection at the `useApi` layer is the smallest complete enforcement point. The handler is decoupled via a registered callback to avoid the circular dependency (`useAuthStore` imports `useApi`).

Only the two exact account-level messages trigger the hook; other 403/404s (e.g. `'Store not found'`) are untouched. The `?reason=` query param lets the redirected login page display the same localized messages used by the interactive login rejection, and is cleared so it does not linger on refresh.

## 8. Dependencies & External Integrations

### External Systems

- **EXT-001**: Supabase Auth (`signInWithPassword`, `signOut`, `getSession`) — unchanged.
- **EXT-002**: Worker `GET /api/auth/me` and all authenticated routes — unchanged; already return the account-level rejection envelope.

### Third-Party Services

- **SVC-001**: None.

### Infrastructure Dependencies

- **INF-001**: None.

### Data Dependencies

- **DAT-001**: `users.banned_at` / `users.deleted_at` — read-only via the Worker; no schema change.

### Technology Platform Dependencies

- **PLT-001**: Vue 3, Pinia setup store, Vue Router, vue-i18n, Quasar boot files, Vitest, `@supabase/supabase-js`.

### Compliance Dependencies

- **COM-001**: None.

## 9. Examples & Edge Cases

```ts
// Part A — banned user signs in
const { data, error } = await supabase.auth.signInWithPassword({ email, password });
if (error) throw error;                       // credentials valid
user.value = data.user;
const profileResult = await fetchProfile();   // { data: null, error: 'Account is banned' }
if (profileResult.error) {
  await supabase.auth.signOut();              // revoke fresh session
  user.value = null;
  profile.value = null;
  throw new Error(profileResult.error);       // LoginPage shows $t('auth.banned')
}

// Part B — banned user already active, any API call
apiGet('/api/events')                         // Worker → 403 { error: 'Account is banned' }
  → parseResponse invokes onSessionRejected('Account is banned')
  → boot handler: handleRejectedSession() + router.push('/login?reason=banned')
  → LoginPage onMounted: error = t('auth.banned'); router.replace clears ?reason
```

Edge cases:

- **Network failure on `/api/auth/me`** during login: `fetchProfile` returns `error: null`; login proceeds with `profile` null (transient case; the next API call still triggers Part B if banned).
- **Deleted account**: both paths use `'Account not found'` → `auth.deleted`.
- **Persisted session at boot**: `restoreSession` signs out when `profile` is null (existing behavior, guarded by AC-006).
- **Non-auth 404s** (`'Store not found'`, `'User not found'`): do not match the account-level messages → handler not invoked.
- **No handler registered** (tests, SSR): the hook is a no-op; envelopes flow through unchanged.
- **User banned on a page with no API calls**: enforced on the next API interaction or navigation to an authenticated page (documented limit).

## 10. Validation Criteria

- `pnpm test` passes — new store/API/page tests (RED→GREEN) and the full suite.
- `pnpm lint`, `pnpm typecheck`, `pnpm knip`, `pnpm format:check` pass.
- `auth.banned` / `auth.deleted` present in both locales.
- Manual: ban a user via `/api/admin/users/:id/ban`, then (a) attempt login → "Sua conta foi banida"; (b) with an active session, any navigation that hits the API signs the session out and lands on `/login?reason=banned` showing the message; (c) with a persisted session, boot signs out.
- `CHANGELOG.md` notes the fix.

## 11. Related Specifications / Further Reading

- `spec-069-audit-remediation-p0.md` — authorization hardening context (banned-user middleware)
- `spec-011-moderation-api.md` — ban/unban endpoints
- `docs/requirements.md` — NFR-28e (i18n completeness)
- `packages/worker/src/middleware/__tests__/auth.test.ts` — existing banned → 403 / deleted → 404 tests (locked)
- Supabase Auth: https://supabase.com/docs/reference/javascript/auth-signinwithpassword
- Vue Router guards: https://router.vuejs.org/guide/advanced/navigation-guards.html
- Supabase custom `users` table and ban columns: `docs/data-model.md`
