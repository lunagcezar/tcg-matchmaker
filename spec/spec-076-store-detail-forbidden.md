---
title: Fix 403 Forbidden on Store Detail Page — Restrict the Members Card to Store Members
version: 2.0
date_created: 2026-09-11
last_updated: 2026-09-11
tags: frontend, worker, bug, authorization, stores
---

# Introduction

Visiting a store detail page (`/stores/:id`) triggers a **403 Forbidden** response. The public store profile page renders a "Members" (store team) card and fetches it from `GET /api/stores/:id/members`, but that endpoint is private by design: it returns the roster only to store members (owner/manager/staff), and 401 to anonymous callers. The frontend requests it unconditionally, so every non-member (and anonymous visitor) is denied.

The correct fix is to keep the members list **private** — as the original API contract (`spec-006`, REQ-008 "owner/manager only") intended — and make the frontend stop asking for it on the public page unless the viewer is a member (or an admin). This eliminates the 403 entirely (non-members never call the endpoint) without exposing the team roster publicly.

## 1. Purpose & Scope

Keep `GET /api/stores/:id/members` member-only, add an admin bypass so the admin store page keeps working, expose a `viewer_role` field on the public store detail response so the frontend knows whether to show the members card, and gate the members card in `stores/DetailPage.vue` on that field.

**In scope**

- `packages/worker/src/middleware/auth.ts`: extract a shared `resolveUser(c)` helper; add `optionalAuthMiddleware` (sets `c.var.user` when a valid token is present, never rejects anonymous).
- `packages/worker/src/stores/router.ts`: apply `optionalAuthMiddleware` to `GET /:id`; keep `authMiddleware` on `GET /:id/members`.
- `packages/worker/src/stores/service.ts`:
  - `getStore` accepts an optional viewer and returns `{ ...store, viewer_role }` where `viewer_role` is the membership role, `'admin'`, or `null`.
  - `getMembers` keeps the membership gate but allows admins to read any store's members.
- `packages/frontend/src/pages/stores/DetailPage.vue`: render the members card and call `getMembers` only when `store.viewer_role` is truthy.
- Worker + frontend tests, docs, `CHANGELOG.md`.

**Out of scope**

- `POST /:id/members` and `DELETE /:id/members/:userId` — unchanged (still `authMiddleware` + role checks).
- Store ownership transfer / member management UI — unchanged.
- Public visibility of members — explicitly rejected; the roster stays private.
- Changes to the shared `StoreSchema` — `viewer_role` is a Worker response-only field and must NOT be added to the DB-backed schema (Zod strips unknown keys, so it is attached after `StoreSchema.parse`).

## 2. Definitions

- **Store membership**: A row in `store_memberships` linking a user to a store with a role (`owner`, `manager`, `staff`).
- **`viewer_role`**: A response-only field on `GET /api/stores/:id` describing the requesting viewer's relationship to the store: the viewer's membership role, `'admin'`, or `null` (anonymous / non-member / banned / deleted).
- **Optional auth**: A middleware that resolves the user from a Bearer token if one is present and valid, but does not reject anonymous requests.
- **403 Forbidden**: HTTP status from the Worker's `forbidden(c)` helper.

## 3. Requirements, Constraints & Guidelines

### Worker — members listing (stays private)

- **REQ-001**: `GET /api/stores/:id/members` shall remain `authMiddleware`-protected and shall return the roster only to store members (owner/manager/staff). Anonymous → 401, authenticated non-member → 403 (unchanged).
- **REQ-002**: Admins shall be able to read any store's members (`GET /api/stores/:id/members` returns 200 for an admin regardless of membership), so `/admin/stores/:id` keeps working.
- **REQ-003**: `POST /:id/members` and `DELETE /:id/members/:userId` authorization is unchanged.

### Worker — store detail (viewer-aware, still public)

- **REQ-004**: `GET /api/stores/:id` shall remain publicly accessible (anonymous callers get the store).
- **REQ-005**: `GET /api/stores/:id` shall include `viewer_role` on the response `data` object:
  - viewer is an admin → `'admin'`;
  - viewer is a store member → their membership role (`owner` | `manager` | `staff`);
  - otherwise (anonymous, non-member, banned, or deleted account) → `null`.
- **REQ-006**: The `viewer_role` value must be derived from the viewer's own `Authorization` header via `optionalAuthMiddleware`; it must not leak another user's role.

### Frontend — members card gated

- **REQ-007**: `stores/DetailPage.vue` shall render the `ParticipantListCard` (members) and call `storeStore.getMembers(storeId)` **only** when `store.viewer_role` is truthy.
- **REQ-008**: Non-members and anonymous viewers must never issue a request to `GET /api/stores/:id/members` from the public detail page.

### Constraints & guidelines

- **CON-001**: `viewer_role` is response-only — never persisted and never added to the shared `StoreSchema`. It is attached after `StoreSchema.parse(...)` (Zod strips unknown keys by default).
- **CON-002**: Do not weaken `authMiddleware` or the banned-user check; `optionalAuthMiddleware` treats banned/deleted accounts as anonymous (no `user` set).
- **GUD-001**: Extract the shared user-resolution logic (`resolveUser(c)`) and reuse it in both `authMiddleware` and `optionalAuthMiddleware` (DRY, per AGENTS.md worker guidelines).
- **GUD-002**: Use existing response helpers (`result`, `unauthorized`, `forbidden`) and service-layer `{ data, error, meta }` contracts.
- **GUD-003**: Regression test must fail before the fix and pass after.

## 4. Interfaces & Data Contracts

### Route changes

| Method | Path                              | Before                         | After                                                     |
| ------ | --------------------------------- | ------------------------------ | --------------------------------------------------------- |
| GET    | `/api/stores/:id`                 | public, no viewer info         | `optionalAuthMiddleware`; response includes `viewer_role` |
| GET    | `/api/stores/:id/members`         | `authMiddleware` + member-only | `authMiddleware` + member-only **or admin**               |
| POST   | `/api/stores/:id/members`         | `authMiddleware` + role check  | unchanged                                                 |
| DELETE | `/api/stores/:id/members/:userId` | `authMiddleware` + owner check | unchanged                                                 |

### Store detail response (example)

```json
{
  "data": {
    "id": "00000000-0000-0000-0000-000000000100",
    "name": "Duel Deck",
    "status": "active",
    "is_verified": true,
    "viewer_role": "manager"
  },
  "error": null,
  "meta": null
}
```

`viewer_role` is `null` for anonymous / non-member / banned / deleted viewers.

### Service signatures

```ts
export async function getStore(
  supabase: ReturnType<typeof createSecretClient>,
  id: string,
  viewer?: AuthUser | null,
): Promise<{
  data: (Store & { viewer_role: string | null }) | null;
  error: string | null;
  meta: null;
}>;

export async function getMembers(
  supabase: ReturnType<typeof createSecretClient>,
  user: AuthUser,
  storeId: string,
): Promise<{ data: StoreMembershipRow[] | null; error: string | null; meta: null }>;
```

### Middleware

```ts
// middleware/auth.ts
export async function resolveUser(c: Context): Promise<AuthUser | null>; // shared helper
export async function authMiddleware(c: Context, next: Next); // rejects when resolveUser is null
export async function optionalAuthMiddleware(c: Context, next: Next); // sets c.var.user if resolveUser resolves, always continues
```

## 5. Acceptance Criteria

- **AC-001**: Given an **anonymous** request to `GET /api/stores/:id`, When the store exists, Then the response is `200` and `data.viewer_role` is `null`.
- **AC-002**: Given a request to `GET /api/stores/:id` from an **authenticated non-member**, When the store exists, Then the response is `200` and `data.viewer_role` is `null`.
- **AC-003**: Given a request to `GET /api/stores/:id` from a **store member**, When the store exists, Then `data.viewer_role` equals the member's role.
- **AC-004**: Given a request to `GET /api/stores/:id` from an **admin**, When the store exists, Then `data.viewer_role` is `'admin'`.
- **AC-005**: Given the public store detail page visited by an **anonymous** or **non-member** viewer, When the page loads, Then the members card is hidden and no request is sent to `GET /api/stores/:id/members` (no 401/403).
- **AC-006**: Given the public store detail page visited by a **store member**, When the page loads, Then the members card renders and `GET /api/stores/:id/members` returns `200`.
- **AC-007**: Given an **admin** requesting `GET /api/stores/:id/members` for any store, When called, Then the response is `200` with the member rows.
- **AC-008**: Given an **authenticated non-member** requesting `GET /api/stores/:id/members`, When called, Then the response is `403` (unchanged).
- **AC-009**: Given an **anonymous** request to `GET /api/stores/:id/members`, When called, Then the response is `401` (unchanged).
- **AC-010**: Given `POST /api/stores/:id/members` from a non-member and `DELETE /api/stores/:id/members/:userId` from a non-owner, When called, Then they remain `403` (unchanged).

## 6. Test Automation Strategy

- **Test Levels**: Worker route/service integration tests (Vitest + `createTestApp` mocks); one frontend component test for `stores/DetailPage.vue`.
- **Frameworks**: Vitest; worker uses `packages/worker/src/stores/__tests__/index.test.ts` with `chain()`, `authMock()`, `userChain()`; frontend uses `@vue/test-utils` `shallowMount`.
- **Actions** (TDD order):
  - RED (frontend): Write a `DetailPage` test asserting the members card / `getMembers` call happen only when `store.viewer_role` is truthy (fails before the page change).
  - RED (worker): Write tests for `viewer_role` on `GET /:id` (anonymous → null, member → role, admin → `'admin'`) and admin access to `GET /:id/members` (fails before the service changes).
  - GREEN: implement `resolveUser`/`optionalAuthMiddleware`, `getStore` viewer logic, `getMembers` admin bypass, and the `DetailPage.vue` gating.
  - Keep existing protection tests green: non-member `GET /:id/members` → 403, anonymous → 401, `POST`/`DELETE` guard tests.
- **Test Data Management**: mock `store_memberships` chains for membership lookups; mock `users` chain for auth resolution.
- **CI/CD Integration**: `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm knip`, `pnpm format:check` in the pre-push pipeline.
- **Manual verification**: as a non-member and logged out, open `/stores/:id` — no members card and no 401/403 in the network tab; as a store member/admins, the card shows.

## 7. Rationale & Context

The members roster is private by documented design: `spec-006` (`GET /api/stores/:id/members` "must list store members (owner/manager only)") and the current backend gate both treat membership as management data. The bug is a frontend/backend contract mismatch — the public profile page renders a members card and calls the protected endpoint unconditionally, producing 401/403 for every non-member. The audit-hardening convention in this repo (P0/P1, spec-069/070) also favors explicit authorization over widening read access.

Fixing it privately (rather than making the roster public) preserves privacy and the documented contract. To avoid merely suppressing the error while still firing a 403, the frontend needs to know the viewer's standing _before_ calling the members endpoint — hence `viewer_role` on the public store detail response via optional auth. The admin bypass on the members endpoint fixes a latent bug where `/admin/stores/:id` showed an empty members list because admins are not store members.

## 8. Dependencies & External Integrations

### External Systems

- **EXT-001**: Supabase (PostgreSQL) — `game_stores`, `store_memberships`, `users` tables; no schema changes.

### Third-Party Services

- **SVC-001**: None.

### Infrastructure Dependencies

- **INF-001**: None.

### Data Dependencies

- **DAT-001**: None new; membership lookup (`findStoreMembership`) and member join (`findStoreMembers`) already exist.

### Technology Platform Dependencies

- **PLT-001**: Hono Worker (middleware, `c.var.user`); `@supabase/supabase-js` `auth.getUser`.

### Compliance Dependencies

- **COM-001**: None.

## 9. Examples & Edge Cases

### `resolveUser` shared helper (auth middleware)

```ts
// authMiddleware
const user = await resolveUser(c);
if (!user) return unauthorized(c);
c.set('user', user);
await next();

// optionalAuthMiddleware
const user = await resolveUser(c);
if (user) c.set('user', user);
await next();
```

### `getStore` viewer logic

```ts
export async function getStore(supabase, id, viewer = null) {
  const data = await findStoreById(supabase, id);
  if (!data) return { data: null, error: 'Store not found', meta: null };

  let viewerRole: string | null = null;
  if (viewer) {
    if (viewer.role === ROLES[2]) {
      viewerRole = 'admin';
    } else {
      const m = await findStoreMembership(supabase, id, viewer.id);
      viewerRole = m?.role ?? null;
    }
  }
  return { data: { ...StoreSchema.parse(data), viewer_role: viewerRole }, error: null, meta: null };
}
```

### `getMembers` admin bypass

```ts
export async function getMembers(supabase, user, storeId) {
  if (user.role !== ROLES[2]) {
    const membership = await findStoreMembership(supabase, storeId, user.id);
    if (!membership) return { data: null, error: 'Forbidden', meta: null };
  }
  const data = await findStoreMembers(supabase, storeId);
  return { data, error: null, meta: null };
}
```

### `DetailPage.vue` gating

```ts
const isStoreTeam = computed(() => Boolean(store.value?.viewer_role));

onMounted(async () => {
  await storeStore.get(storeId);
  if (isStoreTeam.value) {
    members.value = ((await storeStore.getMembers(storeId)) ?? []) as Participant[];
  }
});
```

Edge cases:

- Banned or soft-deleted viewer → `optionalAuthMiddleware` does not set `user`; `viewer_role` is `null` (never leaks a banned account's role).
- Store with no members, viewed by a member → `getMembers` returns `200` with `[]`; the `store.noMembers` empty state renders.
- Anonymous admin path impossible (admins must authenticate); `viewer_role` stays `null` for anonymous.
- `viewer_role` must not be persisted or round-tripped through `StoreSchema`; attach after `parse` only.

## 10. Validation Criteria

- `pnpm test` passes (new worker `viewer_role`/admin-bypass tests, new frontend `DetailPage` gating test, full suites).
- `pnpm lint`, `pnpm typecheck`, `pnpm knip`, `pnpm format:check` pass.
- No `createClient`/middleware duplication; `authMiddleware` and `optionalAuthMiddleware` share `resolveUser`.
- `docs/requirements.md` updated if affected; `CHANGELOG.md` updated.
- Manual: non-member / anonymous store visits issue no members request; member/admin visits show the roster.

## 11. Related Specifications / Further Reading

- `spec-006-game-stores-api.md` — original store API contract (REQ-008: members list is owner/manager-only)
- `spec-042-admin-store-detail.md` — admin store detail page (members section)
- `spec-072-detail-page-card-refactor.md` — `ParticipantListCard` / store members card
- `spec-069-audit-remediation-p0.md` / `spec-070-audit-remediation-p1.md` — authorization & DRY quality gates
- Hono middleware: https://hono.dev/docs/guides/middleware
- Supabase auth JWT verification: https://supabase.com/docs/reference/javascript/auth-getuser
